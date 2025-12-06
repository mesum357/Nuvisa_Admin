import { NextRequest, NextResponse } from 'next/server';
import prisma, { retryWithBackoff } from '@/lib/prisma';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const section = searchParams.get('section');
    const isActive = searchParams.get('isActive');

    const where: any = { isActive: true }; // Only fetch active content for public API
    if (section) where.section = section;

    // Use retry logic to handle connection issues
    const contents = await retryWithBackoff(async () => {
      return await prisma.klarnaContent.findMany({
        where,
        orderBy: [
          { section: 'asc' },
          { order: 'asc' },
          { key: 'asc' }
        ],
      });
    });

    return NextResponse.json({
      success: true,
      data: contents,
    }, {
      headers: corsHeaders,
    });
  } catch (error: any) {
    // Enhanced error logging with more details
    console.error('Error fetching klarna content:', {
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
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch klarna content',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        retryable: isConnectionError,
      },
      { 
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

