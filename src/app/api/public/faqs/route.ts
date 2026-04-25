import { NextRequest, NextResponse } from 'next/server';
import prisma, { retryWithBackoff } from '@/lib/prisma';

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

    const where: any = {
      isActive: true, // Only return active FAQs for public API
    };

    if (category) {
      where.category = category;
    }

    if (faqType) {
      where.faqType = faqType;
    }

    if (isFeatured === 'true') {
      where.is_featured = true;
    }

    // Use retry logic to handle connection issues
    const faqs = await retryWithBackoff(async () => {
      return await prisma.fAQ.findMany({
        where,
        orderBy: [
          { order: 'asc' },
          { createdAt: 'desc' },
        ],
      });
    });

    const publicFaqs = faqs.map((faq: any) => ({
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

    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error: any) {
    // Enhanced error logging with more details
    console.error('Error fetching FAQs:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    });
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const isConnectionError = 
      error?.code === 'P1001' || // Can't reach database server
      error?.code === 'P1002' || // Database server closed the connection
      error?.code === 'P1008' || // Operations timed out
      error?.code === 'P1017' || // Server has closed the connection
      error?.message?.toLowerCase().includes('timeout') ||
      error?.message?.toLowerCase().includes('connection');
    
    const response = NextResponse.json(
      { 
        error: 'Failed to fetch FAQs',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        retryable: isConnectionError,
      },
      { status: 500 }
    );
    
    // Add CORS headers to error response too
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
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
