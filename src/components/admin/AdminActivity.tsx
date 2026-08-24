import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PhoneCall, MessageCircle, Mail, CalendarDays, Loader2, AlertCircle, CalendarClock,
} from 'lucide-react';
import { leadService, userService, errorMessage } from '../../services/api';
import { can } from '../../lib/permissions';
import { dateInDays, LOCALE } from '../../lib/followUp';
import { ContactLogDTO, UserResponseDTO } from '../../dtos';
import LeadDrawer from './LeadDrawer';

/**
 * What was actually done, across every student.
 *
 * <p>The lead timeline answers "what happened to this student". Nothing answered "what did we do
 * this week", so a counsellor could not review their own day without opening leads one at a
 * time, and an owner could not tell whether somebody's leads were being worked at all until the
 * numbers moved — by which point the batch has started without them.</p>
 *
 * <p>Contacts only: calls, WhatsApp, email, demos. A feed that also carried grade changes and
 * system entries would answer "what happened in the CRM" when the question is "who did we speak
 * to".</p>
 */

const ICONS: Record<string, typeof PhoneCall> = {
  CALL: PhoneCall,
  WHATSAPP: MessageCircle,
  EMAIL: Mail,
  DEMO: CalendarDays,
};

const RANGES = [
  { label: 'Today', days: 0 },
  { label: 'Last 7 days', days: 6 },
  { label: 'Last 30 days', days: 29 },
];

const dayLabel = (iso: string): string => {
  const when = new Date(iso);
  const today = new Date();
  if (when.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (when.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return when.toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' });
};

const time = (iso: string): string =>
  new Date(iso).toLocaleTimeString(LOCALE, { hour: 'numeric', minute: '2-digit' });

interface Props { currentUser?: UserResponseDTO | null; }

const AdminActivity: React.FC<Props> = ({ currentUser }) => {
  const [log, setLog] = useState<ContactLogDTO[]>([]);
  const [staff, setStaff] = useState<UserResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [days, setDays] = useState(6);
  const [counsellorId, setCounsellorId] = useState('');
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);

  // Only somebody who can see every lead can meaningfully filter by counsellor — the server
  // pins everybody else to their own work regardless of what is asked for.
  const seesEveryone = can(currentUser, 'LEAD_VIEW_ALL');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const from = dateInDays(-days);
      const to = dateInDays(0);
      setLog(await leadService.activity(from, to, counsellorId || undefined));
    } catch (e) {
      setLoadError(errorMessage(e, 'The activity log could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [days, counsellorId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!seesEveryone) return;
    userService.getTeam()
      .then(t => setStaff(t.users))
      .catch(() => { /* the log still reads without the filter */ });
  }, [seesEveryone]);

  // Grouped by day so a week reads as a week rather than one long list.
  const byDay = log.reduce<Record<string, ContactLogDTO[]>>((acc, entry) => {
    const key = dayLabel(entry.at);
    (acc[key] ??= []).push(entry);
    return acc;
  }, {});

  const select = 'text-xs font-bold px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-primary/20';

  return (
    <div className="space-y-5">
      <AnimatePresence>
        {loadError && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            role="alert"
            className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium flex-1">{loadError}</p>
            <button onClick={load} className="text-sm font-semibold underline shrink-0">Retry</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {RANGES.map(range => (
            <button key={range.days} onClick={() => setDays(range.days)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                days === range.days
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'}`}>
              {range.label}
            </button>
          ))}
        </div>

        {seesEveryone && (
          <select value={counsellorId} onChange={e => setCounsellorId(e.target.value)}
            aria-label="Counsellor" className={select}>
            <option value="">Everyone</option>
            {staff.map(u => (
              <option key={u.id} value={u.id}>{u.displayName}</option>
            ))}
          </select>
        )}

        <span className="text-xs text-gray-400 ml-auto">
          {loading ? 'Loading…' : `${log.length} follow-up${log.length === 1 ? '' : 's'}`}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading the activity log…
        </div>
      ) : log.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center">
          <PhoneCall className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            No follow-ups recorded in this period.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            A call only appears here once its outcome has been recorded on the lead.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {(Object.entries(byDay) as [string, ContactLogDTO[]][]).map(([label, entries]) => (
            <section key={label}>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
                {label} · {entries.length}
              </h3>
              <ul className="bg-white rounded-3xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                {entries.map(entry => {
                  const Icon = ICONS[entry.type] ?? PhoneCall;
                  return (
                    <li key={entry.id}>
                      <button onClick={() => setOpenLeadId(entry.leadId)}
                        className="w-full text-left p-4 hover:bg-gray-50 transition-colors flex gap-3">
                        <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                          <Icon size={14} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-sm font-bold text-gray-900">{entry.studentName}</span>
                            <span className="text-xs text-gray-500">{entry.outcomeLabel}</span>
                            <span className="text-[11px] text-gray-400 ml-auto shrink-0">
                              {time(entry.at)}
                            </span>
                          </div>

                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {entry.course ? `${entry.course} · ` : ''}{entry.counsellor}
                          </p>

                          {entry.note && (
                            <p className="mt-1.5 text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                              &ldquo;{entry.note}&rdquo;
                            </p>
                          )}

                          {/* A follow-up that left the student with no next date is the one worth
                              spotting here — it is how a lead quietly stops being worked. */}
                          <p className={`text-[11px] mt-1 inline-flex items-center gap-1 ${
                            entry.nextTouchOn ? 'text-gray-400' : 'text-red-600 font-semibold'}`}>
                            <CalendarClock size={11} className="shrink-0" />
                            {entry.nextTouchOn
                              ? `Next: ${new Date(`${entry.nextTouchOn}T00:00:00`)
                                  .toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' })}`
                              : 'No next follow-up booked'}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {openLeadId && (
        <LeadDrawer
          leadId={openLeadId}
          currentUser={currentUser}
          options={null}
          staff={[]}
          onClose={() => setOpenLeadId(null)}
          onUpdated={load}
        />
      )}
    </div>
  );
};

export default AdminActivity;
