import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { backendPatch } from '@/lib/backend-client';
import prisma from '@/lib/prisma';
import { isSuperAdminUser } from '@/lib/application-access';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSuperAdminUser(session.user as any)) {
      return NextResponse.json(
        { error: 'Only super admins can assign applications' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    if (body.assignedAdminId) {
      const assignee = await prisma.admin.findUnique({
        where: { id: body.assignedAdminId },
      });
      if (!assignee || assignee.role !== 'ADMIN' || !assignee.isActive) {
        return NextResponse.json(
          { error: 'Assignee must be an active sub-admin' },
          { status: 400 }
        );
      }
      body.assignedAdminEmail = assignee.email;
      body.assignedAdminName = assignee.name;
    }

    const adminEmail = (session.user as { email?: string })?.email;
    const be = await backendPatch(
      `/orders/application/${id}/assign`,
      {
        ...body,
        adminEmail: body.adminEmail || adminEmail,
      },
      adminEmail
    );

    if (!be.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to assign application', details: be.data },
        { status: be.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: be.data?.data || be.data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to assign application', details: error?.message },
      { status: 500 }
    );
  }
}
