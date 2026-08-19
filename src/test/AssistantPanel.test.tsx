import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AssistantPanel from '../components/admin/AssistantPanel';
import { assistantService } from '../services/api';

vi.mock('../services/api', () => ({
  assistantService: {
    available: vi.fn(), suggestGrade: vi.fn(), summarise: vi.fn(), draft: vi.fn(),
  },
  errorMessage: (e: unknown, fallback: string) => fallback,
}));

const panel = (props: Partial<React.ComponentProps<typeof AssistantPanel>> = {}) =>
  render(
    <AssistantPanel
      leadId="l1" canEdit
      onApplyGrade={props.onApplyGrade ?? (() => {})}
      onUseDraft={props.onUseDraft ?? (() => {})}
      {...props}
    />
  );

describe('Assistant', () => {
  beforeEach(() => {
    vi.mocked(assistantService.available).mockResolvedValue(true);
  });

  it('is absent entirely when no model is configured', async () => {
    // Present-and-always-failing is worse than absent: it teaches people the product is broken.
    vi.mocked(assistantService.available).mockResolvedValue(false);
    panel();
    await waitFor(() => expect(assistantService.available).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: /brief me/i })).not.toBeInTheDocument();
  });

  it('suggests a grade without applying it', async () => {
    // The grade drives the whole follow-up ladder. A student regraded by a misreading would be
    // contacted more or less often for reasons nobody could reconstruct, so a person decides.
    const onApplyGrade = vi.fn();
    vi.mocked(assistantService.suggestGrade).mockResolvedValue({
      grade: 'HOT', reasoning: 'Asked about the fee and the next batch.', applied: false,
    });

    const user = userEvent.setup();
    panel({ onApplyGrade });
    await user.click(await screen.findByRole('button', { name: /suggest a grade/i }));

    expect(await screen.findByText(/Asked about the fee/i)).toBeInTheDocument();
    expect(onApplyGrade).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /use hot/i }));
    expect(onApplyGrade).toHaveBeenCalledWith('HOT');
  });

  it('offers no apply button when the model did not name a grade we use', async () => {
    vi.mocked(assistantService.suggestGrade).mockResolvedValue({
      reasoning: 'Hard to say from this history.', applied: false,
    });

    const user = userEvent.setup();
    panel();
    await user.click(await screen.findByRole('button', { name: /suggest a grade/i }));

    expect(await screen.findByText(/No clear grade/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^use /i })).not.toBeInTheDocument();
  });

  it('says what to do when the assistant cannot answer', async () => {
    vi.mocked(assistantService.summarise).mockRejectedValue(new Error('503'));

    const user = userEvent.setup();
    panel();
    await user.click(await screen.findByRole('button', { name: /brief me/i }));

    expect(await screen.findByText(/Write it yourself for now/i)).toBeInTheDocument();
  });

  it('hands a draft to the counsellor rather than sending it', async () => {
    const onUseDraft = vi.fn();
    vi.mocked(assistantService.draft).mockResolvedValue('Hi Omkar — is Saturday 11am alright? — Priya');

    const user = userEvent.setup();
    panel({ onUseDraft });
    // The panel renders nothing until it knows a model is configured, so wait for it to appear.
    const drafting = await screen.findByRole('button', { name: /draft a message/i });
    await user.type(screen.getByLabelText(/what should the message do/i), 'confirm the demo');
    await user.click(drafting);

    expect(await screen.findByText(/is Saturday 11am alright/i)).toBeInTheDocument();
    expect(screen.getByText(/Read it before you send it/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /put it in the note/i }));
    expect(onUseDraft).toHaveBeenCalledWith('Hi Omkar — is Saturday 11am alright? — Priya');
  });

  it('offers only the read-only action to someone who cannot edit the lead', async () => {
    panel({ canEdit: false });
    expect(await screen.findByRole('button', { name: /brief me/i })).toBeInTheDocument();
    // Waited for above, so the absence checks below are about permission, not about timing.
    expect(screen.queryByRole('button', { name: /suggest a grade/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /draft a message/i })).not.toBeInTheDocument();
  });
});
