import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { backendGet } from '@/lib/backend-client';
import { canViewAmounts } from '@/lib/utils';

// Proxy to Nest backend: GET /api/backend/applications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sp = request.nextUrl.searchParams;
    const page = sp.get('page') || '1';
    const limit = sp.get('limit') || '10';
    const status = sp.get('status') || '';
    const search = sp.get('search') || '';
    const country = sp.get('country') || '';
    const dateFrom = sp.get('dateFrom') || '';
    const dateTo = sp.get('dateTo') || '';

    // Adjust to your backend endpoint and query params
    // Use the backend search endpoint to retrieve a list
    // Map admin status to backend enum values
    const mapStatus = (s?: string) => {
      if (!s) return undefined;
      const v = s.toUpperCase();
      if (v === 'PENDING') return 'draft';
      if (v === 'SUBMITTED') return 'submitted';
      if (v === 'UNDER_REVIEW') return 'under_review';
      if (v === 'APPOINTMENT_BOOKED') return 'appointment_booked';
      if (v === 'AT_EMBASSY') return 'at_embassy';
      if (v === 'APPROVED') return 'approved';
      if (v === 'REJECTED') return 'rejected';
      if (v === 'COMPLETED') return 'completed';
      return undefined;
    };

    const queryParams: Record<string, any> = {
      page: page,
      limit: limit,
      status: mapStatus(status) || undefined,
      query: search || undefined,
      country: country || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    };

    // Remove undefined values
    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] === undefined) {
        delete queryParams[key];
      }
    });

    const res = await backendGet('/orders/search', queryParams, (session.user as any)?.email);
    if (!res.ok) {
      return NextResponse.json(res.data || { error: 'Backend error' }, { status: res.status });
    }

    // Normalize to Admin UI expected shape
    // Unwrap common backend envelope: { status, data: { results: {...}, recordsCount } }
    const envelope = (res.data as any) || {};
    const results = envelope?.data?.results ?? envelope?.results ?? envelope ?? {};
    let items = Array.isArray(results)
      ? results
      : results.applications || results.items || results.list || results.rows || [];
    const total = results?.pagination?.total || envelope?.data?.recordsCount || results.total || results.count || (Array.isArray(items) ? items.length : 0);

    const list = Array.isArray(items) ? items : [];

    // Comprehensive status normalization and filtering
    const normalizeBackendStatus = (s?: string) => {
      if (!s) return '';
      const normalized = s.toString().toLowerCase().replace(/[^a-z]+/g, '');
      return normalized;
    };

    const desired = (status || '').toUpperCase();
    const desiredSet = new Set<string>((() => {
      switch (desired) {
        case 'PENDING':
          return ['draft'];
        case 'SUBMITTED':
          return ['submitted'];
        case 'UNDER_REVIEW':
          return ['under_review'];
        case 'APPOINTMENT_BOOKED':
          return ['appointment_booked'];
        case 'AT_EMBASSY':
          return ['at_embassy'];
        case 'APPROVED':
          return ['approved'];
        case 'REJECTED':
          return ['rejected', 'cancelled'];
        case 'COMPLETED':
          return ['completed'];
        default:
          return [];
      }
    })());

    if (desiredSet.size > 0) {
      items = list.filter((it: any) => desiredSet.has(normalizeBackendStatus(it?.applicationStatus || it?.status)));
    } else {
      items = list;
    }
    // Normalize to Admin UI expected shape
    const uiItems = (Array.isArray(items) ? items : list).map((it: any) => {
      // Calculate total payment from all travelers
      let totalPayment = 0;
      if (Array.isArray(it.travelersData)) {
        totalPayment = it.travelersData.reduce((sum: number, traveler: any) => {
          const fullPayment = Number(traveler?.fullPayment?.paymentAmount || 0);
          const insurance = Number(traveler?.insurance?.paymentAmount || 0);
          return sum + fullPayment + insurance;
        }, 0);
      }
      // Fallback to application-level payment if no traveler data
      if (totalPayment === 0) {
        totalPayment = Number(it.amountPaidTotal || it.amountPaid || 0);
      }

      // Use the same formatting as frontend for consistency
      const formatApplicationId = (rawId: any) => {
        if (!rawId) return null;
        const numericTail = (source: any, length: number) => {
          if (!source) return "".padStart(length, "0");
          let digits = String(source).replace(/\D+/g, "");
          if (digits.length < length) {
            const codes = Array.from(String(source))
              .map((c) => c.charCodeAt(0))
              .join("");
            digits = (digits + codes).replace(/\D+/g, "");
          }
          if (!digits.length) {
            digits = "0".repeat(length);
          }
          return digits.slice(-length).padStart(length, "0");
        };
        return `AI${numericTail(rawId, 8)}`;
      };

      const formatOrderId = (rawOrderId: any) => {
        if (!rawOrderId) return null;
        const numericTail = (source: any, length: number) => {
          if (!source) return "".padStart(length, "0");
          let digits = String(source).replace(/\D+/g, "");
          if (digits.length < length) {
            const codes = Array.from(String(source))
              .map((c) => c.charCodeAt(0))
              .join("");
            digits = (digits + codes).replace(/\D+/g, "");
          }
          if (!digits.length) {
            digits = "0".repeat(length);
          }
          return digits.slice(-length).padStart(length, "0");
        };
        return `ORD${numericTail(rawOrderId, 6)}`;
      };

      // Format application number using the same logic as frontend
      const applicationNo = formatApplicationId(it.id);
      const orderId = formatOrderId(it.orderId);

      return {
        id: it.id,
        applicationNo: applicationNo,
        orderId: orderId,
        status: typeof it.applicationStatus === 'string' ? it.applicationStatus : 'UNKNOWN',
        totalAmount: canViewAmounts(session.user) ? totalPayment : 0,
        paidAmount: canViewAmounts(session.user) ? totalPayment : 0,
        submittedAt: it.createdAt,
        country: it.country || '-',
        user: {
          id: it.email,
          name: it.email,
          email: it.email,
          phone: undefined,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        data: uiItems,
        pagination: {
          page: Number(results?.pagination?.page ?? page),
          limit: Number(results?.pagination?.limit ?? limit),
          total: Number(total || uiItems.length || 0),
          totalPages: Number(
            results?.pagination?.totalPages ?? Math.ceil((Number(total || uiItems.length || 0)) / Number((results?.pagination?.limit ?? limit) || 1))
          ),
        },
      },
    });
  } catch (_error: any) {
    return NextResponse.json({ error: 'Failed to fetch from backend' }, { status: 500 });
  }
}


