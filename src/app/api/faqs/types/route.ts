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

    const faqTypeCounts = await prisma.fAQ.groupBy({
      by: ['faqType'],
      _count: {
        id: true,
      },
      where: {
        NOT: [{ faqType: null }, { faqType: '' }],
      },
    });

    const countsByType = new Map(
      faqTypeCounts
        .filter((ft) => ft.faqType)
        .map((ft) => [ft.faqType as string, ft._count.id])
    );

    const types = Array.from(countsByType.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      success: true,
      data: types,
    });
  } catch (error: any) {
    console.error('Error fetching FAQ types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FAQ types' },
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

    const { oldType, newType } = await request.json();
    const trimmedOldType = typeof oldType === 'string' ? oldType.trim() : '';
    const trimmedNewType = typeof newType === 'string' ? newType.trim() : '';

    if (!trimmedOldType || !trimmedNewType) {
      return NextResponse.json(
        { error: 'oldType and newType are required' },
        { status: 400 }
      );
    }

    if (trimmedOldType === trimmedNewType) {
      return NextResponse.json(
        { error: 'New type must be different from old type' },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id as string | undefined;

    const result = await prisma.fAQ.updateMany({
      where: {
        faqType: trimmedOldType,
      },
      data: {
        faqType: trimmedNewType,
        updatedBy: userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully renamed "${trimmedOldType}" to "${trimmedNewType}". Updated ${result.count} FAQs.`,
      data: {
        oldType: trimmedOldType,
        newType: trimmedNewType,
        updatedCount: result.count,
      },
    });
  } catch (error: any) {
    console.error('Error renaming FAQ type:', error);

    return NextResponse.json(
      { error: 'Failed to rename FAQ type' },
      { status: 500 }
    );
  }
}
