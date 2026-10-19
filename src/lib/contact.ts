import { site } from './site';

const defaultBody = `Hi Amit,

I came across your portfolio and would like to talk about

Best,
`;

/** Opens a prefilled Gmail compose window in a new tab. */
export function gmailUrl(subject: string, body = defaultBody) {
  const q = new URLSearchParams({ view: 'cm', fs: '1', to: site.email, su: subject, body });
  return `https://mail.google.com/mail/?${q.toString()}`;
}

/** Same message for whatever mail app the visitor has set up. */
export function mailtoUrl(subject: string, body = defaultBody) {
  return `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
