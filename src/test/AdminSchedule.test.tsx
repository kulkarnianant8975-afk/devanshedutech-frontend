import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminSchedule from '../components/admin/AdminSchedule';
import { scheduleService, userService } from '../services/api';
import type { WorkingHoursDTO, UserResponseDTO, StaffUserDTO } from '../dtos';

vi.mock('../services/api', () => ({
  scheduleService: {
    getHours: vi.fn(), setHours: vi.fn(), getHolidays: vi.fn(), addHoliday: vi.fn(),
    removeHoliday: vi.fn(), getRoster: vi.fn(), addShift: vi.fn(), removeShift: vi.fn(),
    onDutyNow: vi.fn(),
  },
  userService: { getTeam: vi.fn() },
  errorMessage: (e: unknown, fallback: string) => fallback,
}));

const admin: UserResponseDTO = {
  id: 'u1', email: 'a@x.com', displayName: 'Admin', photoURL: '',
  role: 'ADMIN', permissions: ['LEAD_VIEW_ALL', 'LEAD_ASSIGN', 'SETTINGS_MANAGE'],
};

const counsellorStaff: StaffUserDTO = {
  id: 'u2', email: 'p@x.com', displayName: 'Priya',
  role: 'SALES_EXECUTIVE', roleLabel: 'Counsellor', active: true, roleLockedByConfig: false,
};

const counsellor: UserResponseDTO = {
  id: 'u2', email: 'p@x.com', displayName: 'Priya', photoURL: '',
  role: 'SALES_EXECUTIVE', permissions: ['LEAD_VIEW_OWN'],
};

const week = (): WorkingHoursDTO[] =>
  ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map(day => ({
    day, opensAt: '10:00:00', closesAt: '19:00:00', closed: day === 'SUNDAY',
  }));

describe('Hours & Duty', () => {
  beforeEach(() => {
    vi.mocked(scheduleService.getHours).mockResolvedValue(week());
    vi.mocked(scheduleService.getHolidays).mockResolvedValue([]);
    vi.mocked(scheduleService.getRoster).mockResolvedValue([]);
    vi.mocked(scheduleService.onDutyNow).mockResolvedValue({});
    vi.mocked(userService.getTeam).mockResolvedValue({ users: [], roles: [] });
  });

  it('says plainly when nobody is watching enquiries', async () => {
    render(<AdminSchedule currentUser={admin} />);
    await waitFor(() => expect(screen.getByText(/Nobody is on duty right now/i)).toBeInTheDocument());
    expect(screen.getByText(/will sit unassigned until someone picks it up/i)).toBeInTheDocument();
  });

  it('names who would pick up an enquiry arriving now', async () => {
    vi.mocked(scheduleService.onDutyNow).mockResolvedValue({ userId: 'u2', name: 'Priya' });
    render(<AdminSchedule currentUser={admin} />);
    await waitFor(() => expect(screen.getByText(/Priya is on duty right now/i)).toBeInTheDocument());
  });

  it('warns about open days with no cover, and does not count closed days as gaps', async () => {
    vi.mocked(scheduleService.getRoster).mockResolvedValue([
      { id: 's1', userId: 'u2', day: 'MONDAY', startsAt: '10:00:00', endsAt: '14:00:00' },
    ]);
    vi.mocked(userService.getTeam).mockResolvedValue({ users: [counsellorStaff], roles: [] });
    render(<AdminSchedule currentUser={admin} />);

    const warning = await screen.findByText(/No cover on/i);
    // Monday is covered, so it must not appear; Sunday is shut, so it is not a gap either.
    expect(warning.textContent).toContain('Tuesday');
    expect(warning.textContent).not.toContain('Monday');
    expect(warning.textContent).not.toContain('Sunday');
  });

  it('lets a counsellor read the schedule without offering edit controls', async () => {
    // The server refuses these writes regardless; showing controls that always fail is just a
    // way of teaching people the product is broken.
    render(<AdminSchedule currentUser={counsellor} />);
    await waitFor(() => expect(screen.getByText(/Opening hours/i)).toBeInTheDocument());

    expect(screen.queryByRole('button', { name: /Save hours/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add closure/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add shift/i })).not.toBeInTheDocument();
  });

  it('offers the edit controls to someone who may use them', async () => {
    render(<AdminSchedule currentUser={admin} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /Save hours/i })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Add shift/i })).toBeInTheDocument();
  });
});
