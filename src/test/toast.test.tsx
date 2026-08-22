import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ToastProvider, useToast } from '../lib/toast';

/**
 * framer-motion is stubbed out here, and only here.
 *
 * Its exit animation never completes under jsdom — there is no compositor to drive it — so
 * AnimatePresence holds every dismissed toast in the DOM forever and each removal assertion
 * below would pass or fail for reasons that have nothing to do with this code. The animation
 * works in a browser; what is worth testing is which toasts this provider decides to keep.
 */
vi.mock('framer-motion', () => {
  const strip = (props: Record<string, unknown>) => {
    const { initial, animate, exit, layout, transition, ...rest } = props;
    void initial; void animate; void exit; void layout; void transition;
    return rest;
  };
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    motion: new Proxy({}, {
      get: () => ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) =>
        React.createElement('div', strip(props), children),
    }),
  };
});

/**
 * The rule worth protecting here is the asymmetry.
 *
 * A confirmation clears itself, because it tells somebody what they already knew they were doing.
 * A failure does not, because it tells them something they do not yet know and now have to act
 * on — and the one time it clears itself unread is the time a message never reached a student
 * and nobody found out.
 */

const Harness = () => {
  const toast = useToast();
  // Distinct messages where the test is about how many toasts survive, because identical ones
  // are deliberately collapsed into one.
  const n = React.useRef(0);
  return (
    <div>
      <button onClick={() => toast.success('Saved.', 'It is in the library now.')}>ok</button>
      <button onClick={() => toast.error('That could not be saved.')}>fail</button>
      <button onClick={() => toast.error(`Send ${++n.current} failed.`)}>fail-distinct</button>
      <button onClick={() => toast.success(`Row ${++n.current} saved.`)}>ok-distinct</button>
    </div>
  );
};

/**
 * `fake` installs the fake clock BEFORE userEvent.setup, which is not optional: setup captures
 * the timer implementation at call time, so faking afterwards leaves userEvent awaiting a real
 * delay that the fake clock will never advance, and the test simply hangs.
 */
const mount = (fake = false) => {
  // Only the timer the toast itself uses. Faking the whole clock also replaces the APIs React's
  // scheduler runs on, and rendering then waits on a clock nothing is advancing.
  if (fake) vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  const user = userEvent.setup(
    fake ? { advanceTimers: vi.advanceTimersByTime, delay: null } : { delay: null });
  render(<ToastProvider><Harness /></ToastProvider>);
  return user;
};

afterEach(() => vi.useRealTimers());

describe('toasts', () => {
  it('shows the message and its detail', async () => {
    const user = mount();
    await user.click(screen.getByText('ok'));

    expect(screen.getByText('Saved.')).toBeInTheDocument();
    expect(screen.getByText('It is in the library now.')).toBeInTheDocument();
  });

  // These two drive the clock, so they click with fireEvent rather than userEvent: userEvent
  // awaits a real timer between its own steps, which a faked clock never advances.
  it('clears a confirmation on its own', () => {
    mount(true);
    fireEvent.click(screen.getByText('ok'));
    expect(screen.getByText('Saved.')).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(5000); });
    expect(screen.queryByText('Saved.')).not.toBeInTheDocument();
  });

  it('leaves a failure on screen indefinitely', () => {
    mount(true);
    fireEvent.click(screen.getByText('fail'));

    // Far longer than any confirmation would survive.
    act(() => { vi.advanceTimersByTime(120_000); });
    expect(screen.getByText('That could not be saved.')).toBeInTheDocument();
  });

  it('lets a failure be dismissed by hand', async () => {
    const user = mount();
    await user.click(screen.getByText('fail'));
    await user.click(screen.getByRole('button', { name: /dismiss/i }));

    expect(screen.queryByText('That could not be saved.')).not.toBeInTheDocument();
  });

  it('interrupts a screen reader for a failure but not for a confirmation', async () => {
    const user = mount();
    await user.click(screen.getByText('fail'));
    await user.click(screen.getByText('ok'));

    expect(screen.getByRole('alert')).toHaveTextContent('That could not be saved.');
    expect(screen.getByRole('status')).toHaveTextContent('Saved.');
  });

  it('says the same thing once, however many times it is reported', async () => {
    // A screen that loads two things reports the same expired token from both, and two
    // identical red cards read as two separate problems.
    const user = mount();
    await user.click(screen.getByText('fail'));
    await user.click(screen.getByText('fail'));
    await user.click(screen.getByText('fail'));

    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });

  it('never drops a failure to keep the stack short', async () => {
    // Seven failed sends are seven students who did not get their message. Evicting three of
    // them to tidy the corner would undo the reason failures do not auto-dismiss at all.
    const user = mount();
    for (let i = 0; i < 7; i++) await user.click(screen.getByText('fail-distinct'));

    await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(7));
  });

  it('lets confirmations give up their place in a burst', async () => {
    // These are the disposable ones — each repeats something the person just did.
    const user = mount();
    for (let i = 0; i < 7; i++) await user.click(screen.getByText('ok-distinct'));

    await waitFor(() => expect(screen.getAllByRole('status').length).toBeLessThanOrEqual(4));
  });

  it('does not crash a component rendered without a provider', () => {
    // Tests mount single screens all the time, and a missing confirmation is a far smaller
    // problem than a screen that throws because nobody wrapped it.
    expect(() => render(<Harness />)).not.toThrow();
  });
});
