import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const section = searchParams.get('section');
    const isActive = searchParams.get('isActive');

    const where: any = {};
    if (section) where.section = section;
    if (isActive !== null) where.isActive = isActive === 'true';

    const contents = await prisma.footerContent.findMany({
      where,
      orderBy: [
        { section: 'asc' },
        { order: 'asc' },
        { key: 'asc' }
      ],
    });

    return NextResponse.json({
      success: true,
      data: contents,
    });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to fetch footer content' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const content = await prisma.footerContent.create({
      data: {
        ...data,
        updatedBy: (session.user as any).id,
      },
    });

    return NextResponse.json({
      success: true,
      data: content,
    });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to create footer content' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { key, value, type, section, isActive, order } = data;

    const content = await prisma.footerContent.upsert({
      where: { key },
      update: {
        value,
        type: type || 'text',
        section: section || 'general',
        isActive: isActive !== undefined ? isActive : true,
        order: order || 0,
        updatedBy: (session.user as any).id,
      },
      create: {
        key,
        value,
        type: type || 'text',
        section: section || 'general',
        isActive: isActive !== undefined ? isActive : true,
        order: order || 0,
        updatedBy: (session.user as any).id,
      },
    });

    return NextResponse.json({
      success: true,
      data: content,
    });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to update footer content' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.footerContent.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Footer content deleted successfully',
    });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to delete footer content' },
      { status: 500 }
    );
  }
}
