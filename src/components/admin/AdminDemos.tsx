import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle, CheckCircle2, XCircle, ChevronLeft,
  ChevronRight, Clock, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../lib/toast';
import { demoService, errorMessage } from '../../services/api';
import { can } from '../../lib/permissions';
import LeadDrawer from './LeadDrawer';
import { DemoBoardDTO, DemoDTO, LeadOptionsDTO, StaffUserDTO, UserResponseDTO } from '../../dtos';
import SectionIntro from './SectionIntro';
import { leadService, userService } from '../../services/api';

/**
 * The demo calendar.
 *
 * Attendance is three-state on purpose. A demo that has not happened yet is not a no-show, and
 * collapsing the two would report every future booking as a failure — so unmarked past demos get
 * their own list at the top, because those are exactly the ones that quietly rot and take the
 * conversion figures down with them.
 */

const startOfWeek = (d: Date) => {
  const copy = new Date(d);
  const day = (copy.getDay() + 6) % 7;      // Monday-based
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const iso = (d: Date) => d.toISOString().split('T')[0];
const dayLabel = (d: Date) => d.toLocaleDateString('en-IN', { weekday: 'short' });
const dateLabel = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const timeLabel = (s: string) => new Date(s).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/** At module level: declared inside the parent it would be a new type on every render, so the
 *  calendar rebuilt itself rather than updating, and the cards flickered. */
const DemoCard: React.FC<{
  demo: DemoDTO;
  showDate?: boolean;
  canEdit: boolean;
  busyId: string | null;
  onOpenLead: (leadId: string) => void;
  onMark: (demo: DemoDTO, attended: boolean) => void;
}> = ({ demo, showDate, canEdit, busyId, onOpenLead, onMark }) => {
  const tone = demo.attended === true ? 'border-emerald-500 bg-emerald-50'
    : demo.attended === false ? 'border-red-400 bg-red-50'
    : demo.awaitingMarking ? 'border-amber-400 bg-amber-50'
    : 'border-sky-400 bg-sky-50';
  return (
    <div className={`rounded-xl border-l-[3px] ${tone} p-2.5`}>
      <button onClick={() => onOpenLead(demo.leadId)} className="text-left w-full">
        <p className="text-[10px] font-bold text-gray-500 tabular-nums">
          {showDate ? `${dateLabel(new Date(demo.scheduledAt))} · ` : ''}{timeLabel(demo.scheduledAt)}
        </p>
        <p className="text-[13px] font-bold text-gray-900 leading-tight mt-0.5">{demo.studentName}</p>
        <p className="text-[11px] text-gray-500 truncate">{demo.course || demo.mode}</p>
      </button>

      {demo.attended === true && (
        <p className="text-[10px] font-bold text-emerald-700 mt-1.5 flex items-center gap-1">
          <CheckCircle2 size={11} /> Attended
        </p>
      )}
      {demo.attended === false && (
        <p className="text-[10px] font-bold text-red-600 mt-1.5 flex items-center gap-1">
          <XCircle size={11} /> No-show
        </p>
      )}
      {demo.attended === null && canEdit && (
        <div className="flex gap-1.5 mt-2">
          <button onClick={() => onMark(demo, true)} disabled={busyId === demo.id}
            className="flex-1 text-[10px] font-bold py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            {busyId === demo.id ? '…' : 'Attended'}
          </button>
          <button onClick={() => onMark(demo, false)} disabled={busyId === demo.id}
            className="flex-1 text-[10px] font-bold py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors">
            No-show
          </button>
        </div>
      )}
    </div>
  );
};

interface Props { currentUser?: UserResponseDTO | null; }

const AdminDemos: React.FC<Props> = ({ currentUser }) => {
  const toast = useToast();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [board, setBoard] = useState<DemoBoardDTO | null>(null);
  const [loading, setLoading] = useState(true);
  // Only a failure to LOAD lives here. A banner is right for that: it explains an empty
  // screen and stays put while the person decides what to do. Everything a person
  // actively did — saved, sent, deleted — is reported by a toast instead.
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);
  const [options, setOptions] = useState<LeadOptionsDTO | null>(null);
  const [staff, setStaff] = useState<StaffUserDTO[]>([]);

  const canEdit = can(currentUser, 'LEAD_EDIT');
  const load = useCallback(async () => {
    setLoadError(null);
    const end = new Date(weekStart); end.setDate(end.getDate() + 6);
    try {
      setBoard(await demoService.board(iso(weekStart), iso(end)));
    } catch (err) {
      setLoadError(errorMessage(err, 'Could not load the demo calendar.'));
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => { load(); }, [load]);

  // Stable, so the drawer's effect does not re-run on every render of this screen.
  const handleUpdated = useCallback(() => { load(); }, [load]);
  useEffect(() => {
    leadService.options().then(setOptions).catch(() => {});
    if (can(currentUser, 'USER_VIEW')) userService.getAssignable().then(setStaff).catch(() => {});
  }, [currentUser]);

  const mark = async (demo: DemoDTO, attended: boolean) => {
    setBusyId(demo.id);
    try {
      await demoService.mark(demo.id, attended);
      toast.success(attended
        ? `${demo.studentName} attended — day 1 and day 3 follow-ups booked.`
        : `${demo.studentName} marked as a no-show. A recovery touch is booked for today.`);
      load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not record that.'));
    } finally {
      setBusyId(null);
    }
  };

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i); return d;
  });
  const today = new Date();

  if (loading && !board) {
    return <div className="grid grid-cols-7 gap-2">{[...Array(7)].map((_, i) =>
      <div key={i} className="h-56 bg-white rounded-2xl animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <SectionIntro
        screen="AdminDemos"
        purpose="Demo classes and campus visits, a week at a time."
        steps={[
          "Demos are booked from inside a student's record, not from here.",
          "Mark attendance the same day — the CRM books the follow-ups that come after.",
          "A no-show books a recovery call for today rather than letting the student drift.",
        ]}
      />

      <AnimatePresence>
        {loadError && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            role="alert" className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium flex-1">{loadError}</p>
            <button onClick={load} className="text-sm font-semibold underline shrink-0">Retry</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unmarked past demos come first: nothing else on this screen matters if these rot. */}
      {board && board.awaitingMarking.length > 0 && (
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
            <AlertTriangle size={16} />
            {board.awaitingMarking.length} demo{board.awaitingMarking.length === 1 ? '' : 's'} still unmarked
          </h3>
          <p className="text-xs text-amber-800 mt-1 mb-3">
            These have already happened. Until somebody says whether the student turned up, the
            follow-ups are not booked and the conversion figures are wrong.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {board.awaitingMarking.map(d => <DemoCard key={d.id} demo={d} showDate canEdit={canEdit} busyId={busyId} onOpenLead={setOpenLeadId} onMark={mark} />)}
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); }}
          aria-label="Previous week"
          className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
          <ChevronLeft size={18} />
        </button>
        <button onClick={() => setWeekStart(startOfWeek(new Date()))}
          className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-bold hover:bg-gray-50 transition-colors">
          This week
        </button>
        <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); }}
          aria-label="Next week"
          className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
          <ChevronRight size={18} />
        </button>

        <div className="ml-auto flex items-center gap-4 text-sm">
          <span className="text-gray-500">
            <strong className="text-gray-900 tabular-nums">{board?.scheduled ?? 0}</strong> booked
          </span>
          <span className="text-gray-500">
            <strong className="text-emerald-700 tabular-nums">{board?.attended ?? 0}</strong> attended
          </span>
          <span className="text-gray-500">
            attendance{' '}
            <strong className="text-gray-900 tabular-nums">
              {board?.attendanceRate == null ? '—' : `${board.attendanceRate}%`}
            </strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {days.map(day => {
          const forDay = (board?.demos ?? []).filter(d => isSameDay(new Date(d.scheduledAt), day));
          const isToday = isSameDay(day, today);
          return (
            <div key={day.toISOString()} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <header className={`px-3 py-2 border-b border-gray-100 ${isToday ? 'bg-orange-50' : 'bg-gray-50/60'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-primary' : 'text-gray-400'}`}>
                  {dayLabel(day)}{isToday ? ' · today' : ''}
                </p>
                <p className={`text-sm font-bold ${isToday ? 'text-primary' : 'text-gray-900'}`}>
                  {dateLabel(day)}
                </p>
              </header>
              <div className="p-2 space-y-2 min-h-[110px]">
                {forDay.length === 0
                  ? <p className="text-[11px] text-gray-300 text-center py-6">—</p>
                  : forDay.map(d => <DemoCard key={d.id} demo={d} canEdit={canEdit} busyId={busyId} onOpenLead={setOpenLeadId} onMark={mark} />)}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 flex items-center gap-1.5">
        <Clock size={13} /> Book a demo from any lead&apos;s screen. Marking attendance schedules the
        day 1 and day 3 follow-ups automatically.
      </p>

      <LeadDrawer leadId={openLeadId} currentUser={currentUser} options={options} staff={staff}
        onClose={() => setOpenLeadId(null)} onUpdated={handleUpdated} />
    </div>
  );
};

export default AdminDemos;
