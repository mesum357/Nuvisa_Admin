import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const body = await request.json();
    const { text, type, options, order } = body;

    const updatedQuestion = await prisma.popupQuestion.update({
      where: { id },
      data: {
        text,
        type,
        options,
        order,
      },
    });

    return NextResponse.json({ success: true, data: updatedQuestion });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;

    await prisma.popupQuestion.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Question deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
