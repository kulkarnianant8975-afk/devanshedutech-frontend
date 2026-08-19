import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock, CalendarOff, UserCheck, Plus, Trash2, Loader2, AlertCircle,
  CheckCircle2, Save, Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { scheduleService, userService, errorMessage } from '../../services/api';
import { can } from '../../lib/permissions';
import { WorkingHoursDTO, HolidayDTO, DutyShiftDTO, UserResponseDTO, StaffUserDTO } from '../../dtos';

/**
 * Opening hours, closures, and who is watching enquiries.
 *
 * Two numbers depend on what is set here. The response-time metric counts only the minutes the
 * institute is open, so an enquiry arriving at 11pm and answered at 9:30 the next morning reads
 * as a thirty-minute wait rather than a ten-hour failure. And a follow-up that the SOP's day
 * count lands on a closed day is moved to the next working day, instead of becoming an overdue
 * row for a call nobody could have made.
 */

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const dayLabel = (day: string) => day.charAt(0) + day.slice(1).toLowerCase();

/** The server sends 'HH:mm:ss'; a time input wants 'HH:mm'. */
const toInput = (time?: string) => (time ?? '').slice(0, 5);

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso
    : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

const isPast = (iso: string) => {
  const d = new Date(iso);
  return !isNaN(d.getTime()) && d < new Date(new Date().toDateString());
};

interface Props { currentUser?: UserResponseDTO | null; }

const AdminSchedule: React.FC<Props> = ({ currentUser }) => {
  const [hours, setHours] = useState<WorkingHoursDTO[]>([]);
  const [holidays, setHolidays] = useState<HolidayDTO[]>([]);
  const [roster, setRoster] = useState<DutyShiftDTO[]>([]);
  const [staff, setStaff] = useState<StaffUserDTO[]>([]);
  const [onDuty, setOnDuty] = useState<{ userId?: string; name?: string }>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newHoliday, setNewHoliday] = useState({ day: '', name: '' });
  const [newShift, setNewShift] = useState({ userId: '', day: 'MONDAY', startsAt: '10:00', endsAt: '14:00' });

  const mayEditHours = can(currentUser, 'SETTINGS_MANAGE');
  const mayEditRoster = can(currentUser, 'LEAD_ASSIGN');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [h, hol, r, duty] = await Promise.all([
        scheduleService.getHours(),
        scheduleService.getHolidays(),
        scheduleService.getRoster(),
        scheduleService.onDutyNow(),
      ]);
      setHours(h);
      setHolidays(hol);
      setRoster(r);
      setOnDuty(duty);
      // Only people who can change the roster need the staff list to choose from.
      if (mayEditRoster) {
        try { setStaff((await userService.getTeam()).users); } catch { /* the roster still reads fine */ }
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [mayEditRoster]);

  useEffect(() => { load(); }, [load]);

  const flash = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const editDay = (day: string, patch: Partial<WorkingHoursDTO>) =>
    setHours(prev => prev.map(h => (h.day === day ? { ...h, ...patch } : h)));

  const saveHours = async () => {
    setSaving(true);
    setError(null);
    try {
      setHours(await scheduleService.setHours(hours.map(h => ({
        ...h, opensAt: toInput(h.opensAt), closesAt: toInput(h.closesAt),
      }))));
      flash('Opening hours saved.');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const addHoliday = async () => {
    if (!newHoliday.day) { setError('Pick the date the institute is closed.'); return; }
    setError(null);
    try {
      await scheduleService.addHoliday(newHoliday.day, newHoliday.name);
      setNewHoliday({ day: '', name: '' });
      setHolidays(await scheduleService.getHolidays());
      flash('Closure added. Follow-ups will move off that day.');
    } catch (e) { setError(errorMessage(e)); }
  };

  const removeHoliday = async (day: string) => {
    try {
      await scheduleService.removeHoliday(day);
      setHolidays(prev => prev.filter(h => h.day !== day));
    } catch (e) { setError(errorMessage(e)); }
  };

  const addShift = async () => {
    if (!newShift.userId) { setError('Choose who is on duty for this shift.'); return; }
    setError(null);
    try {
      await scheduleService.addShift(newShift);
      setRoster(await scheduleService.getRoster());
      setOnDuty(await scheduleService.onDutyNow());
      flash('Shift added.');
    } catch (e) { setError(errorMessage(e)); }
  };

  const removeShift = async (id: string) => {
    try {
      await scheduleService.removeShift(id);
      setRoster(prev => prev.filter(s => s.id !== id));
      setOnDuty(await scheduleService.onDutyNow());
    } catch (e) { setError(errorMessage(e)); }
  };

  const nameOf = (userId: string) => {
    const person = staff.find(s => s.id === userId);
    return person?.displayName || person?.email || 'Someone no longer on the team';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading the schedule…
      </div>
    );
  }

  const uncovered = DAYS.filter(day => {
    const open = hours.find(h => h.day === day);
    return open && !open.closed && !roster.some(s => s.day === day);
  });

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{error}</span>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" /> <span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Who would pick up an enquiry arriving this second. */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-3">
        <Radio className={`w-5 h-5 ${onDuty.userId ? 'text-emerald-500' : 'text-gray-300'}`} />
        <div>
          <p className="text-sm font-medium text-gray-900">
            {onDuty.userId
              ? `${onDuty.name} is on duty right now`
              : 'Nobody is on duty right now'}
          </p>
          <p className="text-xs text-gray-500">
            {onDuty.userId
              ? 'An enquiry arriving this minute lands in their day automatically.'
              : 'An enquiry arriving this minute will sit unassigned until someone picks it up.'}
          </p>
        </div>
      </div>

      {/* ---------------- opening hours ---------------- */}
      <section className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <header className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Opening hours</h3>
        </header>
        <div className="p-4 space-y-2">
          <p className="text-xs text-gray-500 mb-3">
            Response times are measured against these hours, so a message that arrives overnight
            is not counted against whoever answers it in the morning.
          </p>
          {DAYS.map(day => {
            const row = hours.find(h => h.day === day);
            if (!row) return null;
            return (
              <div key={day} className="flex flex-wrap items-center gap-3 py-1.5">
                <span className="w-24 text-sm text-gray-700">{dayLabel(day)}</span>
                <label className="flex items-center gap-1.5 text-xs text-gray-500">
                  <input
                    type="checkbox"
                    checked={!row.closed}
                    disabled={!mayEditHours}
                    onChange={e => editDay(day, { closed: !e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  Open
                </label>
                <input
                  type="time"
                  value={toInput(row.opensAt)}
                  disabled={!mayEditHours || row.closed}
                  onChange={e => editDay(day, { opensAt: e.target.value })}
                  className="px-2 py-1 text-sm border border-gray-200 rounded disabled:bg-gray-50 disabled:text-gray-400"
                />
                <span className="text-gray-400 text-sm">to</span>
                <input
                  type="time"
                  value={toInput(row.closesAt)}
                  disabled={!mayEditHours || row.closed}
                  onChange={e => editDay(day, { closesAt: e.target.value })}
                  className="px-2 py-1 text-sm border border-gray-200 rounded disabled:bg-gray-50 disabled:text-gray-400"
                />
                {row.closed && <span className="text-xs text-gray-400">Closed all day</span>}
              </div>
            );
          })}
          {mayEditHours && (
            <button
              onClick={saveHours}
              disabled={saving}
              className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save hours
            </button>
          )}
        </div>
      </section>

      {/* ---------------- closures ---------------- */}
      <section className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <header className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <CalendarOff className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Festival and holiday closures</h3>
        </header>
        <div className="p-4">
          <p className="text-xs text-gray-500 mb-3">
            A follow-up that falls on one of these days moves to the next working day, so nothing
            shows as overdue for a call nobody could have made.
          </p>
          {holidays.length === 0 && (
            <p className="text-sm text-gray-400 mb-3">No closures listed.</p>
          )}
          <ul className="space-y-1.5 mb-4">
            {holidays.map(h => (
              <li key={h.day} className="flex items-center justify-between text-sm">
                <span className={isPast(h.day) ? 'text-gray-400' : 'text-gray-700'}>
                  <span className="font-medium">{formatDate(h.day)}</span>
                  <span className="text-gray-500"> — {h.name}</span>
                  {isPast(h.day) && <span className="text-xs text-gray-400"> (past)</span>}
                </span>
                {mayEditHours && (
                  <button
                    onClick={() => removeHoliday(h.day)}
                    className="p-1 text-gray-300 hover:text-red-500"
                    aria-label={`Remove ${h.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
          {mayEditHours && (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={newHoliday.day}
                onChange={e => setNewHoliday({ ...newHoliday, day: e.target.value })}
                className="px-2 py-1.5 text-sm border border-gray-200 rounded"
              />
              <input
                type="text"
                placeholder="Ganesh Chaturthi"
                value={newHoliday.name}
                onChange={e => setNewHoliday({ ...newHoliday, name: e.target.value })}
                className="px-2 py-1.5 text-sm border border-gray-200 rounded flex-1 min-w-[10rem]"
              />
              <button
                onClick={addHoliday}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <Plus className="w-4 h-4" /> Add closure
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ---------------- duty roster ---------------- */}
      <section className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <header className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Live enquiry duty</h3>
        </header>
        <div className="p-4">
          <p className="text-xs text-gray-500 mb-3">
            A new enquiry is given to whoever is on duty when it arrives. Without cover it waits
            for someone to notice it, and that wait is what loses students.
          </p>

          {uncovered.length > 0 && (
            <p className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              No cover on {uncovered.map(dayLabel).join(', ')}. Enquiries arriving then will be
              unassigned.
            </p>
          )}

          <div className="space-y-3 mb-4">
            {DAYS.filter(day => roster.some(s => s.day === day)).map(day => (
              <div key={day}>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                  {dayLabel(day)}
                </p>
                <ul className="space-y-1">
                  {roster.filter(s => s.day === day).map(shift => (
                    <li key={shift.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">
                        {toInput(shift.startsAt)}–{toInput(shift.endsAt)}
                        <span className="text-gray-500"> · {nameOf(shift.userId)}</span>
                      </span>
                      {mayEditRoster && (
                        <button
                          onClick={() => removeShift(shift.id)}
                          className="p-1 text-gray-300 hover:text-red-500"
                          aria-label="Remove shift"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {roster.length === 0 && (
              <p className="text-sm text-gray-400">Nobody is rostered yet.</p>
            )}
          </div>

          {mayEditRoster && (
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
              <select
                value={newShift.userId}
                onChange={e => setNewShift({ ...newShift, userId: e.target.value })}
                className="px-2 py-1.5 text-sm border border-gray-200 rounded"
              >
                <option value="">Who is on duty…</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>{s.displayName || s.email}</option>
                ))}
              </select>
              <select
                value={newShift.day}
                onChange={e => setNewShift({ ...newShift, day: e.target.value })}
                className="px-2 py-1.5 text-sm border border-gray-200 rounded"
              >
                {DAYS.map(d => <option key={d} value={d}>{dayLabel(d)}</option>)}
              </select>
              <input
                type="time"
                value={newShift.startsAt}
                onChange={e => setNewShift({ ...newShift, startsAt: e.target.value })}
                className="px-2 py-1.5 text-sm border border-gray-200 rounded"
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="time"
                value={newShift.endsAt}
                onChange={e => setNewShift({ ...newShift, endsAt: e.target.value })}
                className="px-2 py-1.5 text-sm border border-gray-200 rounded"
              />
              <button
                onClick={addShift}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <Plus className="w-4 h-4" /> Add shift
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminSchedule;
