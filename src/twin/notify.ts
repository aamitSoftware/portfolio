/**
 * Sends Amit an email through Resend. Without RESEND_API_KEY (local dev, previews)
 * it logs instead, so the twin still works end to end.
 */
const TO = 'asherproc@gmail.com';

export async function notifyAmit(subject: string, lines: string[]): Promise<boolean> {
  const key = import.meta.env.RESEND_API_KEY ?? process.env.RESEND_API_KEY;
  const from = import.meta.env.TWIN_FROM_EMAIL ?? process.env.TWIN_FROM_EMAIL ?? 'Amit twin <onboarding@resend.dev>';
  const text = lines.join('\n');
  if (!key) {
    console.info(`[twin notify] ${subject}\n${text}`);
    return true;
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
