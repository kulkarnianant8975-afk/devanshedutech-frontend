import { describe, it, expect } from 'vitest';
import { errorMessage } from '../services/api';

/**
 * What a counsellor is told when something fails.
 *
 * The rule these all check is a single one: whatever comes out of here is a sentence somebody
 * with a student in front of them can act on. Axios's own wording — "Request failed with status
 * code 500" — is the thing being kept off the screen, and it is easy to reintroduce by accident,
 * because it is what you get for free by returning `err.message`.
 */

const withStatus = (status: number, data?: unknown) => ({
  response: { status, data },
  message: `Request failed with status code ${status}`,
});

describe('errorMessage', () => {
  it('prefers what the server actually said', () => {
    // The backend knows things this function cannot guess — which field was wrong, which rule
    // was broken. When it has bothered to say so, that always wins over a generic mapping.
    expect(errorMessage(withStatus(400, { message: 'Marking a lead lost needs a reason.' })))
      .toBe('Marking a lead lost needs a reason.');
  });

  it('keeps a plain-text body', () => {
    expect(errorMessage(withStatus(400, 'That number is not on the allowed list.')))
      .toBe('That number is not on the allowed list.');
  });

  it.each([
    [401, /sign in again/i],
    [403, /do not have permission/i],
    [404, /no longer there/i],
    [409, /someone else changed this/i],
    [413, /too large/i],
    [429, /wait a moment/i],
    [500, /broke on the server/i],
    [503, /restarting or unreachable/i],
  ])('explains a bare %i in words, not a number', (status, expected) => {
    expect(errorMessage(withStatus(status))).toMatch(expected);
  });

  it('says the connection failed when the request never arrived', () => {
    // No response object at all. Telling somebody the server "returned an error" here would be a
    // lie — it never heard from them.
    expect(errorMessage({ code: 'ERR_NETWORK', message: 'Network Error' }))
      .toMatch(/could not reach the server/i);
  });

  it('warns that a timed-out request may still have worked', () => {
    // This matters more than it looks: a counsellor who retries a timed-out send can put the same
    // message in front of a student twice.
    expect(errorMessage({ code: 'ECONNABORTED' })).toMatch(/may still have worked/i);
  });

  it('never leaks axios status text to a human', () => {
    const leaks = [
      withStatus(500),
      withStatus(404),
      { message: 'Request failed with status code 502', response: { status: 502 } },
    ];
    for (const err of leaks) {
      expect(errorMessage(err)).not.toMatch(/status code/i);
    }
  });

  it('never prints the proxy\'s HTML error page at somebody', () => {
    // This is the real 200 MB-video case: Caddy refuses the upload itself and answers with a
    // whole HTML document, which never reaches the backend and so carries no message of ours.
    const proxyPage = '<!DOCTYPE html>\n<html><head><title>413 Request Entity Too Large</title>'
      + '</head><body><center><h1>413</h1></center></body></html>';
    const message = errorMessage({ response: { status: 413, data: proxyPage } });

    expect(message).not.toMatch(/</);
    expect(message).toMatch(/too large/i);
  });

  it('falls back to the caller sentence when nothing else is known', () => {
    expect(errorMessage({}, 'That could not be saved.')).toBe('That could not be saved.');
  });

  it('ignores a Java exception name masquerading as a message', () => {
    // Some error bodies put a class name in `error` — "Internal Server Error",
    // "IllegalStateException". That is not a sentence, and showing it is how a CRM ends up
    // telling a counsellor about NullPointerException.
    expect(errorMessage(withStatus(500, { error: 'Internal Server Error' })))
      .toMatch(/broke on the server/i);
  });
});
