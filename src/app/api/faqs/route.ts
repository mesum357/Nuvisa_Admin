import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { CreateFAQData } from '@/types';
import {
  applyFeaturedFilter,
  buildFaqCreateData,
  formatFaqsForApi,
  resolveTabName,
} from '@/lib/faq-utils';

type FAQTypeGroup = {
  faqType?: string | null;
  _count?: { id?: number };
  _min?: { faqTypeCreatedAt?: Date | null; createdAt?: Date | null };
};

const resolveFaqTypeCreatedAt = async (
  faqType: string | null
): Promise<Date | null> => {
  if (!faqType) return null;

  const existingType = await prisma.fAQ.aggregate({
    where: { faqType },
    _min: { faqTypeCreatedAt: true, createdAt: true },
  });

  return existingType._min.faqTypeCreatedAt ?? existingType._min.createdAt ?? new Date();
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const faqType = searchParams.get('faqType');
    const isFeatured = searchParams.get('isFeatured');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};

    const tabFilter = resolveTabName(faqType, category);
    const andClauses: Record<string, unknown>[] = [];

    if (tabFilter) {
      andClauses.push({
        OR: [{ category: tabFilter }, { faqType: tabFilter }],
      });
    }

    if (search) {
      andClauses.push({
        OR: [
          { question: { contains: search, mode: 'insensitive' } },
          { answer: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
          { faqType: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (andClauses.length) {
      where.AND = andClauses;
    }

    applyFeaturedFilter(where, isFeatured);

    if (isActive !== null && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    const faqs = await prisma.fAQ.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    let types: { name: string; count: number; createdAt: Date | null }[] | undefined;
    if (isFeatured === 'true') {
      const typesWhere: Record<string, unknown> = {
        ...where,
        isFeatured: true,
        NOT: [{ faqType: null }, { faqType: '' }],
      };
      delete typesWhere.OR;

      const faqTypeGroups = (await prisma.fAQ.groupBy({
        by: ['faqType'],
        _count: { id: true },
        _min: { faqTypeCreatedAt: true, createdAt: true },
        where: typesWhere,
      })) as FAQTypeGroup[];

      types = faqTypeGroups
        .filter((group) => group.faqType)
        .map((group) => ({
          name: group.faqType as string,
          count: group._count?.id ?? 0,
          createdAt: group._min?.faqTypeCreatedAt ?? group._min?.createdAt ?? null,
        }))
        .sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
          if (aTime !== bTime) return aTime - bTime;
          return a.name.localeCompare(b.name);
        });
    }

    return NextResponse.json({
      success: true,
      data: formatFaqsForApi(faqs),
      ...(types ? { types } : {}),
    });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json({ error: 'Failed to fetch FAQs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data: CreateFAQData = await request.json();
    const { question, answer, category, faqType, order, isActive = true, is_featured = true } =
      data;

    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Question and answer are required' },
        { status: 400 }
      );
    }

    const userId = (session.user as { id?: string }).id;
    const resolvedFaqType = resolveTabName(faqType, category);
    const faqTypeCreatedAt = await resolveFaqTypeCreatedAt(resolvedFaqType);

    let finalOrder = order;
    if (finalOrder === undefined || finalOrder === null) {
      const maxOrderFAQ = await prisma.fAQ.findFirst({
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      finalOrder = (maxOrderFAQ?.order || 0) + 1;
    }

    const faq = await prisma.fAQ.create({
      data: buildFaqCreateData({
        question,
        answer,
        category,
        faqType,
        order: finalOrder,
        isActive,
        is_featured,
        faqTypeCreatedAt,
        updatedBy: userId,
      }),
    });

    return NextResponse.json({
      success: true,
      data: formatFaqsForApi([faq])[0],
    });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    return NextResponse.json({ error: 'Failed to create FAQ' }, { status: 500 });
  }
}
