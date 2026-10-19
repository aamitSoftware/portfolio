/**
 * Build-time lookup of when a public repo was last pushed.
 * Any failure (rate limit, private repo, offline build) returns null and the
 * page simply leaves the line out.
 */
const cache = new Map<string, Promise<Date | null>>();

export function lastPushed(repoUrl: string | undefined): Promise<Date | null> {
  if (!repoUrl) return Promise.resolve(null);
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/#?]+)/);
  if (!match) return Promise.resolve(null);
  const key = `${match[1]}/${match[2]}`;
  let pending = cache.get(key);
  if (!pending) {
    pending = fetchPushed(key);
    cache.set(key, pending);
  }
  return pending;
}

async function fetchPushed(key: string): Promise<Date | null> {
  const token = import.meta.env.GITHUB_TOKEN ?? process.env.GITHUB_TOKEN;
  try {
    const res = await fetch(`https://api.github.com/repos/${key}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { pushed_at?: string };
    return body.pushed_at ? new Date(body.pushed_at) : null;
  } catch {
    return null;
  }
}

export const formatDate = (d: Date) =>
  d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
