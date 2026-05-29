import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { backendGet, backendPost } from '@/lib/backend-client';

import { ensureApplicationAccess } from '@/lib/application-access-server';

// GET /api/applications/[id]/comments - Get comments for an application
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const access = await ensureApplicationAccess(session.user as any, id);
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.status === 404 ? 'Application not found' : 'Forbidden' },
        { status: access.status }
      );
    }

    const response = await backendGet(`/orders/application/${id}/comments`);
    if (!response.ok) {
      return NextResponse.json(response.data || { error: 'Backend error' }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST /api/applications/[id]/comments - Add a comment to an application
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const access = await ensureApplicationAccess(session.user as any, id);
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.status === 404 ? 'Application not found' : 'Forbidden' },
        { status: access.status }
      );
    }

    const body = await request.json();
    const { comment, isInternal = true } = body;

    if (!comment || !comment.trim()) {
      return NextResponse.json(
        { error: 'Comment is required' },
        { status: 400 }
      );
    }

    const response = await backendPost(`/orders/application/${id}/comments`, {
      comment: comment.trim(),
      isInternal,
      adminId: (session.user as any)?.id,
      adminEmail: (session.user as any)?.email
    });

    if (!response.ok) {
      return NextResponse.json(response.data || { error: 'Backend error' }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}