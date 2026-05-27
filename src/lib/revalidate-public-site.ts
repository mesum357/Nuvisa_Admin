/**
 * Ask the public website to clear its in-memory content API caches after admin saves.
 */
export async function revalidatePublicSite(tags: string[] = ['all']) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002').replace(
    /\/+$/,
    ''
  );
  const secret = process.env.REVALIDATE_SECRET || '';
  try {
    const res = await fetch(`${siteUrl}/api/revalidate-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, tags }),
      cache: 'no-store',
    });
    console.log('[revalidate-public-site]', { ok: res.ok, status: res.status, tags });
  } catch (error) {
    console.warn('[revalidate-public-site] failed', error);
  }
}
