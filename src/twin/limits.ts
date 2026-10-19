/**
 * Fixed-window rate limits. Uses Upstash Redis over REST when UPSTASH_REDIS_REST_URL/TOKEN are set,
 * so limits hold across Vercel instances; otherwise falls back to per-instance memory (fine for dev).
 */
const memory = new Map<string, { count: number; resetAt: number }>();

const env = (k: string) => import.meta.env[k] ?? process.env[k];

async function hit(key: string, windowSeconds: number): Promise<number> {
  const url = env('UPSTASH_REDIS_REST_URL');
  const token = env('UPSTASH_REDIS_REST_TOKEN');
  if (url && token) {
    try {
      const res = await fetch(`${url}/pipeline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify([
          ['INCR', key],
          ['EXPIRE', key, String(windowSeconds), 'NX'],
        ]),
        signal: AbortSignal.timeout(2000),
      });
      const [incr] = (await res.json()) as [{ result: number }];
      return incr.result;
    } catch {
      // Fall through to memory rather than failing the request.
    }
  }
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.resetAt < now) {
    memory.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return 1;
  }
  entry.count += 1;
  return entry.count;
}

export const LIMITS = {
  perVisitorShort: { max: 15, window: 10 * 60 },
  perVisitorDay: { max: 60, window: 24 * 60 * 60 },
  globalDay: { max: 1000, window: 24 * 60 * 60 },
  notificationsPerVisitorDay: { max: 3, window: 24 * 60 * 60 },
} as const;

/** Returns null when the request may proceed, or a message to show the visitor. */
export async function checkMessageLimits(visitor: string): Promise<string | null> {
  const [short, day, global] = await Promise.all([
    hit(`twin:v:${visitor}:10m`, LIMITS.perVisitorShort.window),
    hit(`twin:v:${visitor}:1d`, LIMITS.perVisitorDay.window),
    hit('twin:global:1d', LIMITS.globalDay.window),
  ]);
  if (global > LIMITS.globalDay.max) return 'The twin is resting for today. Email Amit directly and he will reply.';
  if (short > LIMITS.perVisitorShort.max || day > LIMITS.perVisitorDay.max) {
    return "That's a lot of questions in a short time. Give it a few minutes, or email Amit directly.";
  }
  return null;
}

export async function allowNotification(visitor: string): Promise<boolean> {
  const n = await hit(`twin:n:${visitor}:1d`, LIMITS.notificationsPerVisitorDay.window);
  return n <= LIMITS.notificationsPerVisitorDay.max;
}
