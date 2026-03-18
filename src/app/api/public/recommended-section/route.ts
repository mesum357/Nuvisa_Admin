import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// CORS helper for production
function getCorsHeaders(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  
  const allowedOrigins = [
    'https://www.nuvisa.co.uk',
    'https://nuvisa.co.uk',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
  ];
  
  const envOrigins = process.env.ADMIN_CORS_ORIGINS?.split(',').map(o => o.trim()) || [];
  const allAllowedOrigins = [...allowedOrigins, ...envOrigins];
  
  const allowOrigin = allAllowedOrigins.includes(origin) ? origin : 
    (origin && origin.startsWith('https://') ? origin : 'https://www.nuvisa.co.uk');

  return new Headers({
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  });
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) });
}

// GET /api/public/recommended-section - Fetch recommended section content (public endpoint)
export async function GET(request: NextRequest) {
  try {
    const section = await prisma.recommendedSection.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    // Handle BigInt serialization
    const serializedSection = section ? {
      ...section,
      id: section.id.toString(),
    } : null;

    return NextResponse.json({
      success: true,
      data: serializedSection,
    }, { headers: getCorsHeaders(request) });
  } catch (error: any) {
    console.error('Error fetching recommended section:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch recommended section',
    }, { status: 500, headers: getCorsHeaders(request) });
  }
}
