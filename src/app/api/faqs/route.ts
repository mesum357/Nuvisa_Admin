import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { CreateFAQData } from '@/types';

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

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (faqType) {
      where.faqType = faqType;
    }

    if (isFeatured !== null) {
      where.is_featured = isFeatured === 'true';
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { question: { contains: search, mode: 'insensitive' } },
        { answer: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { faqType: { contains: search, mode: 'insensitive' } },
      ];
    }

    const faqs = await prisma.fAQ.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    let types: { name: string; count: number }[] | undefined;
    if (isFeatured === 'true') {
      const typesWhere: any = {
        ...where,
        is_featured: true,
        NOT: [{ faqType: null }, { faqType: '' }],
      };

      // Return all featured types even when filtering FAQs by a single type.
      delete typesWhere.faqType;

      const faqTypeGroups = await prisma.fAQ.groupBy({
        by: ['faqType'],
        _count: {
          id: true,
        },
        _min: {
          order: true,
        },
        where: typesWhere,
        orderBy: {
          faqType: 'asc',
        },
      });

      types = faqTypeGroups
        .filter((group) => group.faqType)
        .sort((a, b) => {
          const aOrder = a._min.order ?? Number.MAX_SAFE_INTEGER;
          const bOrder = b._min.order ?? Number.MAX_SAFE_INTEGER;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return (a.faqType as string).localeCompare(b.faqType as string);
        })
        .map((group) => ({
          name: group.faqType as string,
          count: group._count.id,
        }));
    }

    return NextResponse.json({
      success: true,
      data: faqs,
      ...(types ? { types } : {}),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch FAQs' },
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

    const data: CreateFAQData = await request.json();
    const { question, answer, category, faqType, order, isActive = true, is_featured = true } = data;

    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Question and answer are required' },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id as string | undefined;
    const trimmedFaqType = typeof faqType === 'string' ? faqType.trim() : '';
    const resolvedFaqType = trimmedFaqType || null;

    // If no order is provided, assign the next available order
    let finalOrder = order;
    if (finalOrder === undefined || finalOrder === null) {
      const maxOrderFAQ = await prisma.fAQ.findFirst({
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      finalOrder = (maxOrderFAQ?.order || 0) + 1;
    }

    const faq = await prisma.fAQ.create({
      data: {
        question,
        answer,
        category: category || null,
        faqType: resolvedFaqType,
        order: finalOrder,
        isActive,
        is_featured,
        updatedBy: userId,
      },
    });

    return NextResponse.json({
      success: true,
      data: faq,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create FAQ' },
      { status: 500 }
    );
  }
}
