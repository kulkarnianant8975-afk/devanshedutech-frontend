import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import FollowUpFlow from '../components/admin/FollowUpFlow';
import { LeadActivityDTO } from '../dtos';

/**
 * What was said last time, and what was done about it.
 *
 * <p>Both were already on the timeline — mixed into ten kinds of event, so each was a find among
 * a dozen rows. Somebody mid-call does not read a dozen rows: they guess, or open with a
 * question the student already answered.</p>
 *
 * <p>When the next call is due belongs to the Next touch card above this, and is not repeated
 * here — two places showing the same date is two places to eventually disagree.</p>
 */

const activity = (over: Partial<LeadActivityDTO>): LeadActivityDTO => ({
  id: 'x', type: 'CALL', summary: 'Call — Connected', createdAt: '2026-08-22T12:08:00',
  ...over,
} as LeadActivityDTO);

describe('Follow-up flow', () => {
  it('shows what the student actually said', () => {
    render(<FollowUpFlow activities={[activity({
      id: 'a1', outcomeLabel: 'Connected', createdByName: 'Dipali Shinde',
      detail: 'Wants evening batches, parents deciding',
    })]} />);

    expect(screen.getByText(/Wants evening batches, parents deciding/)).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText(/Dipali Shinde/)).toBeInTheDocument();
  });

  it('shows contacts only, not the bookkeeping around them', () => {
    // This is the whole point. Grade and stage changes stay on the full timeline below.
    render(<FollowUpFlow activities={[
      activity({ id: 'a1', outcomeLabel: 'Connected' }),
      activity({ id: 'a2', type: 'GRADE_CHANGE', summary: 'Grade changed' }),
      activity({ id: 'a3', type: 'STAGE_CHANGE', summary: 'Stage changed' }),
      activity({ id: 'a4', type: 'CAPTURE', summary: 'Lead captured' }),
      activity({ id: 'a5', type: 'WHATSAPP', outcomeLabel: 'Sent the syllabus' }),
    ]} />);

    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('Sent the syllabus')).toBeInTheDocument();
    expect(screen.queryByText('Grade changed')).not.toBeInTheDocument();
    expect(screen.queryByText('Stage changed')).not.toBeInTheDocument();
    expect(screen.queryByText('Lead captured')).not.toBeInTheDocument();
  });

  it('marks the most recent contact, since that is the one being asked about', () => {
    render(<FollowUpFlow activities={[
      activity({ id: 'a1', outcomeLabel: 'Connected' }),
      activity({ id: 'a2', outcomeLabel: 'No answer (DNP)' }),
    ]} />);

    expect(screen.getByText('most recent')).toBeInTheDocument();
  });

  it('invites a first call rather than showing an empty box', () => {
    render(<FollowUpFlow activities={[]} />);
    expect(screen.getByText(/Nobody has spoken to this student yet/)).toBeInTheDocument();
  });
});
