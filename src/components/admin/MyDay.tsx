import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock, AlertTriangle, CalendarCheck, CircleAlert, Loader2, RefreshCw,
  ChevronRight, Inbox, CheckCircle2, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../lib/toast';
import { leadService, userService, errorMessage } from '../../services/api';
import { can } from '../../lib/permissions';
import LeadDrawer from './LeadDrawer';
import {
  MyDayDTO, LeadDTO, LeadOptionsDTO, StaffUserDTO, UserResponseDTO, GradeName
} from '../../dtos';

/**
 * The counsellor's home screen.
 *
 * This replaces the stats dashboard as the landing page, because a counsellor opening the CRM
 * needs to know what to do next, not how many leads exist. The four queues are the SOP's daily
 * checklist in the order it asks for them: answer the new enquiries, clear what is overdue,
 * work today's list, and make sure nothing active has been left without a next step.
 */

const GRADE_DOT: Record<GradeName, string> = {
  HOT: 'bg-red-500',
  WARM: 'bg-amber-500',
  COLD: 'bg-sky-500',
};

const minutesSince = (iso?: string): number | null => {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (isNaN(then)) return null;
  return Math.floor((Date.now() - then) / 60000);
};

const formatWait = (mins: number) => {
  if (mins < 60) return `${mins} min`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return `${Math.floor(mins / 1440)}d`;
};


const TONES = {
  red: 'text-red-600 bg-red-50',
  amber: 'text-amber-600 bg-amber-50',
  emerald: 'text-emerald-600 bg-emerald-50',
  gray: 'text-gray-500 bg-gray-100',
} as const;

/**
 * Defined at module level rather than inside MyDay on purpose: a component declared inside
 * another is a new type on every render, so React discards the DOM and rebuilds it instead of
 * updating in place. With a clock ticking every thirty seconds that showed up as a visible
 * flicker across the whole screen.
 */
const Row: React.FC<{ lead: LeadDTO; right?: React.ReactNode; onOpen: (id: string) => void }> =
  React.memo(({ lead, right, onOpen }) => (
  <button
    onClick={() => onOpen(lead.id)}
    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-b-0"
  >
    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${lead.grade ? GRADE_DOT[lead.grade] : 'bg-gray-300'}`}
      aria-hidden="true" />
    <div className="min-w-0 flex-1">
      <p className="font-bold text-sm text-gray-900 truncate">{lead.fullName}</p>
      <p className="text-xs text-gray-500 truncate">
        {[lead.courseInterested, lead.cityName].filter(Boolean).join(' · ')}
        {lead.nextTouchNote ? ` — ${lead.nextTouchNote}` : ''}
      </p>
      {/* What came of the last attempt. Without it the list says who is due today and nothing
          about who has already been rung four times without an answer. */}
      {(lead.lastTouchAt || lead.lastTouchNote) && (
        <p className="text-[11px] text-gray-400 truncate mt-0.5">
          Last: {lead.lastTouchNote || 'contacted'}
        </p>
      )}
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      {right}
      <ChevronRight size={16} className="text-gray-300" />
    </div>
  </button>
));
Row.displayName = 'Row';

const Queue: React.FC<{
  title: string; hint: string; leads: LeadDTO[]; icon: React.ElementType;
  tone: keyof typeof TONES;
  onOpen: (id: string) => void;
  children: (lead: LeadDTO) => React.ReactNode;
}> = ({ title, hint, leads, icon: Icon, tone, onOpen, children }) => (
  <section className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
    <header className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
      <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${TONES[tone]}`}>
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <h3 className="font-bold text-sm text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500">{hint}</p>
      </div>
      <span className="ml-auto text-sm font-bold text-gray-400 tabular-nums">{leads.length}</span>
    </header>
    {leads.length === 0 ? (
      <p className="px-5 py-8 text-center text-sm text-gray-400">Nothing here. Good.</p>
    ) : (
      <div>{leads.map(l => <Row key={l.id} lead={l} right={children(l)} onOpen={onOpen} />)}</div>
    )}
  </section>
);

interface Props {
  currentUser?: UserResponseDTO | null;
}

const MyDay: React.FC<Props> = ({ currentUser }) => {
  const toast = useToast();
  const [data, setData] = useState<MyDayDTO | null>(null);
  const [loading, setLoading] = useState(true);
  // Only a failure to LOAD lives here. A banner is right for that: it explains an empty
  // screen and stays put while the person decides what to do. Everything a person
  // actively did — saved, sent, deleted — is reported by a toast instead.
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);
  const [options, setOptions] = useState<LeadOptionsDTO | null>(null);
  const [staff, setStaff] = useState<StaffUserDTO[]>([]);
  const [running, setRunning] = useState(false);
  const [, forceTick] = useState(0);

  const canRunLadder = can(currentUser, 'LEAD_ASSIGN');

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setData(await leadService.myDay());
    } catch (err) {
      setLoadError(errorMessage(err, 'Could not load your day. Check your connection and try again.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    leadService.options().then(setOptions).catch(() => { /* the drawer degrades gracefully */ });
    if (can(currentUser, 'USER_VIEW')) {
      userService.getAssignable().then(setStaff).catch(() => { /* assignment stays hidden */ });
    }
  }, [currentUser]);

  // The five-minute rule is a live clock, so the waiting times have to tick.
  useEffect(() => {
    const id = window.setInterval(() => forceTick(t => t + 1), 60000);
    return () => window.clearInterval(id);
  }, []);

  const runLadder = async () => {
    setRunning(true);
    try {
      await leadService.runLadder();
      await load();
      toast.success('Follow-up pass complete. Anything newly due is in your list.');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not run the follow-up pass.'));
    } finally {
      setRunning(false);
    }
  };

  const onLeadUpdated = useCallback(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white rounded-[28px] animate-pulse" />)}
      </div>
    );
  }

  const awaiting = data?.awaitingFirstReply ?? [];
  const overdue = data?.overdue ?? [];
  const due = data?.dueToday ?? [];
  const blank = data?.blankNextTouch ?? [];
  const allClear = awaiting.length + overdue.length + due.length + blank.length === 0;

  return (
    <div className="space-y-5">
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

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <div className="flex gap-2">
          <button onClick={load}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-50 transition-colors">
            <RefreshCw size={16} /> Refresh
          </button>
          {canRunLadder && (
            <button onClick={runLadder} disabled={running}
              title="Runs the daily follow-up pass now instead of waiting for the morning"
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-50 transition-colors disabled:opacity-50">
              {running ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
              Run follow-ups
            </button>
          )}
        </div>
      </div>

      {allClear ? (
        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-12 text-center">
          <CheckCircle2 size={44} className="mx-auto text-emerald-400 mb-4" />
          <h3 className="font-bold text-lg text-gray-900">Your list is clear</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            No enquiries waiting, nothing overdue, and every active lead has a next step booked.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 items-start">
          <div className="space-y-4">
            <Queue
              title="Reply within five minutes"
              hint="New enquiries nobody has answered yet"
              leads={awaiting} icon={Clock} tone="red" onOpen={setOpenLeadId}
            >
              {(lead) => {
                const waited = minutesSince(lead.createdAt);
                const late = waited != null && waited > 5;
                return (
                  <span className={`text-xs font-bold tabular-nums px-2 py-1 rounded-lg ${
                    late ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {waited == null ? '—' : `${formatWait(waited)} waiting`}
                  </span>
                );
              }}
            </Queue>

            <Queue
              title="Overdue"
              hint="Should already have happened"
              leads={overdue} icon={AlertTriangle} tone="amber" onOpen={setOpenLeadId}
            >
              {(lead) => (
                <span className="text-xs font-bold text-red-600 tabular-nums">
                  {lead.daysOverdue}d late
                </span>
              )}
            </Queue>
          </div>

          <div className="space-y-4">
            <Queue
              title="Due today"
              hint="Morning, after lunch, and before closing"
              leads={due} icon={CalendarCheck} tone="emerald" onOpen={setOpenLeadId}
            >
              {(lead) => (
                <span className="text-xs font-medium text-gray-400">
                  {lead.ladderStep && lead.ladderTotal ? `Step ${lead.ladderStep}/${lead.ladderTotal}` : 'Today'}
                </span>
              )}
            </Queue>

            <Queue
              title="No next step booked"
              hint="A blank next touch is how leads die"
              leads={blank} icon={CircleAlert} tone="gray" onOpen={setOpenLeadId}
            >
              {() => (
                <span className="text-xs font-bold text-red-500">Set a date</span>
              )}
            </Queue>
          </div>
        </div>
      )}

      {!allClear && blank.length === 0 && (
        <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1.5">
          <Inbox size={13} /> Every active lead has a next step booked.
        </p>
      )}

      <LeadDrawer
        leadId={openLeadId}
        currentUser={currentUser}
        options={options}
        staff={staff}
        onClose={() => setOpenLeadId(null)}
        onUpdated={onLeadUpdated}
      />
    </div>
  );
};

export default MyDay;
