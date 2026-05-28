/**
 * Centralized configuration for backend API URLs
 * This ensures consistent base URL usage across all API routes
 */

/**
 * Centralized configuration for backend API URLs
 * PRODUCTION CONFIGURATION - Uses live backend
 */

const stripTrailingSlash = (url: string) => url.replace(/\/+$/, '');

/** Server-side fetches (download proxy, backend API). */
export function getInternalBackendBaseUrl(): string {
  return stripTrailingSlash(process.env.BACKEND_API_URL || 'http://localhost:4000');
}

/** Browser-facing file URLs (View in new tab). */
export function getPublicBackendBaseUrl(): string {
  return stripTrailingSlash(
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
      process.env.BACKEND_PUBLIC_URL ||
      process.env.BACKEND_API_URL ||
      'http://localhost:4000'
  );
}

export const BACKEND_CONFIG = {
  // Backend API URL - use local backend for development
  BASE_URL: getInternalBackendBaseUrl(),
  
  // Admin origin for CORS headers
  ADMIN_ORIGIN: process.env.ADMIN_PUBLIC_URL || 'http://localhost:3001',
  
  // API endpoints
  ENDPOINTS: {
    AUTH: {
      GENERATE_TOKEN: '/auth/generate-token',
      LOGIN: '/auth/login',
    },
    ORDERS: {
      SEARCH: '/orders/search',
      USERS: '/orders/users',
      APPLICANTS: '/orders/applicants',
      USER_BY_ID: (id: string) => `/orders/users/${encodeURIComponent(id)}`,
      APPLICATION_BY_ID: (id: string) => `/orders/application/${id}`,
    },
  },
} as const;

/**
 * Get the full URL for a backend endpoint
 */
export function getBackendUrl(endpoint: string): string {
  // Normalize to avoid double slashes when BASE_URL has trailing slash
  const base = BACKEND_CONFIG.BASE_URL.replace(/\/+$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}

function rewriteFileUrlToBase(rawUrl: string, backendBase: string): string {
  if (rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) return rawUrl;

  try {
    const parsed = new URL(rawUrl, backendBase);
    const isLocalHost = /^(localhost|127\.0\.0\.1)$/i.test(parsed.hostname);
    if (isLocalHost && parsed.pathname) {
      return `${backendBase}${parsed.pathname}${parsed.search || ''}`;
    }
    if (rawUrl.startsWith('/')) {
      return `${backendBase}${rawUrl}`;
    }
    return rawUrl;
  } catch {
    const path = rawUrl.replace(/^\/+/, '');
    if (path.startsWith('uploads/')) {
      return `${backendBase}/${path}`;
    }
    return rawUrl;
  }
}

/** Rewrite stored upload URLs for browser display (public API host). */
export function resolveBackendFileUrl(rawUrl?: string | null): string | null {
  if (rawUrl == null) return null;
  const trimmed = String(rawUrl).trim();
  if (!trimmed) return null;
  return rewriteFileUrlToBase(trimmed, getPublicBackendBaseUrl());
}

/** Rewrite stored upload URLs for server-side fetch (internal host). */
export function resolveBackendFileUrlForFetch(rawUrl?: string | null): string | null {
  if (rawUrl == null) return null;
  const trimmed = String(rawUrl).trim();
  if (!trimmed) return null;
  return rewriteFileUrlToBase(trimmed, getInternalBackendBaseUrl());
}

/**
 * Get common headers for backend requests
 */
export function getBackendHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Admin-Origin': BACKEND_CONFIG.ADMIN_ORIGIN,
    'X-Admin-Proxy': '1',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}
