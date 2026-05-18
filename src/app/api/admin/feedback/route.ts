import { NextRequest, NextResponse } from 'next/server';
import { backendGet } from '@/lib/backend-client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const page = request.nextUrl.searchParams.get('page') || '1';
    const limit = request.nextUrl.searchParams.get('limit') || '50';

    const response = await backendGet('/admin/feedback', { page, limit });
    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: response.data?.error || response.data?.message || 'Unable to fetch feedback submissions',
          details: response.data,
        },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: response.data?.data ?? response.data,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Unexpected error fetching feedback submissions',
      },
      { status: 500 }
    );
  }
}
