import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, Phone, Mail, MapPin, GraduationCap, CalendarClock, Loader2, AlertCircle,
  CheckCircle2, MessageSquare, PhoneCall, ArrowRightLeft, Sparkles, StickyNote,
  Ban, Save, Clock, PauseCircle, PlayCircle, ListChecks, CalendarPlus, Eye, GraduationCap as Cap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { leadService, demoService, errorMessage } from '../../services/api';
import SendPackPanel from './SendPackPanel';
import { batchService } from '../../services/api';
import { can } from '../../lib/permissions';
import {
  LeadDTO, LeadDetailDTO, LeadActivityDTO, LeadOptionsDTO, OptionDTO, LadderStepDTO, BatchDTO,
  AssetOpenDTO,
  GradeName, StageName, OutcomeName, StaffUserDTO, UserResponseDTO
} from '../../dtos';

/**
 * The lead workspace.
 *
 * The important idea here is that a counsellor records *what happened*, not what the system
 * should do about it. Choosing "No answer" or "Asking parents" writes the activity, moves the
 * stage and books the follow-up the SOP prescribes — all decided on the server, so the rule
 * lives in one place and cannot drift between this screen and the API.
 */

const GRADE_STYLES: Record<GradeName, { chip: string; active: string }> = {
  HOT:  { chip: 'bg-red-50 text-red-700 border-red-100',      active: 'bg-red-500 text-white border-red-500' },
  WARM: { chip: 'bg-amber-50 text-amber-700 border-amber-100', active: 'bg-amber-500 text-white border-amber-500' },
  COLD: { chip: 'bg-sky-50 text-sky-700 border-sky-100',       active: 'bg-sky-500 text-white border-sky-500' },
};

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  CALL: PhoneCall,
  WHATSAPP: MessageSquare,
  EMAIL: Mail,
  DEMO: Sparkles,
  NOTE: StickyNote,
  STAGE_CHANGE: ArrowRightLeft,
  GRADE_CHANGE: ArrowRightLeft,
  ASSIGNMENT: ArrowRightLeft,
  CAPTURE: Sparkles,
  SYSTEM: Clock,
};

/**
 * Shared empty values. Assigning a fresh [] on every reset is what turned this component into
 * an infinite render loop: React compares state with Object.is, so a new array is always a
 * change, which re-rendered, which re-ran the effect, which reset again.
 */
const NO_ACTIVITIES: LeadActivityDTO[] = [];
const NO_LADDER: LadderStepDTO[] = [];
// Stable empty arrays, so a lead with no data does not retrigger effects on every render.
const NO_OPENS: AssetOpenDTO[] = [];

const today = () => new Date().toISOString().split('T')[0];

const formatStamp = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const formatDay = (iso?: string) => {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

interface Props {
  leadId: string | null;
  currentUser?: UserResponseDTO | null;
  options: LeadOptionsDTO | null;
  staff: StaffUserDTO[];
  onClose: () => void;
  /** Called whenever the lead changes, so the list behind the drawer stays truthful. */
  onUpdated: (lead: LeadDTO) => void;
}

const LeadDrawer: React.FC<Props> = ({ leadId, currentUser, options, staff, onClose, onUpdated }) => {
  const [lead, setLead] = useState<LeadDTO | null>(null);
  const [activities, setActivities] = useState<LeadActivityDTO[]>([]);
  const [ladder, setLadder] = useState<LadderStepDTO[]>([]);
  const [opens, setOpens] = useState<AssetOpenDTO[]>([]);
  const [showLane, setShowLane] = useState(false);
  const [batches, setBatches] = useState<BatchDTO[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [pendingOutcome, setPendingOutcome] = useState<OptionDTO | null>(null);
  const [outcomeNote, setOutcomeNote] = useState('');
  const [lostReason, setLostReason] = useState('');

  const [notes, setNotes] = useState('');
  const [notesDirty, setNotesDirty] = useState(false);
  const [nextTouch, setNextTouch] = useState('');

  const closeRef = useRef<HTMLButtonElement>(null);

  const canEdit = can(currentUser, 'LEAD_EDIT');
  const canAssign = can(currentUser, 'LEAD_ASSIGN');

  const flash = (msg: string) => {
    setSuccess(msg);
    window.setTimeout(() => setSuccess(null), 3000);
  };

  /**
   * Held in a ref rather than named as a dependency. Every screen passes this as an inline
   * arrow, so it has a new identity on each parent render — depending on it directly made
   * applyDetail unstable, which made the effect below re-run on every render.
   */
  const onUpdatedRef = useRef(onUpdated);
  useEffect(() => { onUpdatedRef.current = onUpdated; });

  const applyDetail = useCallback((detail: LeadDetailDTO) => {
    setLead(detail.lead);
    setActivities(detail.activities);
    setLadder(detail.ladder ?? NO_LADDER);
    setOpens(detail.opens ?? NO_OPENS);
    setNotes(detail.lead.notes ?? '');
    setNotesDirty(false);
    setNextTouch(detail.lead.nextTouchOn ?? '');
    onUpdatedRef.current(detail.lead);
  }, []);

  useEffect(() => {
    if (!leadId) { setLead(null); setActivities(NO_ACTIVITIES); setLadder(NO_LADDER); setOpens(NO_OPENS); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPendingOutcome(null);
    leadService.detail(leadId)
      .then(d => { if (!cancelled) applyDetail(d); })
      .catch(err => { if (!cancelled) setError(errorMessage(err, 'Could not open that lead.')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [leadId, applyDetail]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (leadId) {
      window.addEventListener('keydown', onKey);
      // Move focus into the drawer once it has opened, so a keyboard user is not left behind on
      // the page underneath. Skipped if focus has already landed somewhere inside it: the delay
      // is long enough that somebody can start typing first, and stealing focus mid-sentence
      // throws away what they typed.
      window.setTimeout(() => {
        const active = document.activeElement;
        const typing = active instanceof HTMLInputElement
          || active instanceof HTMLTextAreaElement
          || active instanceof HTMLSelectElement;
        if (typing) return;
        closeRef.current?.focus();
      }, 80);
    }
    return () => window.removeEventListener('keydown', onKey);
  }, [leadId, onClose]);

  const patch = async (changes: Parameters<typeof leadService.patch>[1], note: string) => {
    if (!lead) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await leadService.patch(lead.id, changes);
      setLead(updated);
      setNextTouch(updated.nextTouchOn ?? '');
      onUpdated(updated);
      flash(note);
      // Transitions are written to the timeline, so pull it back in.
      leadService.detail(lead.id).then(d => setActivities(d.activities)).catch(() => {});
    } catch (err) {
      setError(errorMessage(err, 'Could not save that change.'));
    } finally {
      setSaving(false);
    }
  };

  const submitOutcome = async () => {
    if (!lead || !pendingOutcome) return;
    setSaving(true);
    setError(null);
    try {
      const detail = await leadService.recordOutcome(lead.id, {
        outcome: pendingOutcome.value as OutcomeName,
        note: outcomeNote.trim() || undefined,
        lostReason: lostReason || undefined,
      });
      applyDetail(detail);
      flash(`Recorded: ${pendingOutcome.label}.`);
      setPendingOutcome(null);
      setOutcomeNote('');
      setLostReason('');
    } catch (err) {
      setError(errorMessage(err, 'Could not record that outcome.'));
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    await patch({ notes }, 'Notes saved.');
    setNotesDirty(false);
  };

  const pauseLadder = async () => {
    if (!lead) return;
    const until = window.prompt(
      'Pause follow-ups until which date? (YYYY-MM-DD)\n\n' +
      'The lead stays in the pipeline and simply stops being chased — use this for exams, ' +
      'a holiday, or a gap between intakes, rather than marking them lost to silence them.',
      new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
    );
    if (!until) return;
    const reason = window.prompt('Why? (optional)') ?? undefined;
    setSaving(true);
    try {
      const updated = await leadService.pause(lead.id, until, reason);
      setLead(updated);
      onUpdated(updated);
      flash('Follow-ups paused.');
    } catch (err) {
      setError(errorMessage(err, 'Could not pause that sequence.'));
    } finally {
      setSaving(false);
    }
  };

  const resumeLadder = async () => {
    if (!lead) return;
    setSaving(true);
    try {
      const updated = await leadService.resume(lead.id);
      setLead(updated);
      onUpdated(updated);
      flash('Follow-ups resumed.');
    } catch (err) {
      setError(errorMessage(err, 'Could not resume that sequence.'));
    } finally {
      setSaving(false);
    }
  };

  /**
   * Enrolling. The batch list is only fetched when a counsellor opens the form, because most
   * lead screens are opened to log a call rather than to close a student.
   */
  const startEnrolment = async () => {
    setEnrolling(true);
    if (batches.length === 0) {
      batchService.list(true).then(setBatches).catch(() => { /* enrol without a batch */ });
    }
  };

  const confirmEnrolment = async (batchId: string, feePlan: string, paymentStatus: string) => {
    if (!lead) return;
    setSaving(true);
    try {
      const updated = await leadService.enrol(lead.id, batchId || undefined, feePlan, paymentStatus);
      setLead(updated);
      onUpdated(updated);
      setEnrolling(false);
      flash('Enrolled. Their week-one check-in is booked.');
      leadService.detail(lead.id).then(applyDetail).catch(() => {});
    } catch (err) {
      setError(errorMessage(err, 'Could not record that enrolment.'));
    } finally {
      setSaving(false);
    }
  };

  const bookDemo = async () => {
    if (!lead) return;
    const date = window.prompt(
      'Demo date? (YYYY-MM-DD)\n\nBooking it moves the lead to "Demo booked" and points the ' +
      'next touch at the demo day.',
      new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]
    );
    if (!date) return;
    const time = window.prompt('Time? (HH:MM, 24-hour)', '17:00');
    if (!time) return;

    setSaving(true);
    try {
      await demoService.book(lead.id, `${date}T${time}:00`);
      const detail = await leadService.detail(lead.id);
      applyDetail(detail);
      flash('Demo booked. Confirm it with the student in writing.');
    } catch (err) {
      setError(errorMessage(err, 'Could not book that demo.'));
    } finally {
      setSaving(false);
    }
  };

  const handleOptOut = async () => {
    if (!lead) return;
    const ok = window.confirm(
      `Mark ${lead.fullName} as opted out?\n\n` +
      `They will be excluded from every follow-up and announcement, permanently. ` +
      `Their record and history are kept.`
    );
    if (!ok) return;
    setSaving(true);
    try {
      const updated = await leadService.optOut(lead.id);
      setLead(updated);
      onUpdated(updated);
      flash('Marked as opted out.');
    } catch (err) {
      setError(errorMessage(err, 'Could not update that lead.'));
    } finally {
      setSaving(false);
    }
  };

  const isLosing = pendingOutcome?.value === 'NOT_INTERESTED';
  const noteRequired = !!pendingOutcome?.hint?.includes('A note is required');
  const canSubmitOutcome = !!pendingOutcome
    && (!noteRequired || outcomeNote.trim().length > 0)
    && (!isLosing || !!lostReason);

  const open = !!leadId;
  const readOnly = !canEdit || !!lead?.optedOut;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[90]"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.26, ease: [0.32, 0.72, 0, 1] }}
            role="dialog" aria-modal="true" aria-label="Lead details"
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[560px] bg-white z-[95] shadow-2xl flex flex-col"
          >
            {loading || !lead ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
                {error ? (
                  <>
                    <AlertCircle size={36} className="text-red-400" />
                    <p className="text-sm text-red-600 text-center max-w-xs">{error}</p>
                    <button onClick={onClose} className="px-5 py-2.5 bg-gray-100 rounded-2xl font-bold text-sm">Close</button>
                  </>
                ) : (
                  <Loader2 size={32} className="animate-spin text-gray-300" />
                )}
              </div>
            ) : (
              <>
                {/* Header */}
                <header className="p-5 border-b border-gray-100 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-primary flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {lead.fullName?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-gray-900 truncate">{lead.fullName}</h2>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {[lead.courseInterested, lead.backgroundLabel, lead.cityName].filter(Boolean).join(' · ') || 'No details yet'}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {lead.grade && (
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${GRADE_STYLES[lead.grade].chip}`}>
                          {lead.gradeLabel}
                        </span>
                      )}
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600">
                        {lead.stageLabel}
                      </span>
                      {lead.sourceLabel && (
                        <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-gray-50 text-gray-500"
                          title={[lead.sourceDetail, lead.utmCampaign && `campaign ${lead.utmCampaign}`]
                            .filter(Boolean).join(' · ') || undefined}>
                          {lead.sourceLabel}
                        </span>
                      )}
                      {/* Named separately from the source, because "website form" and "the
                          August Instagram campaign" answer different questions. */}
                      {lead.utmCampaign && (
                        <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-100">
                          {lead.utmSource ? `${lead.utmSource} · ` : ''}{lead.utmCampaign}
                        </span>
                      )}
                      {lead.optedOut && (
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-red-50 text-red-600">Opted out</span>
                      )}
                    </div>
                  </div>
                  <button ref={closeRef} onClick={onClose} aria-label="Close"
                    className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700 transition-colors">
                    <X size={20} />
                  </button>
                </header>

                {/* Feedback */}
                <AnimatePresence>
                  {(error || success) && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                      <div className={`mx-5 mt-4 p-3 rounded-2xl text-sm font-medium flex items-start gap-2.5 ${
                        error ? 'bg-red-50 text-red-700 border border-red-100'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}
                        role={error ? 'alert' : 'status'}>
                        {error ? <AlertCircle size={17} className="flex-shrink-0 mt-0.5" /> : <CheckCircle2 size={17} className="flex-shrink-0 mt-0.5" />}
                        <span className="flex-1">{error || success}</span>
                        {error && <button onClick={() => setError(null)} aria-label="Dismiss"><X size={15} /></button>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex-1 overflow-y-auto px-5 pb-10">
                  {/* Next touch — the SOP's golden rule */}
                  <section className="py-5 border-b border-gray-100">
                    <div className={`p-4 rounded-2xl border ${
                      lead.nextTouchOn
                        ? (lead.daysOverdue ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100')
                        : 'bg-red-50 border-red-100'}`}>
                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">Next touch</p>
                      {lead.nextTouchOn ? (
                        <p className={`font-bold ${lead.daysOverdue ? 'text-red-700' : 'text-emerald-700'}`}>
                          {formatDay(lead.nextTouchOn)}
                          {lead.daysOverdue ? ` · ${lead.daysOverdue} day${lead.daysOverdue > 1 ? 's' : ''} overdue` : ''}
                        </p>
                      ) : (
                        <p className="font-bold text-red-700">Not set — this lead is at risk</p>
                      )}
                      <p className="text-xs text-gray-600 mt-1">
                        {lead.nextTouchNote || 'An active lead must always carry a future date until it enrols or is marked lost.'}
                      </p>
                      {canEdit && !lead.optedOut && (
                        <div className="flex items-center gap-2 mt-3">
                          <input type="date" value={nextTouch} min={today()}
                            onChange={e => setNextTouch(e.target.value)}
                            aria-label="Next touch date"
                            className="text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-primary/20 outline-none" />
                          <button
                            onClick={() => patch({ nextTouchOn: nextTouch }, 'Next touch updated.')}
                            disabled={!nextTouch || nextTouch === (lead.nextTouchOn ?? '') || saving}
                            className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-orange-600 transition-colors">
                            Set
                          </button>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* What the student has actually opened. Nothing is drawn until something
                      has been, because an empty panel reads as "they ignored it" when the truth
                      is usually that nothing tracked has been sent yet. */}
                  {opens.length > 0 && (
                    <section className="py-5 border-b border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye size={14} className="text-gray-400" />
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex-1">
                          What they opened
                        </p>
                      </div>
                      <ul className="space-y-1.5">
                        {opens.map(o => (
                          <li key={o.assetKey} className="flex items-baseline justify-between gap-3 text-sm">
                            <span className="text-gray-700">{o.assetName ?? o.assetKey}</span>
                            <span className={`text-xs shrink-0 ${o.opens >= 3 ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
                              {o.opens === 1 ? 'opened once' : `opened ${o.opens} times`}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {opens.some(o => o.opens >= 3) && (
                        <p className="mt-2 text-xs text-emerald-700">
                          Going back to something repeatedly usually means they are deciding. Worth a call.
                        </p>
                      )}
                    </section>
                  )}

                  {/* Follow-up ladder */}
                  {lead.grade && ladder.length > 0 && (
                    <section className="py-5 border-b border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <ListChecks size={14} className="text-gray-400" />
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex-1">
                          Follow-up sequence
                        </p>
                        <span className="text-xs font-bold text-gray-500 tabular-nums">
                          Step {lead.ladderStep ?? 1} of {ladder.length}
                        </span>
                      </div>

                      <div className="flex gap-1" role="img"
                        aria-label={`Step ${lead.ladderStep ?? 1} of ${ladder.length} in the ${lead.gradeLabel} sequence`}>
                        {ladder.map(step => (
                          <span key={step.id}
                            title={`Day ${step.dayOffset} — ${step.title}`}
                            className={`h-1.5 flex-1 rounded-full ${
                              step.reached ? 'bg-primary' : 'bg-gray-200'}`} />
                        ))}
                      </div>

                      <p className="text-xs text-gray-500 mt-2">
                        {lead.ladderPausedUntil ? (
                          <span className="text-amber-700 font-medium">
                            Paused until {formatDay(lead.ladderPausedUntil)}
                            {lead.ladderPauseReason ? ` — ${lead.ladderPauseReason}` : ''}
                          </span>
                        ) : (
                          <>
                            {lead.gradeLabel} sequence.{' '}
                            {ladder.length && (lead.ladderStep ?? 1) >= ladder.length
                              ? 'This is the last step — the lead moves down a grade after this unless something changes.'
                              : 'Runs automatically each morning.'}
                          </>
                        )}
                      </p>

                      <button onClick={() => setShowLane(v => !v)} aria-expanded={showLane}
                        className="text-xs font-bold text-gray-500 hover:text-gray-900 mt-2 transition-colors">
                        {showLane ? 'Hide the schedule' : 'Show the whole schedule'}
                      </button>

                      {showLane && (
                        <ol className="mt-3 space-y-1.5">
                          {ladder.map(step => (
                            <li key={step.id} className={`flex gap-3 text-xs ${
                              step.reached ? 'text-gray-400' : 'text-gray-700'}`}>
                              <span className="font-mono w-12 flex-shrink-0 tabular-nums">Day {step.dayOffset}</span>
                              <span className="flex-1">
                                <span className="font-bold">{step.title}</span>
                                {step.action && <span className="block text-gray-400 mt-0.5">{step.action}</span>}
                              </span>
                              {step.reached && <span className="text-emerald-500 flex-shrink-0">done</span>}
                            </li>
                          ))}
                        </ol>
                      )}

                      {canEdit && !lead.optedOut && (
                        <div className="mt-3">
                          {lead.ladderPausedUntil ? (
                            <button onClick={() => resumeLadder()} disabled={saving}
                              className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 px-3 py-2 rounded-xl transition-colors disabled:opacity-50">
                              <PlayCircle size={14} /> Resume follow-ups
                            </button>
                          ) : (
                            <button onClick={() => pauseLadder()} disabled={saving}
                              title="Exams, a holiday, a gap between intakes"
                              className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 px-3 py-2 rounded-xl transition-colors disabled:opacity-50">
                              <PauseCircle size={14} /> Pause follow-ups
                            </button>
                          )}
                        </div>
                      )}
                    </section>
                  )}

                  {/* Grade, stage, owner */}
                  <section className="py-5 border-b border-gray-100 space-y-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Grade</p>
                      <div className="flex gap-2">
                        {(options?.grades ?? []).map(g => {
                          const key = g.value as GradeName;
                          const active = lead.grade === key;
                          return (
                            <button key={g.value} disabled={readOnly || saving}
                              aria-pressed={active}
                              onClick={() => patch({ grade: key }, `Graded ${g.label}.`)}
                              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors disabled:opacity-50 ${
                                active ? GRADE_STYLES[key].active : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                              {g.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 block" htmlFor="ld-stage">Stage</label>
                        <select id="ld-stage" value={lead.stage ?? ''} disabled={readOnly || saving}
                          onChange={e => patch({ stage: e.target.value as StageName }, 'Stage updated.')}
                          className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50">
                          {(options?.stages ?? []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                      {canAssign && (
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 block" htmlFor="ld-owner">Counsellor</label>
                          <select id="ld-owner" value={lead.assignedToId ?? ''} disabled={saving}
                            onChange={e => patch(e.target.value ? { assignedToId: e.target.value } : { clearOwner: true }, 'Owner updated.')}
                            className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50">
                            <option value="">Unassigned</option>
                            {staff.map(s => <option key={s.id} value={s.id}>{s.displayName}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Record what happened */}
                  {canEdit && !lead.optedOut && (
                    <section className="py-5 border-b border-gray-100">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Record the contact</p>
                      <p className="text-xs text-gray-500 mt-1 mb-3">
                        Pick what happened. The stage, the next touch and any extra follow-ups are applied for you.
                      </p>

                      {pendingOutcome ? (
                        <div className="border border-primary/30 bg-orange-50/50 rounded-2xl p-4 space-y-3">
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              <p className="font-bold text-sm">{pendingOutcome.label}</p>
                              {pendingOutcome.hint && <p className="text-xs text-gray-600 mt-0.5">{pendingOutcome.hint}</p>}
                            </div>
                            <button onClick={() => setPendingOutcome(null)} aria-label="Cancel"
                              className="p-1 text-gray-400 hover:text-gray-700"><X size={16} /></button>
                          </div>

                          <textarea value={outcomeNote} onChange={e => setOutcomeNote(e.target.value)} rows={3}
                            aria-label="What was said"
                            placeholder={noteRequired
                              ? 'Required — what did the student actually say?'
                              : 'Optional — anything worth remembering'}
                            className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none resize-y" />

                          {isLosing && (
                            <div>
                              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block" htmlFor="ld-lost">
                                Why was it lost?
                              </label>
                              <select id="ld-lost" value={lostReason} onChange={e => setLostReason(e.target.value)}
                                className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-primary/20 outline-none">
                                <option value="">Choose a reason…</option>
                                {(options?.lostReasons ?? []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </select>
                              <p className="text-[11px] text-gray-500 mt-1.5">
                                The lead is kept, not deleted — students often return for a later intake.
                              </p>
                            </div>
                          )}

                          <button onClick={submitOutcome} disabled={!canSubmitOutcome || saving}
                            className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors">
                            {saving ? <><Loader2 size={16} className="animate-spin" /> Recording…</> : 'Record it'}
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {(options?.outcomes ?? []).map(o => (
                            <button key={o.value}
                              onClick={() => { setPendingOutcome(o); setOutcomeNote(''); setLostReason(''); }}
                              className="text-left p-3 rounded-xl border border-gray-200 bg-gray-50/60 hover:border-primary/40 hover:bg-orange-50 transition-colors">
                              <span className="block text-sm font-bold text-gray-800">{o.label}</span>
                              {o.hint && <span className="block text-[11px] text-gray-500 mt-0.5 leading-snug">{o.hint}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </section>
                  )}

                  {/* Send pack */}
                  {canEdit && !lead.optedOut && (
                    <SendPackPanel
                      leadId={lead.id}
                      studentName={lead.fullName}
                      onSent={() => {
                        flash('Recorded on the timeline.');
                        leadService.detail(lead.id).then(applyDetail).catch(() => {});
                      }}
                      onError={setError}
                    />
                  )}

                  {/* Enrolment */}
                  {canEdit && !lead.optedOut && (
                    <section className="py-5 border-b border-gray-100">
                      {lead.stage === 'ENROLLED' ? (
                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 opacity-80">Enrolled</p>
                          <p className="font-bold text-emerald-800 mt-1">{lead.batchName ?? 'No batch chosen yet'}</p>
                          {lead.feePlan && <p className="text-xs text-emerald-800 mt-1">{lead.feePlan}</p>}
                          {lead.paymentStatus && (
                            <p className="text-[11px] text-emerald-700 mt-1">
                              Payment: {lead.paymentStatus.replace('_', ' ').toLowerCase()}
                            </p>
                          )}
                        </div>
                      ) : enrolling ? (
                        <EnrolmentForm batches={batches} saving={saving}
                          onCancel={() => setEnrolling(false)} onConfirm={confirmEnrolment} />
                      ) : (
                        <button onClick={startEnrolment}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors">
                          <Cap size={16} /> Enrol this student
                        </button>
                      )}
                    </section>
                  )}

                  {/* Demo */}
                  {canEdit && !lead.optedOut && (
                    <section className="py-5 border-b border-gray-100">
                      <button onClick={bookDemo} disabled={saving}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-gray-300 text-sm font-bold text-gray-600 hover:border-primary hover:text-primary hover:bg-orange-50/50 transition-colors disabled:opacity-50">
                        <CalendarPlus size={16} /> Book a demo or campus visit
                      </button>
                      <p className="text-[11px] text-gray-400 mt-2 text-center">
                        The free demo is the low-risk next step the SOP recommends when someone
                        is hesitating.
                      </p>
                    </section>
                  )}

                  {/* Contact details */}
                  <section className="py-5 border-b border-gray-100">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <a href={`tel:${lead.mobileNumber}`} className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors">
                        <Phone size={15} className="text-gray-400" />{lead.mobileNumber}
                      </a>
                      {lead.email && (
                        <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors truncate">
                          <Mail size={15} className="text-gray-400 flex-shrink-0" /><span className="truncate">{lead.email}</span>
                        </a>
                      )}
                      <span className="flex items-center gap-2 text-gray-600"><MapPin size={15} className="text-gray-400" />{lead.cityName || '—'}</span>
                      <span className="flex items-center gap-2 text-gray-600"><GraduationCap size={15} className="text-gray-400" />{lead.backgroundLabel || lead.education || '—'}</span>
                      <span className="flex items-center gap-2 text-gray-600"><PhoneCall size={15} className="text-gray-400" />{lead.callAttempts ?? 0} of 3 attempts</span>
                      <span className="flex items-center gap-2 text-gray-600">
                        <CalendarClock size={15} className="text-gray-400" />
                        {lead.firstResponseMinutes != null
                          ? <span className={lead.firstResponseMinutes <= 5 ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                              {lead.firstResponseMinutes} min to first reply
                            </span>
                          : 'Not replied yet'}
                      </span>
                    </div>
                  </section>

                  {/* Notes */}
                  <section className="py-5 border-b border-gray-100">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 block" htmlFor="ld-notes">
                      Notes
                    </label>
                    <textarea id="ld-notes" value={notes} rows={3} disabled={readOnly}
                      onChange={e => { setNotes(e.target.value); setNotesDirty(true); }}
                      placeholder="Their goal, the real objection, whether parents are involved…"
                      className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none resize-y disabled:bg-gray-50" />
                    {notesDirty && (
                      <button onClick={saveNotes} disabled={saving}
                        className="mt-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50">
                        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save notes
                      </button>
                    )}
                  </section>

                  {/* Timeline */}
                  <section className="py-5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">
                      Everything that happened
                    </p>
                    {activities.length === 0 ? (
                      <p className="text-sm text-gray-400 py-6 text-center">
                        Nothing recorded yet. The first contact will appear here.
                      </p>
                    ) : (
                      <ol className="space-y-0">
                        {activities.map((a, i) => {
                          const Icon = ACTIVITY_ICONS[a.type] ?? StickyNote;
                          const last = i === activities.length - 1;
                          return (
                            <li key={a.id} className="flex gap-3 relative pb-5">
                              {!last && <span className="absolute left-[13px] top-7 bottom-0 w-px bg-gray-100" aria-hidden="true" />}
                              <span className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                                a.direction === 'INBOUND' ? 'bg-sky-50 text-sky-600' :
                                a.direction === 'OUTBOUND' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                <Icon size={13} />
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-baseline gap-2 flex-wrap">
                                  <span className="text-sm font-bold text-gray-800">{a.summary}</span>
                                  <time className="text-[11px] text-gray-400" dateTime={a.createdAt}>{formatStamp(a.createdAt)}</time>
                                </div>
                                {a.detail && <p className="text-sm text-gray-600 mt-0.5 whitespace-pre-wrap break-words">{a.detail}</p>}
                                {a.createdByName && <p className="text-[11px] text-gray-400 mt-1">{a.createdByName}</p>}
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </section>

                  {canEdit && !lead.optedOut && (
                    <button onClick={handleOptOut} disabled={saving}
                      className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-2xl transition-colors disabled:opacity-50">
                      <Ban size={16} /> Student asked to stop contacting them
                    </button>
                  )}
                </div>
              </>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

/**
 * The enrolment form.
 *
 * A batch is optional: the date is often agreed after payment, and refusing to record an
 * enrolment because the intake is undecided would push counsellors back to a notebook.
 */
const EnrolmentForm: React.FC<{
  batches: BatchDTO[];
  saving: boolean;
  onCancel: () => void;
  onConfirm: (batchId: string, feePlan: string, paymentStatus: string) => void;
}> = ({ batches, saving, onCancel, onConfirm }) => {
  const [batchId, setBatchId] = useState('');
  const [feePlan, setFeePlan] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('PENDING');

  return (
    <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Enrol this student</p>

      <div>
        <label className="text-[11px] font-bold text-gray-500 mb-1 block" htmlFor="en-batch">Batch</label>
        <select id="en-batch" value={batchId} onChange={e => setBatchId(e.target.value)}
          className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">Not decided yet</option>
          {batches.map(b => <option key={b.id} value={b.id}>{b.description}</option>)}
        </select>
      </div>

      <div>
        <label className="text-[11px] font-bold text-gray-500 mb-1 block" htmlFor="en-fee">Fee plan</label>
        <input id="en-fee" value={feePlan} onChange={e => setFeePlan(e.target.value)}
          placeholder="45,000 in three instalments"
          className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20" />
      </div>

      <div>
        <label className="text-[11px] font-bold text-gray-500 mb-1 block" htmlFor="en-pay">Payment</label>
        <select id="en-pay" value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}
          className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-primary/20">
          <option value="PENDING">Not paid yet</option>
          <option value="PART_PAID">Part paid</option>
          <option value="PAID">Paid in full</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-bold text-gray-600">
          Cancel
        </button>
        <button onClick={() => onConfirm(batchId, feePlan, paymentStatus)} disabled={saving}
          className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
          {saving && <Loader2 size={14} className="animate-spin" />} Enrol
        </button>
      </div>
      <p className="text-[11px] text-gray-500">
        A week-one check-in is booked automatically, because that is when to ask for a referral.
      </p>
    </div>
  );
};

export default LeadDrawer;
