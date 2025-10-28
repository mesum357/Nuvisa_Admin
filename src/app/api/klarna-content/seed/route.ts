import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if content already exists
    const existingContent = await prisma.klarnaContent.findFirst();
    if (existingContent) {
      return NextResponse.json({
        success: false,
        message: 'Klarna content already exists',
      });
    }

    // Create default content
    const defaultContents = [
      { 
        key: 'klarna_heading', 
        value: "Pay in small instalments with interest free financing!", 
        type: 'text', 
        section: 'heading', 
        order: 1,
        isActive: true
      },
      { 
        key: 'klarna_subtitle', 
        value: '4 payments of £32 with 0% interest.', 
        type: 'text', 
        section: 'subtitle', 
        order: 2,
        isActive: true
      },
      { 
        key: 'klarna_payment_amount', 
        value: '£32', 
        type: 'currency', 
        section: 'details', 
        order: 3,
        isActive: true
      },
      { 
        key: 'klarna_interest_rate', 
        value: '0% Interest', 
        type: 'text', 
        section: 'details', 
        order: 4,
        isActive: true
      },
      { 
        key: 'klarna_fees', 
        value: 'No fees', 
        type: 'text', 
        section: 'details', 
        order: 5,
        isActive: true
      },
    ];

    const createdContents = await Promise.all(
      defaultContents.map(content => 
        prisma.klarnaContent.create({ 
          data: content 
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: 'Default Klarna content created successfully',
      data: createdContents,
    });
  } catch (error) {
    console.error('Error seeding klarna content:', error);
    return NextResponse.json(
      { error: 'Failed to seed klarna content' },
      { status: 500 }
    );
  }
}

