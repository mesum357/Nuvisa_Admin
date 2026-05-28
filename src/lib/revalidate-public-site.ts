/**
 * Ask public website(s) to clear in-memory content API caches after admin saves.
 */
function collectRevalidateTargets(): string[] {
  const urls: string[] = [];

  const list =
    process.env.FRONTEND_REVALIDATE_URLS ||
    process.env.PUBLIC_SITE_URLS ||
    '';
  for (const part of list.split(',')) {
    const trimmed = part.trim().replace(/\/+$/, '');
    if (trimmed) urls.push(trimmed);
  }

  const primary = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.FRONTEND_PUBLIC_URL ||
    ''
  )
    .trim()
    .replace(/\/+$/, '');
  if (primary) urls.unshift(primary);

  if (!urls.length) {
    urls.push('http://localhost:3002');
  }

  return [...new Set(urls)];
}

export async function revalidatePublicSite(tags: string[] = ['all']) {
  const secret = process.env.REVALIDATE_SECRET || '';
  const targets = collectRevalidateTargets();

  await Promise.all(
    targets.map(async (siteUrl) => {
      try {
        const res = await fetch(`${siteUrl}/api/revalidate-content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret, tags }),
          cache: 'no-store',
        });
        console.log('[revalidate-public-site]', {
          siteUrl,
          ok: res.ok,
          status: res.status,
          tags,
        });
      } catch (error) {
        console.warn('[revalidate-public-site] failed', { siteUrl, error });
      }
    })
  );
}
