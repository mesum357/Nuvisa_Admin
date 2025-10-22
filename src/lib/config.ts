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
  BASE_URL: 'http://localhost:4000',
  
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
  return `${BACKEND_CONFIG.BASE_URL}${endpoint}`;
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
