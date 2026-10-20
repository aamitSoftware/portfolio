import type Anthropic from '@anthropic-ai/sdk';
import { z } from 'astro/zod';
import { notifyAmit } from './notify';

const LeadInput = z.object({
  email: z.email().max(200),
  name: z.string().max(120).optional(),
  company: z.string().max(120).optional(),
  note: z.string().max(600).optional(),
});

const UnknownInput = z.object({
  question: z.string().min(1).max(600),
});

export const tools: Anthropic.Tool[] = [
  {
    name: 'record_lead',
    description:
      "Send Amit a visitor's contact details so he can follow up personally. Use it once, as soon as the visitor gives an email address. Include their name, company and what they want to talk about if they said so.",
    input_schema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: "The visitor's email address, exactly as they wrote it." },
        name: { type: 'string', description: "The visitor's name, if given." },
        company: { type: 'string', description: 'Their company or team, if given.' },
        note: { type: 'string', description: 'One or two sentences on what they want to discuss, in your words.' },
      },
      required: ['email'],
      additionalProperties: false,
    },
  },
  {
    name: 'record_unknown_question',
    description:
      "Tell Amit about a question you couldn't answer from the facts you have, so he can answer it and improve this site. Use it every time you say you don't know.",
    input_schema: {
      type: 'object',
      properties: {
        question: { type: 'string', description: "The visitor's question, quoted as closely as possible." },
      },
      required: ['question'],
      additionalProperties: false,
    },
  },
];

export interface ToolContext {
  /** Per-visitor budget so a single chat can't spam Amit's inbox. */
  allowNotification: () => Promise<boolean>;
  transcriptTail: string;
}

/** Runs a tool call. Inputs are untrusted model output, so they are validated before anything happens. */
export async function runTool(
  block: Anthropic.ToolUseBlock,
  ctx: ToolContext,
): Promise<{ result: Anthropic.ToolResultBlockParam; delivered: boolean }> {
  const result = (content: string, isError = false, delivered = false) => ({
    result: {
      type: 'tool_result' as const,
      tool_use_id: block.id,
      content,
      ...(isError ? { is_error: true } : {}),
    },
    delivered,
  });
  const fallback = 'Ask them to email Amit directly at asherproc@gmail.com.';

  if (block.name === 'record_lead') {
    const parsed = LeadInput.safeParse(block.input);
    if (!parsed.success) return result('That email address does not look valid. Ask the visitor to check it.', true);
    if (!(await ctx.allowNotification())) return result('Already recorded for this visitor. Do not call again.');
    const { email, name, company, note } = parsed.data;
    const ok = await notifyAmit(`New lead from your portfolio: ${name ?? email}`, [
      `Name: ${name ?? '(not given)'}`,
      `Email: ${email}`,
      `Company: ${company ?? '(not given)'}`,
      `About: ${note ?? '(not given)'}`,
      '',
      'Recent conversation:',
      ctx.transcriptTail,
    ]);
    return ok
      ? result('Emailed to Amit. Tell the visitor he will reply to them by email.', false, true)
      : result(`Their details were NOT sent to Amit (email is unavailable). Say so briefly. ${fallback}`, true);
  }

  if (block.name === 'record_unknown_question') {
    const parsed = UnknownInput.safeParse(block.input);
    if (!parsed.success) return result('Invalid question.', true);
    const ok =
      (await ctx.allowNotification()) &&
      (await notifyAmit('Your twin got a question it could not answer', [parsed.data.question]));
    return ok
      ? result('Emailed the question to Amit.', false, true)
      : result(`The question was not forwarded. If they want an answer, ${fallback}`);
  }

  return result(`Unknown tool ${block.name}.`, true);
}
