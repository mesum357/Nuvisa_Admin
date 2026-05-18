import { NextRequest, NextResponse } from 'next/server';
import prisma, { retryWithBackoff } from '@/lib/prisma';
import {
  applyFeaturedFilter,
  formatFaqsForApi,
  resolveTabName,
} from '@/lib/faq-utils';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const faqType = searchParams.get('faqType');
    const isFeatured = searchParams.get('isFeatured');

    const where: Record<string, unknown> = {
      isActive: true,
    };

    const tabFilter = resolveTabName(faqType, category);
    if (tabFilter) {
      where.OR = [{ category: tabFilter }, { faqType: tabFilter }];
    }

    applyFeaturedFilter(where, isFeatured);

    const faqs = await retryWithBackoff(async () => {
      return prisma.fAQ.findMany({
        where,
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      });
    });

    const publicFaqs = formatFaqsForApi(faqs).map((faq) => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      faqType: faq.faqType,
      faqTypeCreatedAt: faq.faqTypeCreatedAt,
      is_featured: faq.is_featured,
      order: faq.order,
      createdAt: faq.createdAt,
    }));

    const response = NextResponse.json({
      success: true,
      data: publicFaqs,
    });

    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string; meta?: unknown; stack?: string };
    console.error('Error fetching FAQs:', {
      message: err?.message,
      code: err?.code,
      meta: err?.meta,
      stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined,
    });

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const isConnectionError =
      err?.code === 'P1001' ||
      err?.code === 'P1002' ||
      err?.code === 'P1008' ||
      err?.code === 'P1017' ||
      err?.message?.toLowerCase().includes('timeout') ||
      err?.message?.toLowerCase().includes('connection');

    const response = NextResponse.json(
      {
        error: 'Failed to fetch FAQs',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        retryable: isConnectionError,
      },
      { status: 500 }
    );

    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}
