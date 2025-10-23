import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const limit = searchParams.get('limit');

    const where: any = {
      isActive: true, // Only return active FAQs for public API
    };

    if (category) {
      where.category = category;
    }

    const faqs = await prisma.fAQ.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
      take: limit ? parseInt(limit) : undefined,
      select: {
        id: true,
        question: true,
        answer: true,
        category: true,
        order: true,
      },
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
