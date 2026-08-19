/**
 * Remembers where a visitor came from, so an enquiry can be credited to the channel that
 * actually produced it.
 *
 * <p>The tags are read on the first page of a visit and kept for the session, because a student
 * usually lands on an ad, browses a few pages, and only then opens the enquiry form — by which
 * point the query string is long gone. Without this, every lead looks like it came from the
 * website and the question "which channel produces admissions" cannot be answered at all.</p>
 */

const KEY = 'devansh_attribution';

export interface Attribution {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrerUrl?: string;
}

const read = (): Attribution => {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
};

/**
 * Captures the tags from the current URL. Called once on app start.
 * First touch wins: if a visit already has attribution, later internal navigation must not
 * overwrite it with an empty referrer.
 */
export const captureAttribution = (): void => {
  try {
    const params = new URLSearchParams(window.location.search);
    const existing = read();
    if (existing.utmSource || existing.referrerUrl) return;

    const external =
      document.referrer && !document.referrer.includes(window.location.host)
        ? document.referrer
        : undefined;

    const attribution: Attribution = {
      utmSource: params.get('utm_source') || undefined,
      utmMedium: params.get('utm_medium') || undefined,
      utmCampaign: params.get('utm_campaign') || undefined,
      referrerUrl: external,
    };

    const hasAnything = Object.values(attribution).some(Boolean);
    if (hasAnything) sessionStorage.setItem(KEY, JSON.stringify(attribution));
  } catch {
    // Private browsing can refuse sessionStorage. Losing attribution is acceptable;
    // failing to show the page is not.
  }
};

/** The tags to attach to an enquiry. Safe to spread into any lead payload. */
export const getAttribution = (): Attribution => read();
