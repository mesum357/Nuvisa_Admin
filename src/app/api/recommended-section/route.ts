import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  });
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) });
}

// GET /api/recommended-section - Fetch recommended section content (public endpoint)
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

// POST /api/recommended-section - Create or update recommended section (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401, headers: getCorsHeaders(request) }
      );
    }

    const data = await request.json();
    const { title, description, cards, isActive } = data;

    // Check if we already have a record, if so update it, otherwise create new
    const existingSection = await prisma.recommendedSection.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    let result;
    if (existingSection) {
      result = await prisma.recommendedSection.update({
        where: { id: existingSection.id },
        data: {
          title,
          description,
          cards,
          isActive: isActive !== undefined ? isActive : true,
          updatedBy: (session.user as any).id,
        },
      });
    } else {
      result = await prisma.recommendedSection.create({
        data: {
          title,
          description,
          cards,
          isActive: isActive !== undefined ? isActive : true,
          updatedBy: (session.user as any).id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: { ...result, id: result.id.toString() },
      message: 'Recommended section saved successfully',
    }, { headers: getCorsHeaders(request) });
  } catch (error: any) {
    console.error('Error saving recommended section:', error);
    return NextResponse.json(
      { success: false, error: `Failed to save recommended section: ${error.message}` },
      { status: 500, headers: getCorsHeaders(request) }
    );
  }
}

// PATCH /api/recommended-section - Update specific fields (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401, headers: getCorsHeaders(request) }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400, headers: getCorsHeaders(request) }
      );
    }

    let result;
    if (action === 'toggle') {
      const section = await prisma.recommendedSection.findUnique({ where: { id: BigInt(id) } });
      if (!section) {
        return NextResponse.json({ success: false, error: 'Section not found' }, { status: 404 });
      }
      result = await prisma.recommendedSection.update({
        where: { id: BigInt(id) },
        data: { isActive: !section.isActive },
      });
    } else {
      const data = await request.json();
      result = await prisma.recommendedSection.update({
        where: { id: BigInt(id) },
        data: {
          ...data,
          updatedBy: (session.user as any).id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: { ...result, id: result.id.toString() },
    }, { headers: getCorsHeaders(request) });
  } catch (error: any) {
    console.error('Error updating recommended section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update recommended section' },
      { status: 500, headers: getCorsHeaders(request) }
    );
  }
}
