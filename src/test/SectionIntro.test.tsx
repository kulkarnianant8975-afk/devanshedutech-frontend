import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import SectionIntro from '../components/admin/SectionIntro';

/**
 * What a screen is for, said on the screen itself.
 *
 * <p>Sixteen screens, and three of them said what they were. The rest opened onto a table and a
 * row of controls and left somebody to work it out by clicking things — on a CRM where clicking
 * the wrong thing messages a real student. "I do not know what this does" and "I am afraid to
 * touch it" are the same problem.</p>
 */

const steps = ['Answer the new enquiries', 'Clear what is overdue', 'Work today’s list'];

beforeEach(() => {
  try { window.localStorage.clear(); } catch { /* not every environment allows it */ }
});

describe('Section intro', () => {
  it('always says what the screen is for', () => {
    render(<SectionIntro screen="test" purpose="Your day, in the order the SOP asks for." steps={steps} />);
    expect(screen.getByText(/Your day, in the order the SOP asks for/)).toBeInTheDocument();
  });

  it('keeps the steps folded away until asked', () => {
    // Worth reading once and then never again. A permanent block of instructions above a table
    // somebody uses forty times a day is its own kind of clutter.
    render(<SectionIntro screen="test" purpose="Purpose." steps={steps} />);
    expect(screen.queryByText('Clear what is overdue')).not.toBeInTheDocument();
  });

  it('shows them when asked', async () => {
    const user = userEvent.setup();
    render(<SectionIntro screen="test" purpose="Purpose." steps={steps} />);

    await user.click(screen.getByRole('button', { name: /how it works/i }));
    expect(screen.getByText('Clear what is overdue')).toBeInTheDocument();
  });

  it('stops offering the steps once somebody says they have got it', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<SectionIntro screen="myday" purpose="Purpose." steps={steps} />);

    await user.click(screen.getByRole('button', { name: /how it works/i }));
    await user.click(screen.getByRole('button', { name: /got it/i }));
    unmount();

    render(<SectionIntro screen="myday" purpose="Purpose." steps={steps} />);
    expect(screen.queryByRole('button', { name: /how it works/i })).not.toBeInTheDocument();
    // The purpose stays. It is one line, and it is what somebody returning after a fortnight reads.
    expect(screen.getByText('Purpose.')).toBeInTheDocument();
  });

  it('remembers per screen, not for the whole CRM', async () => {
    // Learning the Media Library says nothing about whether you have learned Broadcasts.
    const user = userEvent.setup();
    const { unmount } = render(<SectionIntro screen="media" purpose="Purpose." steps={steps} />);
    await user.click(screen.getByRole('button', { name: /how it works/i }));
    await user.click(screen.getByRole('button', { name: /got it/i }));
    unmount();

    render(<SectionIntro screen="broadcasts" purpose="Purpose." steps={steps} />);
    expect(screen.getByRole('button', { name: /how it works/i })).toBeInTheDocument();
  });

  it('shows no toggle for a screen simple enough not to need steps', () => {
    render(<SectionIntro screen="test" purpose="Purpose." />);
    expect(screen.queryByRole('button', { name: /how it works/i })).not.toBeInTheDocument();
    expect(screen.getByText('Purpose.')).toBeInTheDocument();
  });
});
