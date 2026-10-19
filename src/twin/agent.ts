import Anthropic from '@anthropic-ai/sdk';
import { systemPrompt } from './knowledge';
import { runTool, type ToolContext, tools } from './tools';

/**
 * Provider config. Production: Claude Haiku through the Anthropic API.
 * Local dev: TWIN_PROVIDER=ollama talks to Ollama's Anthropic-compatible endpoint with the same SDK.
 */
const env = (k: string) => import.meta.env[k] ?? process.env[k];
const provider = env('TWIN_PROVIDER') === 'ollama' ? 'ollama' : 'anthropic';
export const MODEL = env('TWIN_MODEL') ?? (provider === 'ollama' ? 'gpt-oss:20b' : 'claude-haiku-5-5');

const client =
  provider === 'ollama'
    ? new Anthropic({ baseURL: env('OLLAMA_BASE_URL') ?? 'http://localhost:11434', apiKey: 'ollama', maxRetries: 0 })
    : // Astro's dev server puts .env values on import.meta.env, not process.env, so pass the key explicitly.
      new Anthropic({ apiKey: env('ANTHROPIC_API_KEY'), maxRetries: 2, timeout: 30_000 });

const MAX_TOOL_ROUNDS = 3;

export type TwinEvent =
  | { type: 'text'; text: string }
  | { type: 'tool'; name: string }
  | { type: 'done'; stop: string };

/**
 * Streams the twin's answer. A manual loop (not the beta tool runner) keeps one code path that works
 * against both the Anthropic API and Ollama.
 */
export async function* answer(history: Anthropic.MessageParam[], ctx: ToolContext): AsyncGenerator<TwinEvent> {
  const system = await systemPrompt();
  const messages: Anthropic.MessageParam[] = [...history];

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 1024,
      // The system prompt is large and identical on every request, so it is cached.
      system: [
        { type: 'text', text: system, ...(provider === 'anthropic' ? { cache_control: { type: 'ephemeral' } } : {}) },
      ],
      tools,
      messages,
      // Chat answers don't need deep reasoning; low effort keeps replies fast and cheap.
      ...(provider === 'anthropic' ? { output_config: { effort: 'low' as const } } : {}),
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield { type: 'text', text: event.delta.text };
      }
    }
    const message = await stream.finalMessage();
    const u = message.usage;
    // One line per model call: shows up in Vercel's function logs, so cost and cache hits are visible.
    console.info(
      `[twin] ${MODEL} round=${round} stop=${message.stop_reason} in=${u.input_tokens} cache_read=${u.cache_read_input_tokens ?? 0} cache_write=${u.cache_creation_input_tokens ?? 0} out=${u.output_tokens}`,
    );

    if (message.stop_reason === 'refusal') {
      yield { type: 'text', text: "I can't help with that one. Ask me about Amit's work, or email him directly." };
      yield { type: 'done', stop: 'refusal' };
      return;
    }

    const toolUses = message.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
    if (message.stop_reason !== 'tool_use' || toolUses.length === 0) {
      yield { type: 'done', stop: message.stop_reason ?? 'end_turn' };
      return;
    }
    if (round === MAX_TOOL_ROUNDS) break;

    messages.push({ role: 'assistant', content: message.content });
    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const block of toolUses) {
      yield { type: 'tool', name: block.name };
      results.push(await runTool(block, ctx));
    }
    // All results for one turn go back in a single user message.
    messages.push({ role: 'user', content: results });
  }

  yield { type: 'done', stop: 'max_rounds' };
}
