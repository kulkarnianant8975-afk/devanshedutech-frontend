/**
 * The quick answers to "when will you speak to them again?".
 *
 * Shared so the drawer and the send panel offer the same choices. Two lists that drifted apart
 * would teach a counsellor one set of habits in one place and a different set three inches away.
 *
 * Booking a follow-up is deliberately independent of sending anything. A call that went
 * unanswered, a message that failed to send, a student who asked to be called next week — all of
 * them need a date, and none of them involve a message going out. Tying the two together is how
 * a lead ends up with no future date on it, which is the one state the SOP does not allow.
 */

export interface FollowUpChoice {
  label: string;
  days: number;
}

export const FOLLOW_UP_CHOICES: FollowUpChoice[] = [
  { label: 'Tomorrow', days: 1 },
  { label: 'In 3 days', days: 3 },
  { label: 'Next week', days: 7 },
];

/**
 * A date as the plain YYYY-MM-DD the API expects, read in local time.
 *
 * <p>The one function every date in the CRM should go through. `toISOString().slice(0, 10)` is
 * the obvious way to write this and is wrong here: it converts to UTC first, and IST runs 5:30
 * ahead, so between midnight and half past five in the morning it returns yesterday. That is a
 * bug which passes every test run during office hours and fails silently at night — a follow-up
 * booked for tomorrow landing today, a demo week showing the wrong seven days.</p>
 */
export const isoDate = (when: Date): string => {
  const month = String(when.getMonth() + 1).padStart(2, '0');
  const day = String(when.getDate()).padStart(2, '0');
  return `${when.getFullYear()}-${month}-${day}`;
};

/** A date this many days from today, as the plain YYYY-MM-DD the API expects. */
export const dateInDays = (days: number): string => {
  const when = new Date();
  when.setDate(when.getDate() + days);
  return isoDate(when);
};

/**
 * The locale these dates are read in.
 *
 * Fixed rather than left to the browser. An undefined locale follows whatever the machine is set
 * to, which in practice meant "Aug 25" — correct in America and backwards to everyone in
 * Parbhani, who writes 25 Aug. A date that reads backwards is not a small thing on a screen
 * whose entire job is telling somebody which day to call.
 */
export const LOCALE = 'en-IN';

/** "Fri, 29 Aug" — for confirming back what was just booked. */
export const formatBooked = (iso: string): string =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(LOCALE, {
    weekday: 'short', day: 'numeric', month: 'short',
  });
