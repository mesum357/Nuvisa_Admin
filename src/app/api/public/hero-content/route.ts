import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const section = searchParams.get('section');
    const isActive = searchParams.get('isActive');

    const where: any = { isActive: true }; // Only fetch active content for public API
    if (section) where.section = section;

    const contents = await prisma.heroContent.findMany({
      where,
      orderBy: [
        { section: 'asc' },
        { order: 'asc' },
        { key: 'asc' }
      ],
    });

    return NextResponse.json({
      success: true,
      data: contents,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    // Log the actual error for debugging
    console.error('Error fetching hero content:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch hero content',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
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
