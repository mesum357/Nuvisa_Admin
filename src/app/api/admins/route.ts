import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, email, password, roleId, isActive } = await request.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let linkedRole = null as any;
    if (roleId) {
      linkedRole = await prisma.adminRole.findUnique({ where: { id: roleId } });
      if (!linkedRole) return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const hashed = await hashPassword(password);

    const created = await prisma.admin.create({
      data: {
        name,
        email,
        password: hashed,
        role: 'ADMIN',
        isActive: typeof isActive === 'boolean' ? isActive : true,
        roleId: roleId || null,
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    const message = typeof error?.message === 'string' ? error.message : 'Failed to create admin';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const assignable = searchParams.get('assignable') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    if (assignable) {
      if ((session.user as { role?: string })?.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const admins = await prisma.admin.findMany({
        where: {
          role: 'ADMIN',
          isActive: true,
          ...(search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { email: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' },
      });

      return NextResponse.json({ success: true, data: admins });
    }

    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [admins, total] = await Promise.all([
      prisma.admin.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { customRole: true },
      }),
      prisma.admin.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        data: admins,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch admins' }, { status: 500 });
  }
}


