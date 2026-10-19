import type Anthropic from '@anthropic-ai/sdk';
import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { answer } from '../../twin/agent';
import { allowNotification, checkMessageLimits } from '../../twin/limits';

// The only route on the site that runs as a function; everything else is static.
export const prerender = false;

const Body = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(24),
});

const MAX_USER_CHARS = 800;
const KEEP_LAST = 12;

const json = (status: number, error: string) =>
  new Response(JSON.stringify({ error }), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request, clientAddress, site }) => {
  // Same-origin only, so other sites can't spend this API.
  const origin = request.headers.get('origin');
  const allowed = [site?.origin, 'http://localhost:4321', 'http://localhost:4322'];
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) allowed.push(`https://${vercelUrl}`);
  // Vercel preview deployments of this project: amitasher-<hash or branch>-<scope>.vercel.app
  const isOwnPreview = origin ? /^https:\/\/amitasher(-[a-z0-9-]+)?\.vercel\.app$/.test(origin) : false;
  if (origin && !allowed.includes(origin) && !isOwnPreview) return json(403, 'Forbidden');

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch {
    return json(400, 'Send { messages: [{ role, content }] }.');
  }

  const history = body.messages.slice(-KEEP_LAST);
  while (history.length && history[0].role !== 'user') history.shift();
  const last = history.at(-1);
  if (last?.role !== 'user') return json(400, 'The last message must be from the visitor.');
  if (last.content.length > MAX_USER_CHARS) return json(400, `Keep questions under ${MAX_USER_CHARS} characters.`);

  const visitor = await hashVisitor(clientAddress ?? request.headers.get('x-forwarded-for') ?? 'unknown');
  const limited = await checkMessageLimits(visitor);
  if (limited) return json(429, limited);

  const messages: Anthropic.MessageParam[] = history.map((m) => ({ role: m.role, content: m.content }));
  const transcriptTail = history
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'Visitor' : 'Twin'}: ${m.content}`)
    .join('\n');

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      try {
        for await (const ev of answer(messages, {
          allowNotification: () => allowNotification(visitor),
          transcriptTail,
        })) {
          if (ev.type === 'text') send('text', ev.text);
          else if (ev.type === 'tool') send('tool', ev.name);
          else send('done', ev.stop);
        }
      } catch (err) {
        console.error('[twin] error', err);
        send('error', 'The twin hit a snag. Try again, or email Amit directly.');
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};

async function hashVisitor(ip: string) {
  const first = ip.split(',')[0].trim();
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`twin:${first}`));
  return [...new Uint8Array(digest)]
    .slice(0, 12)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
