import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { backendGet, backendPatch } from '@/lib/backend-client';
import { sendEmail, getApplicationStatusEmailTemplate } from '@/lib/email';

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
          const payload: unknown = be.data?.data || be.data || {};
          // Return backend payload as-is so the client gets the exact data for the id
          return NextResponse.json({ success: true, data: payload });
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
    const { status, sendNotification, ...updateData } = data;

    // Map frontend status to backend status format
    const mapStatusToBackend = (frontendStatus: string) => {
      const statusMap: Record<string, string> = {
        'PENDING': 'submitted',
        'UNDER_REVIEW': 'under_review',
        'APPROVED': 'approved',
        'REJECTED': 'rejected',
        'COMPLETED': 'completed'
      };
      return statusMap[frontendStatus] || frontendStatus.toLowerCase();
    };

    // ALWAYS try to update the backend first (visa_applications table)
    const backendStatus = status ? mapStatusToBackend(status) : undefined;
    try {
      const be = await backendPatch(
        `/orders/application/${id}/status`, 
        { status: backendStatus, note: updateData.note, sendNotification }, 
        (session.user as { email?: string })?.email
      );
      if (be.ok) {
        const app: unknown = be.data?.data?.results || be.data?.data || be.data || {};
        // Return backend payload directly so details reflect exact record
        return NextResponse.json({ success: true, data: app });
      }
    } catch (backendError) {
      console.error('Backend update failed, trying Prisma fallback:', backendError);
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

