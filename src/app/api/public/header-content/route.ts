import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const section = searchParams.get('section');

    const where: any = { isActive: true };
    if (section) where.section = section;

    const contents = await prisma.headerContent.findMany({
      where,
      orderBy: [
        { section: 'asc' },
        { order: 'asc' },
        { key: 'asc' }
      ],
    });

    const response = NextResponse.json({
      success: true,
      data: contents,
    });

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
  } catch (error) {
    // Log the actual error for debugging
    console.error('Error fetching header content:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    const response = NextResponse.json(
      { 
        error: 'Failed to fetch header content',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
    
    // Add CORS headers to error response too
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  }
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}
