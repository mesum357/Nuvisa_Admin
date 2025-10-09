import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const comment = await prisma.applicationComment.create({
      data: {
        applicationId: params.id,
        comment: data.comment,
        isInternal: data.isInternal || false,
        createdBy: (session.user as any).id,
      },
    });

    return NextResponse.json({
      success: true,
      data: comment,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}

