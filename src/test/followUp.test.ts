import { describe, it, expect, afterEach, vi } from 'vitest';
import { dateInDays, formatBooked, FOLLOW_UP_CHOICES } from '../lib/followUp';

/**
 * The date a follow-up actually lands on.
 *
 * This is worth testing precisely because getting it wrong is invisible. A follow-up booked a
 * day early does not fail — it simply appears in My Day on the wrong morning, and nobody can
 * tell that from a counsellor mis-remembering what they clicked.
 */

afterEach(() => vi.useRealTimers());

/** Freezes the clock at a moment in IST, expressed as the UTC instant it corresponds to. */
const atIST = (isoUtc: string) => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(isoUtc));
};

describe('dateInDays', () => {
  it('counts forward from today in local time', () => {
    // 22 Aug, 12:06 IST — a normal working moment.
    atIST('2026-08-22T06:36:00Z');

    expect(dateInDays(1)).toBe('2026-08-23');
    expect(dateInDays(3)).toBe('2026-08-25');
    expect(dateInDays(7)).toBe('2026-08-29');
  });

  it('does not land a day early in the early morning', () => {
    // 22 Aug, 4:00am IST is still 21 Aug in UTC. toISOString would return the 21st, so
    // "tomorrow" would be booked for today and appear in My Day the same morning.
    atIST('2026-08-21T22:30:00Z');

    const tomorrow = dateInDays(1);
    expect(tomorrow).not.toBe('2026-08-22');
    expect(tomorrow).toBe('2026-08-23');
  });

  it('rolls over the end of a month', () => {
    atIST('2026-08-30T06:00:00Z');
    expect(dateInDays(3)).toBe('2026-09-02');
  });

  it('pads single digits, because the API takes YYYY-MM-DD and nothing else', () => {
    atIST('2026-09-04T06:00:00Z');
    expect(dateInDays(1)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(dateInDays(1)).toBe('2026-09-05');
  });
});

describe('formatBooked', () => {
  it('reads the date back as the day a person would say', () => {
    // Parsed at midnight local rather than as a bare date, which some engines read as UTC and
    // then render as the previous evening.
    expect(formatBooked('2026-08-29')).toContain('29');
    expect(formatBooked('2026-08-29')).toContain('Aug');
  });
});

describe('FOLLOW_UP_CHOICES', () => {
  it('offers the three answers a counsellor actually gives', () => {
    expect(FOLLOW_UP_CHOICES.map(c => c.days)).toEqual([1, 3, 7]);
  });

  it('never offers today, which is not a follow-up', () => {
    expect(FOLLOW_UP_CHOICES.every(c => c.days >= 1)).toBe(true);
  });
});
