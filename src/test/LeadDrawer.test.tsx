import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LeadDrawer from '../components/admin/LeadDrawer';
import { leadService } from '../services/api';
import type { LeadDTO, LeadOptionsDTO, UserResponseDTO } from '../dtos';

vi.mock('../services/api', () => ({
  leadService: { detail: vi.fn(), patch: vi.fn(), recordOutcome: vi.fn(), optOut: vi.fn(),
                 pause: vi.fn(), resume: vi.fn(),
                 packs: vi.fn(), preparePack: vi.fn(), recordPackSent: vi.fn() },
  userService: { getAssignable: vi.fn() },
  demoService: { book: vi.fn() },
  errorMessage: (_e: unknown, fallback: string) => fallback,
}));

const counsellor: UserResponseDTO = {
  id: 'u1', email: 's@x.com', displayName: 'Sneha', photoURL: '',
  role: 'SALES_EXECUTIVE', permissions: ['LEAD_VIEW_OWN', 'LEAD_EDIT'],
};

const options: LeadOptionsDTO = {
  stages: [{ value: 'NEW', label: 'New' }, { value: 'CONTACTED', label: 'Contacted' }],
  grades: [{ value: 'HOT', label: 'Hot' }, { value: 'WARM', label: 'Warm' }, { value: 'COLD', label: 'Cold' }],
  sources: [], backgrounds: [],
  outcomes: [
    { value: 'CONNECTED', label: 'Connected', hint: 'Moves to Contacted. Next touch in 1 day(s).' },
    { value: 'NOT_INTERESTED', label: 'Not interested', hint: 'A note is required.' },
  ],
  lostReasons: [{ value: 'FEES', label: 'Fees — out of budget' }],
};

const lead: LeadDTO = {
  id: 'l1', fullName: 'Rohit Deshmukh', mobileNumber: '+91 98765 43210',
  status: 'New', createdAt: '2026-08-16T10:00:00', blankNextTouch: false,
  courseInterested: 'Data Analytics', cityName: 'Parbhani',
  stage: 'NEW', stageLabel: 'New', grade: 'WARM', gradeLabel: 'Warm',
  nextTouchOn: '2026-08-20', nextTouchNote: 'Call again in the evening',
};

const openDrawer = (over: Partial<LeadDTO> = {}) => {
  vi.mocked(leadService.detail).mockResolvedValue({
    lead: { ...lead, ...over }, activities: [], ladder: [],
  });
  return render(
    <LeadDrawer leadId="l1" currentUser={counsellor} options={options} staff={[]}
      onClose={() => {}} onUpdated={() => {}} />
  );
};

describe('Lead workspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // The drawer now offers message packs; without these the panel throws and the whole
    // drawer fails to settle.
    vi.mocked(leadService.packs).mockResolvedValue([
      { key: 'guidance', name: 'Post-call guidance pack', situation: 'SOP section 4' },
    ]);
    vi.mocked(leadService.preparePack).mockResolvedValue({
      packKey: 'guidance', packName: 'Post-call guidance pack', situation: 'SOP section 4',
      message: 'Great speaking with you, Rohit!',
      assets: [{ key: 'syllabus', name: 'Data Analytics — syllabus', type: 'PDF',
                 url: '/x.pdf', sizeLabel: 'PDF', tracked: true }],
      replyWindowMinutesLeft: 145, freeReplyOpen: true,
      whatsappUrl: 'https://wa.me/919876543210?text=hi', note: '1 attachment plus the message.',
    });
  });

  it('shows the student and their next touch', async () => {
    openDrawer();
    expect(await screen.findByText('Rohit Deshmukh')).toBeInTheDocument();
    expect(screen.getByText(/call again in the evening/i)).toBeInTheDocument();
  });

  it('warns loudly when an active lead has no next step', async () => {
    openDrawer({ nextTouchOn: undefined, nextTouchNote: undefined, blankNextTouch: true });
    expect(await screen.findByText(/not set — this lead is at risk/i)).toBeInTheDocument();
  });

  it('spells out what each outcome will do before it is chosen', async () => {
    openDrawer();
    expect(await screen.findByText('Connected')).toBeInTheDocument();
    expect(screen.getByText(/moves to contacted\. next touch in 1 day/i)).toBeInTheDocument();
  });

  it('will not submit "not interested" until a reason is given', async () => {
    const user = userEvent.setup();
    openDrawer();
    await user.click(await screen.findByText('Not interested'));

    const submit = screen.getByRole('button', { name: /record it/i });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText(/what was said/i), 'Chose another institute');
    expect(submit).toBeDisabled();          // still needs the lost reason

    await user.selectOptions(screen.getByLabelText(/why was it lost/i), 'FEES');
    expect(submit).toBeEnabled();
  });

  it('is read-only once a student has opted out', async () => {
    openDrawer({ optedOut: true });
    expect(await screen.findByText(/opted out/i)).toBeInTheDocument();
    expect(screen.queryByText(/record the contact/i)).not.toBeInTheDocument();
  });
});

describe('Send pack', () => {
  beforeEach(() => {
    vi.mocked(leadService.packs).mockResolvedValue([
      { key: 'guidance', name: 'Post-call guidance pack', situation: 'SOP section 4, step 5' },
      { key: 'dnp', name: 'Missed-call recovery', situation: 'SOP section 6.1' },
    ]);
  });

  const prepared = (over = {}) => ({
    packKey: 'guidance', packName: 'Post-call guidance pack', situation: 'SOP section 4, step 5',
    message: 'Great speaking with you, Rohit!',
    assets: [
      { key: 'syllabus', name: 'Data Analytics — syllabus', type: 'PDF', url: '/x.pdf', sizeLabel: 'PDF', tracked: true },
      { key: 'demo_link', name: 'Book your free demo', type: 'LINK', url: '/contact', sizeLabel: 'tracked', tracked: true },
    ],
    replyWindowMinutesLeft: 145, freeReplyOpen: true,
    whatsappUrl: 'https://wa.me/919876543210?text=hi',
    note: '2 attachments plus the message.', ...over,
  });

  it('shows how long the free reply window has left', async () => {
    vi.mocked(leadService.preparePack).mockResolvedValue(prepared());
    openDrawer();
    expect(await screen.findByText(/free reply open/i)).toBeInTheDocument();
    expect(screen.getByText(/2h 25m left/)).toBeInTheDocument();
  });

  it('explains the restriction rather than just refusing, once the window has closed', async () => {
    vi.mocked(leadService.preparePack).mockResolvedValue(prepared({
      freeReplyOpen: false, replyWindowMinutesLeft: null,
      note: 'This student has not messaged in over 24 hours, so WhatsApp only allows an approved template until they reply.',
    }));
    openDrawer();
    expect(await screen.findByText(/window closed · template only/i)).toBeInTheDocument();
    expect(screen.getByText(/24 hours/)).toBeInTheDocument();
  });

  it('lets the counsellor edit the message and drop an attachment', async () => {
    const user = userEvent.setup();
    vi.mocked(leadService.preparePack).mockResolvedValue(prepared());
    openDrawer();

    const box = await screen.findByLabelText(/message to rohit deshmukh/i);
    expect(box).toHaveValue('Great speaking with you, Rohit!');
    await user.clear(box);
    await user.type(box, 'My own wording');
    expect(box).toHaveValue('My own wording');

    // Both attachments are on by default; turning one off is a toggle, not a delete.
    const attachment = screen.getByRole('button', { name: /book your free demo/i });
    expect(attachment).toHaveAttribute('aria-pressed', 'true');
    await user.click(attachment);
    expect(attachment).toHaveAttribute('aria-pressed', 'false');
  });

  it('only records the send after the counsellor confirms they sent it', async () => {
    const user = userEvent.setup();
    vi.mocked(leadService.preparePack).mockResolvedValue(prepared());
    vi.mocked(leadService.recordPackSent).mockResolvedValue({} as never);
    vi.stubGlobal('open', vi.fn());
    openDrawer();

    await user.click(await screen.findByRole('button', { name: /open in whatsapp/i }));
    expect(leadService.recordPackSent).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /i sent it/i }));
    expect(leadService.recordPackSent).toHaveBeenCalledWith('l1', 'guidance', ['syllabus', 'demo_link']);
  });
});
