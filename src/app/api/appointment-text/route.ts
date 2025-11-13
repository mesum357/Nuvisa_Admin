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

    console.log('GET appointment texts:', appointmentTexts);

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
    const { countryName, appointmentText, sectionTitle, sectionDescription, image } = data;

    if (!countryName || !appointmentText) {
      return NextResponse.json(
        { success: false, error: 'Country name and appointment text are required' },
        { status: 400, headers: getCorsHeaders(request) }
      );
    }

    // Upsert appointment text with section content
    console.log('Attempting to upsert appointment text:', { countryName, appointmentText, sectionTitle, sectionDescription, image });
    
    const updateData: any = {
      appointmentText: appointmentText.trim(),
      updatedBy: (session.user as any).id,
    };

    // Only update section content if provided
    if (sectionTitle !== undefined) updateData.sectionTitle = sectionTitle.trim();
    if (sectionDescription !== undefined) updateData.sectionDescription = sectionDescription.trim();
    if (image !== undefined) updateData.image = image?.trim() || null;
    
    const result = await prisma.appointmentText.upsert({
      where: { countryName },
      update: updateData,
      create: {
        countryName: countryName.trim(),
        appointmentText: appointmentText.trim(),
        sectionTitle: sectionTitle?.trim() || "Choose Your Country",
        sectionDescription: sectionDescription?.trim() || "We support 20 countries over all the visa centres in the UK",
        image: image?.trim() || null,
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

// PATCH /api/appointment-text - Update section content (admin only)
export async function PATCH(request: NextRequest) {
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

    const data = await request.json();
    const { sectionTitle, sectionDescription } = data;

    console.log('PATCH request received:', { sectionTitle, sectionDescription });

    if (!sectionTitle && !sectionDescription) {
      return NextResponse.json(
        { success: false, error: 'Section title or description is required' },
        { status: 400, headers: getCorsHeaders(request) }
      );
    }

    // Update all appointment text records with new section content
    const updateData: any = {
      updatedBy: (session.user as any).id,
    };

    if (sectionTitle !== undefined) updateData.sectionTitle = sectionTitle.trim();
    if (sectionDescription !== undefined) updateData.sectionDescription = sectionDescription.trim();

    // First, check if any appointment text records exist
    const existingRecords = await prisma.appointmentText.count();
    console.log('Existing records count:', existingRecords);
    
    if (existingRecords === 0) {
      // If no records exist, create a default one with the section content
      console.log('Creating default record with section content');
      const newRecord = await prisma.appointmentText.create({
        data: {
          countryName: "DEFAULT",
          appointmentText: "Appointment in 10 days or less",
          sectionTitle: sectionTitle?.trim() || "Choose Your Country",
          sectionDescription: sectionDescription?.trim() || "We support 20 countries over all the visa centres in the UK",
          updatedBy: (session.user as any).id,
        },
      });
      console.log('Created record:', newRecord);
    } else {
      // Update all existing records
      console.log('Updating existing records with:', updateData);
      const result = await prisma.appointmentText.updateMany({
        data: updateData,
      });
      console.log('Updated records:', result);
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Section content updated successfully' },
    }, { headers: getCorsHeaders(request) });
  } catch (error: any) {
    console.error('Error updating section content:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update section content',
        details: error.message 
      },
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
