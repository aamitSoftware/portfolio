/**
 * Emails Amit through Resend and returns whether the email actually went out.
 * Without RESEND_API_KEY (local dev, or before Resend is set up) it only logs, and returns false,
 * so the twin never tells a visitor something was sent when it wasn't.
 */
const TO = 'asherproc@gmail.com';

/** Whether the twin can actually email Amit. Without it, the forwarding tools are not offered at all. */
export const canNotify = () => Boolean(import.meta.env.RESEND_API_KEY ?? process.env.RESEND_API_KEY);

export async function notifyAmit(subject: string, lines: string[]): Promise<boolean> {
  const key = import.meta.env.RESEND_API_KEY ?? process.env.RESEND_API_KEY;
  const from = import.meta.env.TWIN_FROM_EMAIL ?? process.env.TWIN_FROM_EMAIL ?? 'Amit twin <onboarding@resend.dev>';
  const text = lines.join('\n');
  if (!key) {
    console.info(`[twin notify] NOT EMAILED (no RESEND_API_KEY): ${subject}\n${text}`);
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [TO], subject, text }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error(`[twin notify] Resend ${res.status}: ${await res.text()}`);
    return res.ok;
  } catch (err) {
    console.error('[twin notify] failed', err);
    return false;
  }
}
