import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { roleId } = body || {};
  if (roleId !== null && typeof roleId !== 'string') {
    return NextResponse.json({ error: 'Invalid roleId' }, { status: 400 });
  }

  // Prevent changing role for SUPER_ADMIN admins
  const targetAdmin = await prisma.admin.findUnique({ where: { id: params.id } });
  if (!targetAdmin) return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
  if (targetAdmin.role === 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Cannot modify SUPER_ADMIN role' }, { status: 400 });
  }

  if (typeof roleId === 'string') {
    const role = await prisma.adminRole.findUnique({ where: { id: roleId } });
    if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });
  }

  const updated = await prisma.admin.update({
    where: { id: params.id },
    data: { roleId: roleId ?? null },
  });

  return NextResponse.json({ success: true, data: updated });
}


