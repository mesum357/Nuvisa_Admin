import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendEmail, getApplicationStatusEmailTemplate } from '@/lib/email';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const application = await prisma.application.findUnique({
      where: { id: params.id },
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

    if (!application) {
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
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { status, sendNotification, ...updateData } = data;

    const currentApplication = await prisma.application.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!currentApplication) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    const application = await prisma.application.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: true,
        documents: true,
      },
    });

    if (status && status !== currentApplication.status) {
      await prisma.applicationStatusHistory.create({
        data: {
          applicationId: params.id,
          oldStatus: currentApplication.status,
          newStatus: status,
          changedBy: (session.user as any).id,
          note: updateData.note || null,
        },
      });

      await prisma.application.update({
        where: { id: params.id },
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
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.application.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Application deleted successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete application' },
      { status: 500 }
    );
  }
}

