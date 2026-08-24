import { render, screen } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import LastFollowUp from '../components/admin/LastFollowUp';

/**
 * When somebody last spoke to this student.
 *
 * <p>The lists answered "when is this due next" and never "when did we last try", which are
 * different questions. A lead due tomorrow that nobody has reached in three weeks needs a
 * different call from one spoken to yesterday, and the row looked identical either way.</p>
 */

const at = (daysAgo: number): string => {
  const when = new Date();
  when.setDate(when.getDate() - daysAgo);
  return when.toISOString();
};

afterEach(() => vi.useRealTimers());

describe('Last follow-up', () => {
  it('says how long ago in the terms somebody thinks in', () => {
    render(<LastFollowUp at={at(0)} note="Connected — wants evening batches" />);
    expect(screen.getByText('today')).toBeInTheDocument();
    expect(screen.getByText('Connected — wants evening batches')).toBeInTheDocument();
  });

  it.each([
    [1, 'yesterday'],
    [3, '3d ago'],
    [5, '5d ago'],
  ])('%i days ago reads as "%s"', (days, expected) => {
    render(<LastFollowUp at={at(days)} />);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it('falls back to a date once "days ago" stops being useful', () => {
    // Nobody counts in days past a week — "23d ago" is arithmetic, not information.
    render(<LastFollowUp at={at(23)} />);
    expect(screen.queryByText(/d ago/)).not.toBeInTheDocument();
  });

  it('says "never contacted" rather than leaving an empty cell', () => {
    // An empty cell reads as missing data. This is a fact about the student, and on an active
    // lead it is the most important one on the row.
    render(<LastFollowUp />);
    expect(screen.getByText('Never contacted')).toBeInTheDocument();
  });

  it('marks a lead nobody has reached in a week', () => {
    const { container } = render(<LastFollowUp at={at(9)} note="No answer (DNP)" />);
    expect(container.querySelector('.text-amber-700')).not.toBeNull();
  });

  it('does not mark one contacted within the week', () => {
    const { container } = render(<LastFollowUp at={at(2)} note="Connected" />);
    expect(container.querySelector('.text-amber-700')).toBeNull();
  });

  it('keeps the full note reachable when the row truncates it', () => {
    const note = 'Fees too high — father wants to see placement records before deciding anything';
    render(<LastFollowUp at={at(1)} note={note} />);
    expect(screen.getByTitle(note)).toBeInTheDocument();
  });
});
