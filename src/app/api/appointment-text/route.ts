import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// CORS helper for production
function getCorsHeaders(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  
  // Define allowed origins for production
  const allowedOrigins = [
    'https://www.nuvisa.co.uk',
    'https://nuvisa.co.uk',
    'http://localhost:3000',
    'http://localhost:3001'
  ];
  
  // Add any additional origins from environment variable
  const envOrigins = process.env.ADMIN_CORS_ORIGINS?.split(',').map(o => o.trim()) || [];
  const allAllowedOrigins = [...allowedOrigins, ...envOrigins];
  
  // Check if origin is allowed
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

// GET /api/appointment-text - Fetch appointment text for all countries (public endpoint)
export async function GET(request: NextRequest) {
  try {
    // Check if prisma is available
    if (!prisma) {
      console.error('Prisma client not available');
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 500, headers: getCorsHeaders(request) }
      );
    }

    const appointmentTexts = await prisma.appointmentText.findMany({
      orderBy: { countryName: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: appointmentTexts || [],
    }, { headers: getCorsHeaders(request) });
  } catch (error: any) {
    console.error('Error fetching appointment texts:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Return empty array instead of error for better UX
    return NextResponse.json({
      success: true,
      data: [],
    }, { headers: getCorsHeaders(request) });
  }
}

// POST /api/appointment-text - Create or update appointment text (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401, headers: getCorsHeaders(request) }
      );
    }

    // Check if prisma is available
    if (!prisma) {
      console.error('Prisma client not available');
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 500, headers: getCorsHeaders(request) }
      );
    }

    console.log('Prisma client available, checking appointmentText model...');
    console.log('Prisma client keys:', Object.keys(prisma));

    const data = await request.json();
    const { countryName, appointmentText } = data;

    if (!countryName || !appointmentText) {
      return NextResponse.json(
        { success: false, error: 'Country name and appointment text are required' },
        { status: 400, headers: getCorsHeaders(request) }
      );
    }

    // Upsert appointment text
    console.log('Attempting to upsert appointment text:', { countryName, appointmentText });
    
    const result = await prisma.appointmentText.upsert({
      where: { countryName },
      update: { 
        appointmentText: appointmentText.trim(),
        updatedBy: (session.user as any).id,
      },
      create: {
        countryName: countryName.trim(),
        appointmentText: appointmentText.trim(),
        updatedBy: (session.user as any).id,
      },
    });

    console.log('Upsert result:', result);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Appointment text updated successfully',
    }, { headers: getCorsHeaders(request) });
  } catch (error: any) {
    console.error('Error updating appointment text:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return NextResponse.json(
      { success: false, error: `Failed to update appointment text: ${error.message}` },
      { status: 500, headers: getCorsHeaders(request) }
    );
  }
}

// DELETE /api/appointment-text - Delete appointment text (admin only)
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
    const countryName = searchParams.get('countryName');

    if (!countryName) {
      return NextResponse.json(
        { success: false, error: 'Country name is required' },
        { status: 400, headers: getCorsHeaders(request) }
      );
    }

    await prisma.appointmentText.delete({
      where: { countryName },
    });

    return NextResponse.json({
      success: true,
      message: 'Appointment text deleted successfully',
    }, { headers: getCorsHeaders(request) });
  } catch (error: any) {
    console.error('Error deleting appointment text:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Appointment text not found' },
        { status: 404, headers: getCorsHeaders(request) }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete appointment text' },
      { status: 500, headers: getCorsHeaders(request) }
    );
  }
}
