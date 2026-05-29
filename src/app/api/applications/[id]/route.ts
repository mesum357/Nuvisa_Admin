import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { backendGet, backendPatch } from '@/lib/backend-client';
import { sendEmail, getApplicationStatusEmailTemplate } from '@/lib/email';
import {
  getPassportStatusLabel,
  getPassportStatusMessage,
  mapAdminStatusKeyToBackend,
  mapAdminStatusKeyToPrisma,
  isPassportFinalStage,
} from '@/lib/passportStatusMessages';
import {
  getApplicationStatusLabel,
  getApplicationStatusMessage,
} from '@/lib/applicationStatusMessages';
import { formatStatusForEmail, isSuperAdmin } from '@/lib/utils';
import { ensureApplicationAccess } from '@/lib/application-access-server';

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
        const access = await ensureApplicationAccess(session.user as any, id);
        if (!access.allowed) {
          return NextResponse.json(
            { error: access.status === 404 ? 'Application not found' : 'Forbidden' },
            { status: access.status }
          );
        }

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

    const access = await ensureApplicationAccess(session.user as any, id);
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.status === 404 ? 'Application not found' : 'Forbidden' },
        { status: access.status }
      );
    }

    const data = await request.json();
    const { status, sendNotification, oldStatus, statusDisplay, ...updateData } = data;

    const formattedOldStatus = formatStatusForEmail(String(oldStatus || ''));
    const backendStatus = status ? mapAdminStatusKeyToBackend(status) : undefined;
    const isPassport = status ? isPassportFinalStage(String(status)) : false;
    const emailStatusLabel = status
      ? isPassport
        ? getPassportStatusLabel(String(status))
        : getApplicationStatusLabel(backendStatus || String(status))
      : '';
    const emailStatusMessage = status
      ? isPassport
        ? getPassportStatusMessage(String(status))
        : getApplicationStatusMessage(backendStatus || String(status))
      : '';
    const formattedStatus = emailStatusLabel || formatStatusForEmail(String(status || ''));

    // ALWAYS try to update the backend first (visa_applications table)
    try {
      const backendPayload: Record<string, unknown> = {
        status: backendStatus,
        note: updateData.note,
        sendNotification: sendNotification !== false,
        adminStatusKey: status,
      };

      if (formattedOldStatus) {
        backendPayload.oldStatus = formattedOldStatus;
      }
      if (emailStatusLabel) {
        backendPayload.statusDisplay = emailStatusLabel;
        backendPayload.statusMessage = emailStatusMessage;
      }

      console.log('[admin/applications PATCH] updating status', {
        id,
        adminStatusKey: status,
        backendStatus,
        sendNotification: sendNotification !== false,
      });

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
          status: status || app.adminStatusKey || app.applicationStatus || app.status,
          adminStatusKey: app.adminStatusKey || status,
          statusDisplay: app.statusDisplay || emailStatusLabel || formattedStatus,
          statusMessage: app.statusMessage || emailStatusMessage,
          totalAmount: app.totalAmount || app.amountPaidTotal || app.amountPaid || 0,
          paidAmount: app.paidAmount || app.amountPaidTotal || app.amountPaid || 0,
          submittedAt: app.submittedAt || app.createdAt,
          country: app.country,
          user: app.user || { id: app.email, name: app.email, email: app.email }
        };

        console.log('[admin/applications PATCH] status saved', {
          id,
          status: formattedData.status,
          statusDisplay: formattedData.statusDisplay,
          email: sendNotification !== false ? 'delegated-to-backend' : 'skipped',
        });
        
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

    const prismaStatus = status ? mapAdminStatusKeyToPrisma(status) : undefined;

    if (prismaStatus && prismaStatus !== currentApplication.status) {
      await prisma.applicationStatusHistory.create({
        data: {
          applicationId: id,
          oldStatus: currentApplication.status,
          newStatus: prismaStatus as any,
          changedBy: (session.user as { id: string }).id,
          note: updateData.note || null,
        },
      });

      await prisma.application.update({
        where: { id },
        data: { status: prismaStatus as any },
      });

      if (sendNotification) {
        const emailHtml = getApplicationStatusEmailTemplate(
          'Applicant',
          currentApplication.applicationNo,
          status,
          updateData.note
        );

        const emailOk = await sendEmail({
          to: currentApplication.user.email,
          subject: `Application ${currentApplication.applicationNo} Status Update`,
          html: emailHtml,
        });
        console.log('[admin/applications PATCH] prisma email', {
          id,
          attempted: true,
          success: emailOk,
          to: currentApplication.user.email,
        });
      } else {
        console.log('[admin/applications PATCH] prisma email skipped (sendNotification=false)');
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
