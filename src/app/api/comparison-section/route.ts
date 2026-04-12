// Comparison Section API Route
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type OccasionCountryPricing = {
  country?: string;
  earlyDiscount?: number | string;
  originalPrice?: number | string;
  traditionalPrice?: number | string;
  isHidden?: boolean;
  priceMode?: 'two' | 'three' | string;
};

type OccasionItem = {
  countryPricing?: OccasionCountryPricing[];
};

const normalizeKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const parseBoolean = (value: string | null) => {
  if (!value) return false;
  return ['1', 'true', 'yes', 'y', 'on'].includes(value.toLowerCase());
};

const parsePriceNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : null;
  if (typeof value !== 'string') return null;

  const cleaned = value.replace(/[^0-9.\-]/g, '');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const getMappedPriceForMode = (pricing: OccasionCountryPricing): number | null => {
  const mode = pricing.priceMode === 'two' ? 'two' : 'three';
  const early = parsePriceNumber(pricing.earlyDiscount);
  const original = parsePriceNumber(pricing.originalPrice);
  const traditional = parsePriceNumber(pricing.traditionalPrice);

  // Business rule:
  // - 3-tier pricing -> use earlyDiscount
  // - 2-tier pricing -> use originalPrice
  // Fallback chain is only for resilience when data is missing.
  if (mode === 'three') {
    return early ?? original ?? traditional ?? null;
  }
  return original ?? early ?? traditional ?? null;
};

const formatPriceLikeExisting = (amount: number, existingValue: unknown): string => {
  const existing = typeof existingValue === 'string' ? existingValue : '';
  const symbolMatch = existing.match(/[\u00A3$€]/);
  const symbol = symbolMatch?.[0] || '£';
  const hasDecimals = existing.includes('.');
  const formattedAmount = hasDecimals ? amount.toFixed(2) : Math.round(amount).toString();
  return `${symbol}${formattedAmount}`;
};

const applyOccasionPriceOverride = async (comparisonData: any, country: string) => {
  if (!comparisonData || !country) return comparisonData;

  try {
    const occasionResults: any[] = await prisma.$queryRaw`
      SELECT * FROM occasion_content
      WHERE "isActive" = true
      LIMIT 1
    `;

    const occasionContent = occasionResults?.[0];
    if (!occasionContent?.occasions) return comparisonData;

    const occasions: OccasionItem[] = typeof occasionContent.occasions === 'string'
      ? JSON.parse(occasionContent.occasions)
      : occasionContent.occasions;

    if (!Array.isArray(occasions) || !occasions.length) return comparisonData;

    const normalizedCountry = normalizeKey(country);
    const matchingPricings: OccasionCountryPricing[] = occasions
      .flatMap((occasion) => (Array.isArray(occasion.countryPricing) ? occasion.countryPricing : []))
      .filter((pricing) => {
        if (pricing?.isHidden) return false;
        const pricingCountry = typeof pricing?.country === 'string' ? pricing.country : '';
        return pricingCountry && normalizeKey(pricingCountry) === normalizedCountry;
      });

    if (!matchingPricings.length) return comparisonData;

    const mappedOccasionPrice = matchingPricings
      .map(getMappedPriceForMode)
      .filter((value): value is number => typeof value === 'number' && value > 0)
      .reduce<number | null>((first, value) => (first === null ? value : first), null);

    if (!mappedOccasionPrice) return comparisonData;

    const comparisonRows = Array.isArray(comparisonData.comparisonRows) ? [...comparisonData.comparisonRows] : [];
    const comparisonColumns = Array.isArray(comparisonData.comparisonColumns) ? comparisonData.comparisonColumns : [];
    if (!comparisonRows.length) return comparisonData;

    const priceRowIndex = comparisonRows.findIndex((row: any) =>
      typeof row?.feature === 'string' && row.feature.toLowerCase() === 'price'
    );
    const targetRowIndex = priceRowIndex >= 0 ? priceRowIndex : 0;

    const nuvisaColumnIndex = comparisonColumns.findIndex((column: any) => {
      if (typeof column !== 'string') return false;
      return normalizeKey(column) === 'nuvisa';
    });
    const targetColumnIndex = nuvisaColumnIndex >= 0 ? nuvisaColumnIndex : 0;

    const targetRow = comparisonRows[targetRowIndex];
    if (!targetRow || !Array.isArray(targetRow.values) || !targetRow.values.length) return comparisonData;

    const rowValues = [...targetRow.values];
    const existingValue = rowValues[targetColumnIndex];
    const mappedValue = formatPriceLikeExisting(mappedOccasionPrice, existingValue);
    rowValues[targetColumnIndex] = mappedValue;

    comparisonRows[targetRowIndex] = {
      ...targetRow,
      values: rowValues,
    };

    return {
      ...comparisonData,
      comparisonRows,
    };
  } catch (error) {
    console.error('Occasion price mapping failed, returning base comparison data:', error);
    return comparisonData;
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || 'active';
    const country = searchParams.get('country') || '';
    const isOccasion = parseBoolean(searchParams.get('isOccasion'));
    let data;

    if (path === 'active') {
      // Get active comparison section, optionally filtered by country
      data = await prisma.comparisonSection.findFirst({
        where: {
          isActive: true,
          ...(country ? { countryName: country } : {})
        },
        orderBy: { updatedAt: 'desc' }
      });

      // If occasion mode is enabled, override only the NUVisa price cell using occasion pricing.
      if (data && isOccasion && country) {
        data = await applyOccasionPriceOverride(data, country);
      }
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
