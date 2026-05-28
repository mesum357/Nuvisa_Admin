/**
 * Centralized configuration for backend API URLs
 * This ensures consistent base URL usage across all API routes
 */

/**
 * Centralized configuration for backend API URLs
 * PRODUCTION CONFIGURATION - Uses live backend
 */

export const BACKEND_CONFIG = {
  // Backend API URL - use local backend for development
  BASE_URL: process.env.BACKEND_API_URL || 'http://localhost:4000',
  
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

/**
 * Rewrite localhost/127.0.0.1 upload URLs stored in the DB to the configured backend.
 */
export function resolveBackendFileUrl(rawUrl?: string | null): string | null {
  if (rawUrl == null) return null;
  const trimmed = String(rawUrl).trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;

  const backendBase = BACKEND_CONFIG.BASE_URL.replace(/\/+$/, '');

  try {
    const parsed = new URL(trimmed, backendBase);
    const isLocalHost = /^(localhost|127\.0\.0\.1)$/i.test(parsed.hostname);
    if (isLocalHost && parsed.pathname) {
      return `${backendBase}${parsed.pathname}${parsed.search || ''}`;
    }
    if (trimmed.startsWith('/')) {
      return `${backendBase}${trimmed}`;
    }
    return trimmed;
  } catch {
    const path = trimmed.replace(/^\/+/, '');
    if (path.startsWith('uploads/')) {
      return `${backendBase}/${path}`;
    }
    return trimmed;
  }
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
