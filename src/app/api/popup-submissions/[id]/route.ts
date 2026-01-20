import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;

    await prisma.userAccount.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Submission deleted' });
  } catch (error: any) {
    console.error('[API_POPUP_SUBMISSIONS_DELETE]', error);
    return NextResponse.json({ success: false, error: 'Failed to delete submission', details: error.message }, { status: 500 });
  }
}
