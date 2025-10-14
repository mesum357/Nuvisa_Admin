import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';

    // Prisma client may be out of date if generate/migrate hasn't run
    const hasAdminRoleModel = typeof (prisma as any)?.adminRole?.findMany === 'function';
    if (!hasAdminRoleModel) {
      return NextResponse.json({
        error: 'Prisma client missing adminRole. Run prisma generate and migrate.'
      }, { status: 500 });
    }

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const roles = await prisma.adminRole.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: roles });
  } catch (error: any) {
    const message = typeof error?.message === 'string' ? error.message : 'Failed to fetch roles';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, description, permissions } = body || {};
    if (!name || typeof permissions !== 'object' || permissions === null) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const hasAdminRoleModel = typeof (prisma as any)?.adminRole?.create === 'function';
    if (!hasAdminRoleModel) {
      return NextResponse.json({
        error: 'Prisma client missing adminRole. Run prisma generate and migrate.'
      }, { status: 500 });
    }

    const role = await prisma.adminRole.create({
      data: { name, description: description || null, permissions, isSystem: false },
    });
    return NextResponse.json({ success: true, data: role });
  } catch (error: any) {
    const message = typeof error?.message === 'string' ? error.message : 'Failed to create role';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


