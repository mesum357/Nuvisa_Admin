import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

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
      select: {
        id: true,
        question: true,
        answer: true,
        category: true,
        order: true,
      },
    });

    const response = NextResponse.json({
      success: true,
      data: faqs,
    });

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
  } catch (error) {
    // Log the actual error for debugging
    console.error('Error fetching FAQs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    const response = NextResponse.json(
      { 
        error: 'Failed to fetch FAQs',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );

    // Add CORS headers to error response too
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
  }
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });

  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return response;
}
