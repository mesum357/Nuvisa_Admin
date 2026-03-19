import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// CORS headers for frontend access
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

// GET /api/visa-countries - List all visa countries (publicly accessible)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get('active') === 'true';

    const where = activeOnly ? { isActive: true } : {};

    const countries = await prisma.visaCountry.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: countries,
    }, { headers: getCorsHeaders(request) });
  } catch (error: any) {
    console.error('Error fetching visa countries:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch visa countries',
    }, { status: 500, headers: getCorsHeaders(request) });
  }
}

// POST /api/visa-countries - Create a new visa country (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401, headers: getCorsHeaders(request) }
      );
    }

    const body = await request.json();
    const { name, image, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Country name is required' },
        { status: 400, headers: getCorsHeaders(request) }
      );
    }

    const country = await prisma.visaCountry.create({
      data: {
        name,
        image,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({
      success: true,
      data: country,
      message: 'Visa country created successfully',
    }, { headers: getCorsHeaders(request) });
  } catch (error: any) {
    console.error('Error creating visa country:', error);
    return NextResponse.json(
      { success: false, error: `Failed to create visa country: ${error.message}` },
      { status: 500, headers: getCorsHeaders(request) }
    );
  }
}

// PATCH /api/visa-countries - Update a visa country (admin only)
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

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400, headers: getCorsHeaders(request) }
      );
    }

    const body = await request.json();
    const result = await prisma.visaCountry.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Visa country updated successfully',
    }, { headers: getCorsHeaders(request) });
  } catch (error: any) {
    console.error('Error updating visa country:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update visa country' },
      { status: 500, headers: getCorsHeaders(request) }
    );
  }
}

// DELETE /api/visa-countries - Delete a visa country (admin only)
export async function DELETE(request: NextRequest) {
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

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400, headers: getCorsHeaders(request) }
      );
    }

    await prisma.visaCountry.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Visa country deleted successfully',
    }, { headers: getCorsHeaders(request) });
  } catch (error: any) {
    console.error('Error deleting visa country:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete visa country' },
      { status: 500, headers: getCorsHeaders(request) }
    );
  }
}
