import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Simple CORS helper
function getCorsHeaders(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  const allowed = (process.env.ADMIN_CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001')
    .split(',')
    .map((o) => o.trim());

  const allowOrigin = allowed.includes(origin) ? origin : allowed[0] || '*';

  return new Headers({
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  });
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) });
}

// GET /api/countries - Fetch all countries (public endpoint - no auth required for active countries)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const id = searchParams.get('id');

    // Check if admin is requesting (for admin panel)
    const session = await getServerSession(authOptions);
    const isAdmin = !!session;

    // If requesting specific country by ID
    if (id) {
      const country = await prisma.country.findUnique({
        where: { id },
      });

      if (!country) {
        return NextResponse.json(
          { success: false, error: 'Country not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: country,
      }, { headers: getCorsHeaders(request) });
    }

    // Fetch all countries
    const whereClause = isAdmin && includeInactive ? {} : { isActive: true };

    const countries = await prisma.country.findMany({
      where: whereClause,
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' }
      ],
    });

    return NextResponse.json({
      success: true,
      data: countries,
    }, { headers: getCorsHeaders(request) });
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch countries' },
      { status: 500, headers: getCorsHeaders(request) }
    );
  }
}

// POST /api/countries - Create a new country (admin only)
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

    // Create slug from name
    const slug = data.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');

    const country = await prisma.country.create({
      data: {
        ...data,
        slug,
        visaFee: parseFloat(data.visaFee),
        insuranceFee: parseFloat(data.insuranceFee),
        updatedBy: (session.user as any).id,
      },
    });

    return NextResponse.json({
      success: true,
      data: country,
      message: 'Country created successfully',
    }, { headers: getCorsHeaders(request) });
  } catch (error: any) {
    console.error('Error creating country:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'A country with this name already exists' },
        { status: 400, headers: getCorsHeaders(request) }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create country' },
      { status: 500, headers: getCorsHeaders(request) }
    );
  }
}

// PATCH /api/countries - Update a country (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401, headers: getCorsHeaders(request) }
      );
    }

    const data = await request.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Country ID is required' },
        { status: 400, headers: getCorsHeaders(request) }
      );
    }

    // Update slug if name is being changed
    if (updateData.name) {
      updateData.slug = updateData.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '');
    }

    // Convert fees to decimals if provided
    if (updateData.visaFee) {
      updateData.visaFee = parseFloat(updateData.visaFee);
    }
    if (updateData.insuranceFee) {
      updateData.insuranceFee = parseFloat(updateData.insuranceFee);
    }

    const country = await prisma.country.update({
      where: { id },
      data: {
        ...updateData,
        updatedBy: (session.user as any).id,
      },
    });

    return NextResponse.json({
      success: true,
      data: country,
      message: 'Country updated successfully',
    }, { headers: getCorsHeaders(request) });
  } catch (error: any) {
    console.error('Error updating country:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Country not found' },
        { status: 404, headers: getCorsHeaders(request) }
      );
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'A country with this name already exists' },
        { status: 400, headers: getCorsHeaders(request) }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update country' },
      { status: 500, headers: getCorsHeaders(request) }
    );
  }
}

// DELETE /api/countries - Delete a country (admin only)
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
        { success: false, error: 'Country ID is required' },
        { status: 400, headers: getCorsHeaders(request) }
      );
    }

    await prisma.country.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Country deleted successfully',
    }, { headers: getCorsHeaders(request) });
  } catch (error: any) {
    console.error('Error deleting country:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Country not found' },
        { status: 404, headers: getCorsHeaders(request) }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete country' },
      { status: 500, headers: getCorsHeaders(request) }
    );
  }
}

