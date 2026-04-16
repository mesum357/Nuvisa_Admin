import { BACKEND_CONFIG, getBackendUrl, getBackendHeaders } from './config';

// STRICT STATIC CONFIGURATION - Always uses production backend
const baseURL = BACKEND_CONFIG.BASE_URL;
const staticToken = process.env.BACKEND_API_TOKEN; // optional service token

let cachedToken: string | null = null;
let cachedTokenExpiry = 0; // epoch ms
const cachedTokenByEmail: Record<string, { token: string; exp: number }> = {};

async function ensureToken(requesterEmail?: string): Promise<string | undefined> {
  if (staticToken) return staticToken;
  const now = Date.now();
  if (requesterEmail && cachedTokenByEmail[requesterEmail]?.token && now < cachedTokenByEmail[requesterEmail].exp) {
    return cachedTokenByEmail[requesterEmail].token;
  }
  if (cachedToken && now < cachedTokenExpiry) return cachedToken;
  try {
    const res = await fetch(getBackendUrl(BACKEND_CONFIG.ENDPOINTS.AUTH.GENERATE_TOKEN), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return undefined;
    const data = await res.json().catch(() => ({} as any));
    // Try common shapes: {data:{token}}, {token}, {data:{data:{token}}}
    const token = data?.data?.token || data?.token || data?.data?.data?.token;
    if (typeof token === 'string' && token.length > 0) {
      cachedToken = token;
      cachedTokenExpiry = now + 10 * 60 * 1000; // cache 10 minutes
      return cachedToken;
    }
  } catch {}
  // Fallback: try login with requesterEmail using sessionUser flow that returns token immediately
  try {
    if (requesterEmail) {
      const res = await fetch(getBackendUrl(BACKEND_CONFIG.ENDPOINTS.AUTH.LOGIN), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: requesterEmail, sessionUser: true }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({} as any));
        const token = data?.data?.token || data?.token || data?.data?.data?.token;
        console.log('Login token response for', requesterEmail, { token, data });
        if (typeof token === 'string' && token.length > 0) {
          cachedTokenByEmail[requesterEmail] = { token, exp: now + 10 * 60 * 1000 };
          return token;
        }
      }
    }
  } catch {}
  return undefined;
}

// STRICT STATIC CONFIGURATION - No environment variable checks needed
// baseURL is always 'https://app.nuvisa.co.uk'

export const backendGet = async (path: string, params?: Record<string, any>, requesterEmail?: string) => {
  const url = new URL(getBackendUrl(path));
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }
  // Use admin proxy headers instead of trying to get JWT token
  // This bypasses the need for user authentication since we're the admin panel
  const headers = getBackendHeaders();
  console.log('Making backend GET request to', url.toString(), { requesterEmail, token: token ? '***' : null });
  const res = await fetch(url.toString(), { 
    cache: 'no-store', 
    headers,
    mode: 'cors',
    credentials: 'include'
  });
  let data: any = null;
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  return { ok: res.ok, status: res.status, data };
};

export const backendPost = async (path: string, body?: any, requesterEmail?: string) => {
  const url = getBackendUrl(path);
  // Use admin proxy headers instead of trying to get JWT token
  const headers = getBackendHeaders();
  const res = await fetch(url, { 
    method: 'POST', 
    headers, 
    cache: 'no-store', 
    body: body ? JSON.stringify(body) : undefined,
    mode: 'cors',
    credentials: 'include'
  });
  let data: any = null;
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  return { ok: res.ok, status: res.status, data };
};

export const backendPatch = async (path: string, body?: any, requesterEmail?: string) => {
  const url = getBackendUrl(path);
  // Use admin proxy headers instead of trying to get JWT token
  const headers = getBackendHeaders();
  const res = await fetch(url, { 
    method: 'PATCH', 
    headers, 
    cache: 'no-store', 
    body: body ? JSON.stringify(body) : undefined,
    mode: 'cors',
    credentials: 'include'
  });
  let data: any = null;
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  return { ok: res.ok, status: res.status, data };
};

export const backendDelete = async (path: string, _requesterEmail?: string) => {
  const url = getBackendUrl(path);
  const headers = getBackendHeaders();
  const res = await fetch(url, {
    method: 'DELETE',
    headers,
    cache: 'no-store',
    mode: 'cors',
    credentials: 'include'
  });
  let data: any = null;
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  return { ok: res.ok, status: res.status, data };
};

export default { backendGet };
