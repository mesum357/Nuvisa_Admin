type CacheEntry<T> = { data: T; expiresAt: number };

const stores = new Map<string, Map<string, CacheEntry<unknown>>>();

function getStore(namespace: string) {
  let store = stores.get(namespace);
  if (!store) {
    store = new Map();
    stores.set(namespace, store);
  }
  return store;
}

export function readRouteCache<T>(namespace: string, key: string): T | null {
  const entry = getStore(namespace).get(key) as CacheEntry<T> | undefined;
  if (!entry || entry.expiresAt <= Date.now()) return null;
  return entry.data;
}

export function writeRouteCache<T>(
  namespace: string,
  key: string,
  data: T,
  ttlMs: number,
) {
  getStore(namespace).set(key, { data, expiresAt: Date.now() + ttlMs });
}

export const PUBLIC_CONTENT_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};

export const DASHBOARD_STATS_CACHE_MS = 45 * 1000;
