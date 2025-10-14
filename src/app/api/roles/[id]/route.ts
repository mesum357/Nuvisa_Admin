import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const role = await prisma.adminRole.findUnique({ where: { id } });
  if (!role) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true, data: role });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const { name, description, permissions } = body || {};
  const { id } = await params;
  // Disallow editing system roles (e.g., seeded defaults)
  const existing = await prisma.adminRole.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.isSystem) {
    return NextResponse.json({ error: 'Cannot edit system role' }, { status: 400 });
  }
  const data: any = {};
  if (typeof name === 'string') data.name = name;
  if (typeof description === 'string' || description === null) data.description = description ?? null;
  if (permissions && typeof permissions === 'object') data.permissions = permissions;
  try {
    const updated = await prisma.adminRole.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: updated });
  } catch (_e) {
    return NextResponse.json({ error: 'Update failed' }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    const role = await prisma.adminRole.findUnique({ where: { id } });
    if (!role) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (role.isSystem) return NextResponse.json({ error: 'Cannot delete system role' }, { status: 400 });
    await prisma.admin.updateMany({ where: { roleId: id }, data: { roleId: null } });
    await prisma.adminRole.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (_e) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 400 });
  }
}


