import { describe, it, expect } from 'vitest';
import { toWhatsAppNumber, whatsappLinks } from '../lib/whatsapp';

/**
 * Getting a counsellor into the right conversation, on the app they already use.
 *
 * A stored number is whatever a student typed into a form on a phone, and every one of these
 * spellings is the same person. Getting it wrong does not fail loudly — WhatsApp opens on a
 * blank chat or an unknown number, which a counsellor discovers only after typing a message.
 */

describe('toWhatsAppNumber', () => {
  it.each([
    ['9876543210', '919876543210', 'the bare ten digits'],
    ['+91 98765 43210', '919876543210', 'the international form with spaces'],
    ['098765-43210', '919876543210', 'a leading zero and a dash'],
    ['+919876543210', '919876543210', 'already complete'],
    ['91 98765 43210', '919876543210', 'a country code and no plus'],
  ])('%s becomes %s (%s)', (input, expected) => {
    expect(toWhatsAppNumber(input)).toBe(expected);
  });

  it('refuses a number too short to be a phone', () => {
    // Better to say the number is unusable than to open a chat with a wrong one.
    expect(toWhatsAppNumber('12345')).toBeNull();
    expect(toWhatsAppNumber('')).toBeNull();
    expect(toWhatsAppNumber('not a number')).toBeNull();
  });
});

describe('whatsappLinks', () => {
  it('offers the app first and the browser as a way out', () => {
    const links = whatsappLinks('9876543210', 'Hello Rohit');

    // The app protocol is what opens WhatsApp Desktop on this number rather than sending a
    // counsellor to WhatsApp Web to scan a QR code.
    expect(links?.app).toBe('whatsapp://send?phone=919876543210&text=Hello%20Rohit');
    expect(links?.web).toBe('https://wa.me/919876543210?text=Hello%20Rohit');
  });

  it('encodes a message with newlines and links intact', () => {
    // Brochures arrive as URLs on their own lines. An unencoded newline truncates the message
    // at the first line break, so the student gets the greeting and none of the files.
    const links = whatsappLinks('9876543210',
      'Here you go:\n\nhttps://www.devanshedutech.com/api/public/a/tok');

    expect(links?.app).toContain('%0A%0A');
    expect(links?.app).toContain(encodeURIComponent('https://www.devanshedutech.com/api/public/a/tok'));
    expect(links?.app).not.toContain('\n');
  });

  it('returns nothing when the lead has no usable number', () => {
    expect(whatsappLinks('', 'Hello')).toBeNull();
    expect(whatsappLinks('123', 'Hello')).toBeNull();
  });
});
