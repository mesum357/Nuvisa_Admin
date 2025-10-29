import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const section = searchParams.get('section');
    const isActive = searchParams.get('isActive');

    const where: any = {};
    if (section) where.section = section;
    if (isActive !== null) where.isActive = isActive === 'true';

    const contents = await prisma.sliderContent.findMany({
      where,
      orderBy: [
        { section: 'asc' },
        { order: 'asc' },
        { key: 'asc' },
      ],
    });

    return NextResponse.json({ success: true, data: contents });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to fetch slider content' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { key, value, type = 'text', section, order = 0, isActive = true } = body;

    const created = await prisma.sliderContent.create({
      data: { key, value, type, section, order, isActive, updatedBy: session.user?.email || null },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to create slider content' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { key, value, type, section, order, isActive } = body;

    const updated = await prisma.sliderContent.update({
      where: { key },
      data: {
        ...(value !== undefined ? { value } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(section !== undefined ? { section } : {}),
        ...(order !== undefined ? { order } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
        updatedBy: session.user?.email || null,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to update slider content' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    await prisma.sliderContent.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to delete slider content' }, { status: 500 });
  }
}


