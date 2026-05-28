// Comparison Section API Route
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePublicSite } from '@/lib/revalidate-public-site';

type OccasionCountryPricing = {
  country?: string;
  earlyDiscount?: number | string;
  originalPrice?: number | string;
  traditionalPrice?: number | string;
  isHidden?: boolean;
  priceMode?: 'two' | 'three' | string;
};

type OccasionItem = {
  title?: string;
  arrivalDate?: string;
  departureDate?: string;
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

const toDateOnly = (value: unknown): Date | null => {
  if (!value) return null;
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

const resolveOccasionRange = (occ: OccasionItem): { start: Date; end: Date } | null => {
  const explicitStart = occ.arrivalDate;
  const explicitEnd = occ.departureDate;

  if (explicitStart && explicitEnd) {
    const start = toDateOnly(explicitStart);
    const end = toDateOnly(explicitEnd);
    if (start && end) return { start, end };
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const title = String(occ?.title || '').toLowerCase().trim();

  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  const monthShort = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

  let monthIndex = monthNames.findIndex((m) => title.includes(m));
  if (monthIndex === -1) {
    monthIndex = monthShort.findIndex((m) => title === m || title.startsWith(`${m} `));
  }

  if (monthIndex !== -1) {
    let year = currentYear;
    const yearMatch = title.match(/\b(\d{2})\b/);
    if (yearMatch) year = 2000 + parseInt(yearMatch[1], 10);
    else if (monthIndex < now.getMonth() || (monthIndex === now.getMonth() && now.getDate() > 15)) {
      year = currentYear + 1;
    }

    const start = toDateOnly(`${year}-${String(monthIndex + 1).padStart(2, '0')}-01`);
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();
    const end = toDateOnly(`${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`);
    if (start && end) return { start, end };
  }

  return null;
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

const buildComparisonSectionData = (
  body: Record<string, any>,
  options: { includeCountryName?: boolean } = {}
) => {
  const data: Record<string, any> = {};

  if (body.title !== undefined) data.title = body.title;
  if (body.leftSideTitle !== undefined) data.leftSideTitle = body.leftSideTitle;
  if (body.rightSideTitle !== undefined) data.rightSideTitle = body.rightSideTitle;
  if (body.leftSideImage !== undefined) data.leftSideImage = body.leftSideImage || null;
  if (body.rightSideImage !== undefined) data.rightSideImage = body.rightSideImage || null;
  if (body.leftSideItems !== undefined) data.leftSideItems = body.leftSideItems;
  if (body.rightSideItems !== undefined) data.rightSideItems = body.rightSideItems;
  if (body.detailSections !== undefined) data.detailSections = body.detailSections;
  if (body.experienceType !== undefined) data.experienceType = body.experienceType;
  if (body.experienceItems !== undefined) data.experienceItems = body.experienceItems;
  if (body.experienceTitle !== undefined) data.experienceTitle = body.experienceTitle;
  if (body.comparisonColumns !== undefined) data.comparisonColumns = body.comparisonColumns;
  if (body.comparisonRows !== undefined) data.comparisonRows = body.comparisonRows;
  if (body.tooltip !== undefined) data.tooltip = body.tooltip || null;
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (body.updatedBy !== undefined) data.updatedBy = body.updatedBy || null;

  if (options.includeCountryName && body.countryName !== undefined) {
    data.countryName = body.countryName || null;
  }

  return data;
};

const applyOccasionPriceOverride = async (
  comparisonData: any,
  country: string,
  arrivalDate?: string
) => {
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

    const activeArrival = toDateOnly(arrivalDate) || toDateOnly(new Date().toISOString());
    if (!activeArrival) return comparisonData;

    const eligibleOccasions = occasions
      .map((occasion) => {
        const countryPricing = Array.isArray(occasion?.countryPricing) ? occasion.countryPricing : [];
        const range = resolveOccasionRange(occasion);
        if (!range || !countryPricing.length) return null;

        const inRange = activeArrival >= range.start && activeArrival <= range.end;
        if (!inRange) return null;

        return {
          range,
          countryPricing,
        };
      })
      .filter((item): item is { range: { start: Date; end: Date }; countryPricing: OccasionCountryPricing[] } => Boolean(item));

    const activeOccasion = eligibleOccasions[0] || null;
    if (!activeOccasion) return comparisonData;

    const normalizedCountry = normalizeKey(country);
    const matchingPricings: OccasionCountryPricing[] = activeOccasion.countryPricing
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
    const arrivalDate = searchParams.get('arrivalDate') || '';
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
        data = await applyOccasionPriceOverride(data, country, arrivalDate);
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
    if(!data) {
      data = await prisma.comparisonSection.findFirst({
        where:{
          isActive:true,
          countryName:"Default"
        }
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

    await revalidatePublicSite(['content', 'homepage', 'comparison']);

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
      if (action !== 'apply-default') {
        return NextResponse.json(
          { success: false, error: 'ID is required' },
          { status: 400 }
        );
      }
    }

    let data;
    const comparisonId = id as string;

    if (action === 'apply-default') {
      const body = await request.json();

      if (!body.title || !body.leftSideTitle || !body.rightSideTitle) {
        return NextResponse.json(
          { success: false, error: 'Title, leftSideTitle, and rightSideTitle are required' },
          { status: 400 }
        );
      }

      // Build the data to apply but explicitly DO NOT include countryName
      const dataToApply = buildComparisonSectionData(body, { includeCountryName: false });

      // Optional: allow caller to exclude one country from being overwritten (e.g., keep its own values)
      const excludeCountryName = typeof body.excludeCountryName === 'string' && body.excludeCountryName.trim()
        ? body.excludeCountryName.trim()
        : null;

      const whereClause: any = {};
      if (excludeCountryName) {
        whereClause.NOT = { countryName: excludeCountryName };
      }

      const updateResult = await prisma.comparisonSection.updateMany({
        where: whereClause,
        data: dataToApply,
      });

      // Ensure we store/update the Default template record, but do not propagate its countryName to others.
      const defaultSection = await prisma.comparisonSection.findFirst({
        where: { countryName: 'Default' },
      });

      if (defaultSection) {
        await prisma.comparisonSection.update({
          where: { id: defaultSection.id },
          data: {
            ...dataToApply,
            // keep the explicit 'Default' name for the template record
            countryName: 'Default',
          },
        });
      } else {
        await prisma.comparisonSection.create({
          data: {
            ...dataToApply,
            leftSideItems: Array.isArray(body.leftSideItems) ? body.leftSideItems : [],
            rightSideItems: Array.isArray(body.rightSideItems) ? body.rightSideItems : [],
            countryName: 'Default',
            isActive: body.isActive !== undefined ? body.isActive : true,
          },
        });
      }

      await revalidatePublicSite(['content', 'homepage', 'comparison']);

      return NextResponse.json({
        success: true,
        data: {
          updatedCount: updateResult.count,
        },
      });
    }

    if (action === 'toggle') {
      // Toggle active status
      const existing = await prisma.comparisonSection.findUnique({
        where: { id: comparisonId }
      });

      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Comparison section not found' },
          { status: 404 }
        );
      }

      data = await prisma.comparisonSection.update({
        where: { id: comparisonId },
        data: { isActive: !existing.isActive }
      });
    } else {
      // Update comparison section
      const body = await request.json();
      const updateData = buildComparisonSectionData(body, { includeCountryName: true });

      data = await prisma.comparisonSection.update({
        where: { id: comparisonId },
        data: updateData
      });
    }

    await revalidatePublicSite(['content', 'homepage', 'comparison']);

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

    const comparisonId = id as string;

    // Check if comparison section exists
    const existing = await prisma.comparisonSection.findUnique({
      where: { id: comparisonId }
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Comparison section not found' },
        { status: 404 }
      );
    }

    await prisma.comparisonSection.delete({
      where: { id: comparisonId }
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
