import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const POPUP_STATE_KEY = 'popup_state';
const DEFAULT_POPUP_STATE = {
  isActive: true,
  triggerDelaySeconds: 145,
  showOnDates: [] as string[],
};

const parsePopupState = (value?: string | null) => {
  if (!value) return DEFAULT_POPUP_STATE;

  try {
    const parsed = JSON.parse(value);
    return {
      isActive: typeof parsed?.isActive === 'boolean' ? parsed.isActive : DEFAULT_POPUP_STATE.isActive,
      triggerDelaySeconds: Math.max(0, Number(parsed?.triggerDelaySeconds) || DEFAULT_POPUP_STATE.triggerDelaySeconds),
      showOnDates: Array.isArray(parsed?.showOnDates)
        ? parsed.showOnDates.map((d: unknown) => String(d).trim()).filter((d: string) => d.length > 0)
        : [],
    };
  } catch {
    return DEFAULT_POPUP_STATE;
  }
};

export async function GET() {
  try {
    let content = await prisma.popupContent.findUnique({
      where: { id: 'current' },
      include: {
        questions: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    if (!content) {
      content = await prisma.popupContent.create({
        data: {
          id: 'current',
          mainHeading: '❤️ NEW CUSTOMER OFFER',
          subHeading: 'Auto-booking appointment',
          offerPrice: '£129',
          originalPrice: '£100',
          continueButtonText: 'Continue',
          lastQuestionButtonText: 'Check Required Documents',
          imageUrl: '/image/popupnew.png',
          conciergeTitle: 'Concierge Assistance',
          conciergePrice: '£35',
          conciergeOfferPrice: 'Free',
          lastChanceText: 'Last chance (ends soon) Until Jan 2026!',
          questions: {
            create: [
              { text: 'Status in United Kingdom', type: 'OPTIONS', options: ['UK BRP', 'UK ILR', 'UK BRC', 'UK Citizen'], order: 0 },
              { text: 'Schengen visa refused during the past three years?', type: 'OPTIONS', options: ['Yes', 'No'], order: 1 },
              { text: 'Main purpose of the journey', type: 'TEXT', options: [], order: 2 },
              { text: 'Help us with your Phone Number', type: 'TEXT', options: [], order: 3 },
            ]
          }
        },
        include: {
          questions: {
            orderBy: {
              order: 'asc'
            }
          }
        }
      });
    } else if (content.questions.length === 0) {
      await prisma.popupQuestion.createMany({
        data: [
          { text: 'Status in United Kingdom', type: 'OPTIONS', options: ['UK BRP', 'UK ILR', 'UK BRC', 'UK Citizen'], order: 0, popupContentId: 'current' },
          { text: 'Schengen visa refused during the past three years?', type: 'OPTIONS', options: ['Yes', 'No'], order: 1, popupContentId: 'current' },
          { text: 'Main purpose of the journey', type: 'TEXT', options: [], order: 2, popupContentId: 'current' },
          { text: 'Help us with your Phone Number', type: 'TEXT', options: [], order: 3, popupContentId: 'current' },
        ]
      });
      content = await prisma.popupContent.findUnique({
        where: { id: 'current' },
        include: {
          questions: {
            orderBy: {
              order: 'asc'
            }
          }
        }
      });
    }

    const popupStateContent = await prisma.siteContent.findUnique({
      where: { key: POPUP_STATE_KEY },
    });
    const popupState = parsePopupState(popupStateContent?.value);

    return NextResponse.json({
      success: true,
      data: {
        ...content,
        ...popupState,
      },
    });
  } catch (error: any) {
    console.error('[API_POPUP_CONTENT_GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch content', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Exclude questions and popup-state fields from popup_content update payload
    const { questions, id, isActive, triggerDelaySeconds, showOnDates, ...updateData } = body;

    const popupState = {
      isActive: typeof isActive === 'boolean' ? isActive : true,
      triggerDelaySeconds: Math.max(0, Number(triggerDelaySeconds) || DEFAULT_POPUP_STATE.triggerDelaySeconds),
      showOnDates: Array.isArray(showOnDates)
        ? showOnDates.map((d: unknown) => String(d).trim()).filter((d: string) => d.length > 0)
        : [],
    };

    console.log('[API_POPUP_CONTENT_POST] Received updateData:', updateData); // Debug log

    const updated = await prisma.popupContent.upsert({
      where: { id: 'current' },
      update: updateData,
      create: {
        id: 'current',
        ...updateData,
      },
    });

    await prisma.siteContent.upsert({
      where: { key: POPUP_STATE_KEY },
      update: {
        value: JSON.stringify(popupState),
        type: 'json',
      },
      create: {
        key: POPUP_STATE_KEY,
        value: JSON.stringify(popupState),
        type: 'json',
      },
    });
    console.log('[API_POPUP_CONTENT_POST] Successfully updated content:', updated); // Debug log
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('[API_POPUP_CONTENT_POST] ERROR:', error); // More detailed error log
    return NextResponse.json({ success: false, error: 'Failed to update content', details: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    // Delete all associated questions first due to cascade delete not being set on the relation in the schema
    await prisma.popupQuestion.deleteMany({
      where: { popupContentId: 'current' },
    });
    await prisma.popupContent.delete({
      where: { id: 'current' },
    });
    await prisma.siteContent.deleteMany({
      where: { key: POPUP_STATE_KEY },
    });
    return NextResponse.json({ success: true, message: 'Popup content deleted.' });
  } catch (error: any) {
    console.error('[API_POPUP_CONTENT_DELETE]', error);
    return NextResponse.json({ success: false, error: 'Failed to delete content', details: error.message }, { status: 500 });
  }
}