// Expert Section API Route
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || 'active';
    let data;

    if (path === 'active') {
      data = await prisma.expertSection.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' },
      });
    } else if (path === 'all') {
      data = await prisma.expertSection.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } else {
      data = await prisma.expertSection.findUnique({
        where: { id: path },
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching expert section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch expert section' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const data = await prisma.expertSection.create({
      data: {
        titleLine1: body.titleLine1 || 'Unlock Your Visa Success with',
        titleLine2: body.titleLine2 || 'Unlimited Access to a',
        titleLine3: body.titleLine3 || 'Accountability Expert',
        originalPrice: body.originalPrice || '£35/ Month',
        offerPrice: body.offerPrice || 'Free',
        offerDescription: body.offerDescription || 'with next 100 visa applications!',
        expertImage: body.expertImage || '/image/expert.png',
        defaultSpotsLeft: body.defaultSpotsLeft ?? 12,
        isActive: body.isActive !== undefined ? body.isActive : true,
        updatedBy: body.updatedBy || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('Error creating expert section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create expert section' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    let data;

    if (action === 'toggle') {
      const existing = await prisma.expertSection.findUnique({
        where: { id },
      });

      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Expert section not found' },
          { status: 404 }
        );
      }

      data = await prisma.expertSection.update({
        where: { id },
        data: { isActive: !existing.isActive },
      });
    } else {
      const body = await request.json();

      data = await prisma.expertSection.update({
        where: { id },
        data: {
          titleLine1: body.titleLine1,
          titleLine2: body.titleLine2,
          titleLine3: body.titleLine3,
          originalPrice: body.originalPrice,
          offerPrice: body.offerPrice,
          offerDescription: body.offerDescription,
          expertImage: body.expertImage,
          defaultSpotsLeft: body.defaultSpotsLeft,
          isActive: body.isActive,
          updatedBy: body.updatedBy,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('Error updating expert section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update expert section' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    const existing = await prisma.expertSection.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Expert section not found' },
        { status: 404 }
      );
    }

    await prisma.expertSection.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Expert section deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting expert section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete expert section' },
      { status: 500 }
    );
  }
}
