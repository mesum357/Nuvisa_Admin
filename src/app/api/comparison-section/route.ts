// Comparison Section API Route
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || 'active';
    let data;

    if (path === 'active') {
      // Get active comparison section, optionally filtered by country
      const country = searchParams.get('country');
      data = await prisma.comparisonSection.findFirst({
        where: {
          isActive: true,
          ...(country ? { countryName: country } : {})
        },
        orderBy: { updatedAt: 'desc' }
      });
    } else if (path === 'all') {
      // Get all comparison sections
      data = await prisma.comparisonSection.findMany({
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // Get specific comparison section by ID
      data = await prisma.comparisonSection.findUnique({
        where: { id: path }
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching comparison section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comparison section' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.leftSideTitle || !body.rightSideTitle) {
      return NextResponse.json(
        { success: false, error: 'Title, leftSideTitle, and rightSideTitle are required' },
        { status: 400 }
      );
    }

    const data = await prisma.comparisonSection.create({
      data: {
        title: body.title,
        leftSideTitle: body.leftSideTitle,
        rightSideTitle: body.rightSideTitle,
        leftSideImage: body.leftSideImage || null,
        rightSideImage: body.rightSideImage || null,
        leftSideItems: body.leftSideItems || [],
        rightSideItems: body.rightSideItems || [],
        detailSections: body.detailSections || null,
        experienceType: body.experienceType || "IMAGES",
        experienceItems: body.experienceItems || null,
        experienceTitle: body.experienceTitle || "THE EXPERIENCE",
        comparisonColumns: body.comparisonColumns || null,
        comparisonRows: body.comparisonRows || null,
        tooltip: body.tooltip || null,
        countryName: body.countryName || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
        updatedBy: body.updatedBy || null
      }
    });

    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error creating comparison section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create comparison section' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    let data;

    if (action === 'toggle') {
      // Toggle active status
      const existing = await prisma.comparisonSection.findUnique({
        where: { id }
      });

      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Comparison section not found' },
          { status: 404 }
        );
      }

      data = await prisma.comparisonSection.update({
        where: { id },
        data: { isActive: !existing.isActive }
      });
    } else {
      // Update comparison section
      const body = await request.json();

      data = await prisma.comparisonSection.update({
        where: { id },
        data: {
          title: body.title,
          leftSideTitle: body.leftSideTitle,
          rightSideTitle: body.rightSideTitle,
          leftSideImage: body.leftSideImage,
          rightSideImage: body.rightSideImage,
          leftSideItems: body.leftSideItems,
          rightSideItems: body.rightSideItems,
          detailSections: body.detailSections,
          experienceType: body.experienceType,
          experienceItems: body.experienceItems,
          experienceTitle: body.experienceTitle,
          comparisonColumns: body.comparisonColumns,
          comparisonRows: body.comparisonRows,
          tooltip: body.tooltip,
          countryName: body.countryName,
          isActive: body.isActive,
          updatedBy: body.updatedBy
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error updating comparison section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update comparison section' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    // Check if comparison section exists
    const existing = await prisma.comparisonSection.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Comparison section not found' },
        { status: 404 }
      );
    }

    await prisma.comparisonSection.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Comparison section deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comparison section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete comparison section' },
      { status: 500 }
    );
  }
}
