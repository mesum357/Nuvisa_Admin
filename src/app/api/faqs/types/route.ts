import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

type FAQTypeGroup = {
  faqType?: string | null;
  _count?: { id?: number };
  _min?: { faqTypeCreatedAt?: Date | null; createdAt?: Date | null };
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const faqTypeCounts = (await prisma.fAQ.groupBy({
      by: ['faqType'],
      _count: { id: true },
      _min: { faqTypeCreatedAt: true, createdAt: true },
      where: {
        NOT: [{ faqType: null }, { faqType: '' }],
      },
    })) as FAQTypeGroup[];

    const types = faqTypeCounts
      .filter((ft) => ft.faqType)
      .map((ft) => ({
        name: ft.faqType as string,
        count: ft._count?.id ?? 0,
        createdAt: ft._min?.faqTypeCreatedAt ?? ft._min?.createdAt ?? null,
      }))
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
        if (aTime !== bTime) return aTime - bTime;
        return a.name.localeCompare(b.name);
      });

    return NextResponse.json({ success: true, data: types });
  } catch (error) {
    console.error('Error fetching FAQ types:', error);
    return NextResponse.json({ error: 'Failed to fetch FAQ types' }, { status: 500 });
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

    const userId = (session.user as { id?: string }).id;

    const result = await prisma.fAQ.updateMany({
      where: {
        OR: [{ faqType: trimmedOldType }, { category: trimmedOldType }],
      },
      data: {
        faqType: trimmedNewType,
        category: trimmedNewType,
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
  } catch (error) {
    console.error('Error renaming FAQ type:', error);
    return NextResponse.json({ error: 'Failed to rename FAQ type' }, { status: 500 });
  }
}
