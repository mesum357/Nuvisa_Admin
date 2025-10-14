const baseURL = process.env.BACKEND_API_URL || 'https://app.nuvisa.co.uk';
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
  if (!baseURL) return undefined;
  try {
    const res = await fetch(baseURL + '/auth/generate-token', {
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
      const res = await fetch(baseURL + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: requesterEmail, sessionUser: true }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({} as any));
        const token = data?.data?.token || data?.token || data?.data?.data?.token;
        if (typeof token === 'string' && token.length > 0) {
          cachedTokenByEmail[requesterEmail] = { token, exp: now + 10 * 60 * 1000 };
          return token;
        }
      }
    }
  } catch {}
  return undefined;
}

if (!baseURL) {
  // Throw at import time so it's obvious in dev
  // but avoid crashing in prod build if env is injected later
  if (process.env.NODE_ENV !== 'production') {
    throw new Error('BACKEND_API_URL is not configured');
  }
}

export const backendGet = async (path: string, params?: Record<string, any>, requesterEmail?: string) => {
  const url = new URL(baseURL + path);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }
  const headers: Record<string, string> = {};
  const adminOrigin = process.env.ADMIN_PUBLIC_URL || 'http://localhost:3001';
  headers['X-Admin-Origin'] = adminOrigin;
  headers['X-Admin-Proxy'] = '1';
  const token = await ensureToken(requesterEmail);
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url.toString(), { cache: 'no-store', headers });
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
  const url = baseURL + path;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const adminOrigin = process.env.ADMIN_PUBLIC_URL || 'http://localhost:3001';
  headers['X-Admin-Origin'] = adminOrigin;
  headers['X-Admin-Proxy'] = '1';
  const token = await ensureToken(requesterEmail);
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'PATCH', headers, cache: 'no-store', body: body ? JSON.stringify(body) : undefined });
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


