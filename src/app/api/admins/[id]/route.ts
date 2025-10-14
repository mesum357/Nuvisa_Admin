import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, isActive, roleId } = body || {};
    const { id } = await params;

    const target = await prisma.admin.findUnique({ where: { id } });
    if (!target) return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    if (target.role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Cannot modify SUPER_ADMIN' }, { status: 400 });
    }

    if (roleId) {
      const role = await prisma.adminRole.findUnique({ where: { id: roleId } });
      if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const updated = await prisma.admin.update({
      where: { id },
      data: {
        name: typeof name === 'string' ? name : undefined,
        isActive: typeof isActive === 'boolean' ? isActive : undefined,
        roleId: typeof roleId === 'string' ? roleId : roleId === null ? null : undefined,
      },
      include: { customRole: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update admin' }, { status: 500 });
  }
}


