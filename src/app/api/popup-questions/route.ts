import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, type, options, order, popupContentId } = body;

    const newQuestion = await prisma.popupQuestion.create({
      data: {
        text,
        type,
        options,
        order,
        popupContent: {
          connect: { id: popupContentId },
        },
      },
    });

    return NextResponse.json({ success: true, data: newQuestion });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
