/**
 * Opening a chat with one particular student.
 *
 * There are two links to WhatsApp and they behave differently on a desk.
 *
 * `https://wa.me/…` goes through the browser. On a phone that hands off to the app; on a desktop
 * it lands on WhatsApp Web, which is a second place to be logged in, a QR code to scan when the
 * session lapses, and a different set of chats from the one on the counsellor's phone.
 *
 * `whatsapp://send?phone=…` is the app's own protocol. Where WhatsApp Desktop is installed it
 * opens straight into the conversation with that number, message already typed. That is what a
 * counsellor working at a desk wants, so it is what they get — with the browser link kept as a
 * visible fallback, because a protocol that nothing handles fails silently and stranding
 * somebody mid-conversation is worse than an extra link on screen.
 */

/** Digits only, with India's country code, which is the only form either link accepts. */
export const toWhatsAppNumber = (raw: string): string | null => {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) return null;

  // A stored number is whatever a student typed: "+91 98765 43210", "098765-43210", or the bare
  // ten digits. All three are the same person.
  const local = digits.length === 11 && digits.startsWith('0') ? digits.slice(1) : digits;
  if (local.length === 10) return `91${local}`;
  if (local.length === 12 && local.startsWith('91')) return local;
  return local.length >= 10 ? local : null;
};

export interface WhatsAppLinks {
  /** The desktop or phone app, opened directly on that number. */
  app: string;
  /** The browser route, for when nothing has registered the protocol. */
  web: string;
}

export const whatsappLinks = (phone: string, text: string): WhatsAppLinks | null => {
  const number = toWhatsAppNumber(phone);
  if (!number) return null;

  const encoded = encodeURIComponent(text);
  return {
    app: `whatsapp://send?phone=${number}&text=${encoded}`,
    web: `https://wa.me/${number}?text=${encoded}`,
  };
};

/**
 * Hands the link to the operating system.
 *
 * An anchor click rather than `window.open`, which pops a blank tab that then sits there empty
 * once the app takes over, and rather than assigning `location.href`, which can navigate the CRM
 * itself to an error page when no handler exists.
 */
export const openInApp = (url: string): void => {
  const a = document.createElement('a');
  a.href = url;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
};
