import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { backendGet, backendPatch } from '@/lib/backend-client';
import { sendEmail, getApplicationStatusEmailTemplate } from '@/lib/email';
import { formatStatusForEmail } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        user: true,
        documents: true,
        comments: {
          orderBy: { createdAt: 'desc' },
        },
        statusHistory: {
          orderBy: { changedAt: 'desc' },
        },
      },
    });

    // Fallback to backend if not in Prisma DB
    if (!application) {
      try {
        const be = await backendGet(`/orders/application/${id}`);
        if (be.ok) {
          const payload: any = be.data?.data || be.data || {};
          
          // Ensure the backend data includes formatted application numbers
          const formattedData = {
            ...payload,
            // Use formatted values if available, otherwise format them
            applicationNo: payload.formattedApplicationId || payload.applicationNo || payload.code || payload.id?.slice(0, 8),
            orderId: payload.formattedOrderId || payload.orderId,
            // Ensure consistent field names
            id: payload.id || payload.applicationId || id,
            status: payload.applicationStatus || payload.status,
            totalAmount: payload.totalAmount || payload.amountPaidTotal || payload.amountPaid || 0,
            paidAmount: payload.paidAmount || payload.amountPaidTotal || payload.amountPaid || 0,
            submittedAt: payload.submittedAt || payload.createdAt,
            country: payload.country,
            user: payload.user || { id: payload.email, name: payload.email, email: payload.email }
          };
          
          return NextResponse.json({ success: true, data: formattedData });
        }
      } catch {}

      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...application,
        totalAmount: Number(application.totalAmount),
        paidAmount: Number(application.paidAmount),
      },
    });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();
    const { status, sendNotification, oldStatus, statusDisplay, ...updateData } = data;

    // Map frontend status to backend status format
    const mapStatusToBackend = (frontendStatus: string) => {
      const statusMap: Record<string, string> = {
        'PENDING': 'submitted',
        'SUBMITTED': 'submitted',
        'UNDER_REVIEW': 'under_review',
        'APPOINTMENT_BOOKED': 'appointment_booked',
        'AT_EMBASSY': 'at_embassy',
        'DECISION_MADE': 'decision_made',
        'APPROVED': 'decision_made',
        'REJECTED': 'decision_made',
        'COMPLETED': 'completed'
      };
      return statusMap[frontendStatus] || frontendStatus.toLowerCase();
    };

    const formattedOldStatus = formatStatusForEmail(String(oldStatus || ''));
    const formattedStatus = formatStatusForEmail(String(statusDisplay || status || ''));

    // ALWAYS try to update the backend first (visa_applications table)
    const backendStatus = status ? mapStatusToBackend(status) : undefined;
    try {
      const backendPayload: Record<string, unknown> = {
        status: backendStatus,
        note: updateData.note,
        sendNotification,
      };

      // Pass display-friendly values for email templates expecting old/new status text.
      if (formattedOldStatus) {
        backendPayload.oldStatus = formattedOldStatus;
      }
      if (formattedStatus) {
        backendPayload.statusDisplay = formattedStatus;
        backendPayload.newStatus = formattedStatus;
      }

      const be = await backendPatch(
        `/orders/application/${id}/status`, 
        backendPayload, 
        (session.user as { email?: string })?.email
      );
      if (be.ok) {
        const app: any = be.data?.data?.results || be.data?.data || be.data || {};
        
        // Ensure the updated data includes formatted application numbers
        const formattedData = {
          ...app,
          // Use formatted values if available, otherwise format them
          applicationNo: app.formattedApplicationId || app.applicationNo || app.code || app.id?.slice(0, 8),
          orderId: app.formattedOrderId || app.orderId,
          // Ensure consistent field names
          id: app.id || app.applicationId || id,
          status: app.applicationStatus || app.status,
          totalAmount: app.totalAmount || app.amountPaidTotal || app.amountPaid || 0,
          paidAmount: app.paidAmount || app.amountPaidTotal || app.amountPaid || 0,
          submittedAt: app.submittedAt || app.createdAt,
          country: app.country,
          user: app.user || { id: app.email, name: app.email, email: app.email }
        };
        
        return NextResponse.json({ success: true, data: formattedData });
      }
    } catch (backendError: any) {
      console.error('Backend update failed, trying Prisma fallback:', backendError);
      // Return error response instead of falling back to Prisma
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to update application status in backend',
          details: backendError?.message || 'Unknown error'
        }, 
        { status: 500 }
      );
    }

    // Fallback to Prisma DB if backend fails or application exists only in Prisma
    const currentApplication = await prisma.application.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!currentApplication) {
      return NextResponse.json(
        { error: 'Application not found in both backend and Prisma DB' },
        { status: 404 }
      );
    }

    const application = await prisma.application.update({
      where: { id },
      data: updateData,
      include: {
        user: true,
        documents: true,
      },
    });

    if (status && status !== currentApplication.status) {
      await prisma.applicationStatusHistory.create({
        data: {
          applicationId: id,
          oldStatus: currentApplication.status,
          newStatus: status,
          changedBy: (session.user as { id: string }).id,
          note: updateData.note || null,
        },
      });

      await prisma.application.update({
        where: { id },
        data: { status },
      });

      if (sendNotification) {
        const emailHtml = getApplicationStatusEmailTemplate(
          currentApplication.user.name,
          currentApplication.applicationNo,
          status,
          updateData.note
        );

        await sendEmail({
          to: currentApplication.user.email,
          subject: `Application ${currentApplication.applicationNo} Status Update`,
          html: emailHtml,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...application,
        totalAmount: Number(application.totalAmount),
        paidAmount: Number(application.paidAmount),
      },
    });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.application.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Application deleted successfully',
    });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to delete application' },
      { status: 500 }
    );
  }
}
