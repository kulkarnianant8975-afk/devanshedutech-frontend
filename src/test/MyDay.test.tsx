import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MyDay from '../components/admin/MyDay';
import { leadService, userService } from '../services/api';
import type { LeadDTO, MyDayDTO, UserResponseDTO } from '../dtos';

vi.mock('../services/api', () => ({
  leadService: { myDay: vi.fn(), options: vi.fn(), runLadder: vi.fn(), detail: vi.fn() },
  userService: { getAssignable: vi.fn() },
  errorMessage: (e: unknown, fallback: string) => fallback,
}));

const manager: UserResponseDTO = {
  id: 'u1', email: 'm@x.com', displayName: 'Manager', photoURL: '',
  role: 'MANAGER', permissions: ['LEAD_VIEW_ALL', 'LEAD_EDIT', 'LEAD_ASSIGN', 'USER_VIEW'],
};

const lead = (over: Partial<LeadDTO> = {}): LeadDTO => ({
  id: 'l1', fullName: 'Rohit Deshmukh', mobileNumber: '+91 98765 43210',
  status: 'New', createdAt: new Date().toISOString(), blankNextTouch: false,
  courseInterested: 'Data Analytics', cityName: 'Parbhani', ...over,
});

const board = (over: Partial<MyDayDTO> = {}): MyDayDTO => ({
  awaitingFirstReply: [], overdue: [], dueToday: [], blankNextTouch: [],
  awaitingCount: 0, overdueCount: 0, dueTodayCount: 0, blankNextTouchCount: 0, ...over,
});

describe('My Day', () => {
  beforeEach(() => {
    vi.mocked(leadService.options).mockResolvedValue({
      stages: [], grades: [], sources: [], backgrounds: [], outcomes: [], lostReasons: [],
    });
    vi.mocked(userService.getAssignable).mockResolvedValue([]);
  });

  it('says the list is clear rather than showing four empty boxes', async () => {
    vi.mocked(leadService.myDay).mockResolvedValue(board());
    render(<MyDay currentUser={manager} />);
    expect(await screen.findByText(/your list is clear/i)).toBeInTheDocument();
  });

  it('shows overdue leads with how late they are', async () => {
    vi.mocked(leadService.myDay).mockResolvedValue(board({
      overdue: [lead({ fullName: 'Sanika Pawar', daysOverdue: 3, nextTouchOn: '2026-08-16' })],
      overdueCount: 1,
    }));
    render(<MyDay currentUser={manager} />);
    expect(await screen.findByText('Sanika Pawar')).toBeInTheDocument();
    expect(screen.getByText(/3d late/)).toBeInTheDocument();
  });

  it('flags a lead with no next step, which is the rule the SOP cares most about', async () => {
    vi.mocked(leadService.myDay).mockResolvedValue(board({
      blankNextTouch: [lead({ fullName: 'Pooja Waghmare', blankNextTouch: true })],
      blankNextTouchCount: 1,
    }));
    render(<MyDay currentUser={manager} />);
    expect(await screen.findByText('Pooja Waghmare')).toBeInTheDocument();
    expect(screen.getByText(/set a date/i)).toBeInTheDocument();
  });

  it('shows an error the user can act on when the server is unreachable', async () => {
    vi.mocked(leadService.myDay).mockRejectedValue(new Error('network'));
    render(<MyDay currentUser={manager} />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load/i);
  });

  it('keeps the same DOM nodes across a re-render instead of rebuilding them', async () => {
    // This is the regression guard for the flicker. When sub-components were declared inside
    // MyDay, React saw a new component type each render and replaced the nodes entirely.
    vi.mocked(leadService.myDay).mockResolvedValue(board({
      dueToday: [lead({ fullName: 'Rohit Deshmukh', nextTouchOn: '2026-08-19' })],
      dueTodayCount: 1,
    }));
    const { rerender } = render(<MyDay currentUser={manager} />);
    const first = await screen.findByText('Rohit Deshmukh');

    rerender(<MyDay currentUser={{ ...manager }} />);
    await waitFor(() => expect(screen.getByText('Rohit Deshmukh')).toBe(first));
  });
});
