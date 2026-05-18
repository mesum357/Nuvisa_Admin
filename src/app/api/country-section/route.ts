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

// GET /api/country-section - Fetch country section content (public endpoint)
export async function GET(request: NextRequest) {
  try {
    const section = await prisma.countrySection.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    // If no active section exists, return empty data (not an error)
    if (!section) {
      return NextResponse.json({ success: true, data: null }, { headers: getCorsHeaders(request) });
    }

    return NextResponse.json({
      success: true,
      data: section,
    }, { headers: getCorsHeaders(request) });
  } catch (error: any) {
    // Provide more diagnostic details for debugging deployment issues
    console.error('Error fetching country section:', error);
    const errMsg = error?.message || String(error);
    const errCode = error?.code || null;
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch country section',
      details: { message: errMsg, code: errCode },
    }, { status: 500, headers: getCorsHeaders(request) });
  }
}

// POST /api/country-section - Create or update country section (admin only)
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
    const { title, description, countries, isActive } = data;

    // Check if we already have a record, if so update it, otherwise create new
    const existingSection = await prisma.countrySection.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    let result;
    if (existingSection) {
      result = await prisma.countrySection.update({
        where: { id: existingSection.id },
        data: {
          title,
          description,
          countries,
          isActive: isActive !== undefined ? isActive : true,
          updatedBy: (session.user as any).id,
        },
      });
    } else {
      result = await prisma.countrySection.create({
        data: {
          title,
          description,
          countries,
          isActive: isActive !== undefined ? isActive : true,
          updatedBy: (session.user as any).id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Country section saved successfully',
    }, { headers: getCorsHeaders(request) });
  } catch (error: any) {
    console.error('Error saving country section:', error);
    return NextResponse.json(
      { success: false, error: `Failed to save country section: ${error.message}` },
      { status: 500, headers: getCorsHeaders(request) }
    );
  }
}

// PATCH /api/country-section - Update specific fields (admin only)
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
      const section = await prisma.countrySection.findUnique({ where: { id } });
      if (!section) {
        return NextResponse.json({ success: false, error: 'Section not found' }, { status: 404 });
      }
      result = await prisma.countrySection.update({
        where: { id },
        data: { isActive: !section.isActive },
      });
    } else {
      const data = await request.json();
      result = await prisma.countrySection.update({
        where: { id },
        data: {
          ...data,
          updatedBy: (session.user as any).id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: result,
    }, { headers: getCorsHeaders(request) });
  } catch (error: any) {
    console.error('Error updating country section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update country section' },
      { status: 500, headers: getCorsHeaders(request) }
    );
  }
}
