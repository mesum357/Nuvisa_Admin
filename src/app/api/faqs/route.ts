import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { CreateFAQData } from '@/types';

const FAQ_TYPES = ['WHAT_IT_IS', 'ELIGIBILITY', 'COUNTRIES'] as const;

function isValidFaqType(value: string): value is (typeof FAQ_TYPES)[number] {
  return (FAQ_TYPES as readonly string[]).includes(value);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const faqType = searchParams.get('faqType');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (faqType) {
      if (!isValidFaqType(faqType)) {
        return NextResponse.json(
          { error: 'Invalid faqType value' },
          { status: 400 }
        );
      }
      where.faqType = faqType;
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      const normalizedSearch = search.trim().toLowerCase();
      const faqTypeFromSearch =
        normalizedSearch === 'what it is' || normalizedSearch === 'what_it_is'
          ? 'WHAT_IT_IS'
          : normalizedSearch === 'eligibility'
          ? 'ELIGIBILITY'
          : normalizedSearch === 'countries' || normalizedSearch === 'country'
          ? 'COUNTRIES'
          : null;

      where.OR = [
        { question: { contains: search, mode: 'insensitive' } },
        { answer: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        ...(faqTypeFromSearch ? [{ faqType: faqTypeFromSearch }] : []),
      ];
    }

    const faqs = await prisma.fAQ.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: faqs,
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
    const { question, answer, category, faqType, order, isActive = true } = data;

    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Question and answer are required' },
        { status: 400 }
      );
    }

    if (faqType && !isValidFaqType(faqType)) {
      return NextResponse.json(
        { error: 'Invalid faqType value' },
        { status: 400 }
      );
    }

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
        faqType: faqType || 'WHAT_IT_IS',
        order: finalOrder,
        isActive,
        updatedBy: (session.user as any).id,
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
