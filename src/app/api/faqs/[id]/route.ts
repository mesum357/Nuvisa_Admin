import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UpdateFAQData } from '@/types';
import { buildFaqUpdateData, formatFaqForApi } from '@/lib/faq-utils';

const resolveFaqTypeCreatedAt = async (
  faqType: string,
  excludeId?: string
): Promise<Date> => {
  const where: { faqType: string; id?: { not: string } } = { faqType };
  if (excludeId) where.id = { not: excludeId };

  const existingType = await prisma.fAQ.aggregate({
    where,
    _min: { faqTypeCreatedAt: true, createdAt: true },
  });

  return existingType._min.faqTypeCreatedAt ?? existingType._min.createdAt ?? new Date();
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const faq = await prisma.fAQ.findUnique({ where: { id } });

    if (!faq) {
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: formatFaqForApi(faq) });
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    return NextResponse.json({ error: 'Failed to fetch FAQ' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data: UpdateFAQData = await request.json();
    const userId = (session.user as { id?: string }).id;

    const updateData = buildFaqUpdateData(data as Record<string, unknown>);

    if (Object.prototype.hasOwnProperty.call(data, 'faqType')) {
      const trimmedFaqType = typeof data.faqType === 'string' ? data.faqType.trim() : '';

      if (!trimmedFaqType) {
        updateData.faqType = null;
        updateData.category = null;
        updateData.faqTypeCreatedAt = null;
      } else {
        const currentFaq = await prisma.fAQ.findUnique({
          where: { id },
          select: { faqType: true },
        });

        if (!currentFaq) {
          return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
        }

        updateData.faqType = trimmedFaqType;
        updateData.category = trimmedFaqType;
        if (currentFaq.faqType !== trimmedFaqType) {
          updateData.faqTypeCreatedAt = await resolveFaqTypeCreatedAt(trimmedFaqType, id);
        }
      }
    }

    const faq = await prisma.fAQ.update({
      where: { id },
      data: {
        ...updateData,
        updatedBy: userId,
      },
    });

    return NextResponse.json({ success: true, data: formatFaqForApi(faq) });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    return NextResponse.json({ error: 'Failed to update FAQ' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.fAQ.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'FAQ deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    return NextResponse.json({ error: 'Failed to delete FAQ' }, { status: 500 });
  }
}
