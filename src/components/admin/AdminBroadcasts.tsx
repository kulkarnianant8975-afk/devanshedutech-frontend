import React, { useState, useEffect, useCallback } from 'react';
import {
  Megaphone, Loader2, AlertCircle, X, CheckCircle2, Users, Send, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { broadcastService, errorMessage } from '../../services/api';
import { can } from '../../lib/permissions';
import { SegmentDTO, BroadcastDTO, UserResponseDTO } from '../../dtos';

/**
 * Announcements to the people nobody is chasing.
 *
 * Cold and closed leads are dormant rather than dead — the SOP keeps a lost lead precisely
 * because students return for the next intake. Without this screen the follow-up ladder decays
 * people into silence, which is a slower way of deleting them.
 *
 * Every segment shows who it reaches and how many, because sending to a list you have not
 * counted is how an institute annoys three hundred people at once.
 */

const STATUS_TONE: Record<string, string> = {
  SENT: 'bg-emerald-50 text-emerald-700',
  FAILED: 'bg-red-50 text-red-600',
  SENDING: 'bg-amber-50 text-amber-700',
  DRAFT: 'bg-gray-100 text-gray-500',
};

interface Props { currentUser?: UserResponseDTO | null; }

const AdminBroadcasts: React.FC<Props> = ({ currentUser }) => {
  const [segments, setSegments] = useState<SegmentDTO[]>([]);
  const [canSend, setCanSend] = useState(false);
  const [history, setHistory] = useState<BroadcastDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const [segment, setSegment] = useState('COLD');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const mayBroadcast = can(currentUser, 'LEAD_ASSIGN');
  const chosen = segments.find(s => s.segment === segment);

  const load = useCallback(async () => {
    try {
      const [seg, recent] = await Promise.all([
        broadcastService.segments(),
        broadcastService.recent(),
      ]);
      setSegments(seg.segments);
      setCanSend(seg.canSend);
      setHistory(recent);
    } catch (err) {
      setError(errorMessage(err, 'Could not load broadcasts.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const send = async () => {
    if (!chosen) return;
    const ok = window.confirm(
      `Send "${title}" to ${chosen.recipients} ${chosen.label.toLowerCase()}?\n\n` +
      `This cannot be recalled. Anyone who asked to stop is excluded automatically.`
    );
    if (!ok) return;

    setSending(true);
    setError(null);
    try {
      const result = await broadcastService.send(title, message, segment);
      setSuccess(result.status === 'SENT'
        ? `Sent to ${result.sentCount} of ${result.recipientCount}.`
        : `Recorded, but nothing was sent — connect a messaging provider first.`);
      setTitle(''); setMessage('');
      load();
      window.setTimeout(() => setSuccess(null), 6000);
    } catch (err) {
      setError(errorMessage(err, 'Could not send that broadcast.'));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="space-y-4">{[1, 2].map(i => <div key={i} className="h-56 bg-white rounded-[28px] animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-5">
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            role="alert" className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium flex-1">{error}</p>
            <button onClick={() => setError(null)} aria-label="Dismiss"><X size={18} /></button>
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            role="status" className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-2xl">
            <CheckCircle2 size={20} /><p className="text-sm font-medium">{success}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {!canSend && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl">
          <Info size={18} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm">
            <strong>No messaging provider is connected.</strong> A broadcast cannot fan out to a
            list without one — you can compose here, but nothing will reach anybody until an
            AiSensy key is configured.
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_360px] items-start">
        <section className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
          <header className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Megaphone size={16} className="text-gray-400" />
            <h3 className="font-bold text-sm text-gray-900">New announcement</h3>
          </header>

          <div className="p-5 space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 block" htmlFor="bc-seg">
                Who it goes to
              </label>
              <select id="bc-seg" value={segment} onChange={e => setSegment(e.target.value)}
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-primary/20">
                {segments.map(s => (
                  <option key={s.segment} value={s.segment}>
                    {s.label} — {s.recipients} {s.recipients === 1 ? 'person' : 'people'}
                  </option>
                ))}
              </select>
              {chosen && (
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">{chosen.description}</p>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 block" htmlFor="bc-title">
                Title <span className="normal-case font-normal">(for your records, not sent)</span>
              </label>
              <input id="bc-title" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="September batch — Data Analytics"
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20" />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 block" htmlFor="bc-msg">
                Message
              </label>
              <textarea id="bc-msg" value={message} onChange={e => setMessage(e.target.value)} rows={6}
                placeholder="Hi {{first_name}}, our next batch starts on 5 September…"
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 resize-y leading-relaxed" />
              <p className="text-[11px] text-gray-400 mt-1.5">
                <code className="bg-gray-100 px-1 rounded">{'{{first_name}}'}</code> and{' '}
                <code className="bg-gray-100 px-1 rounded">{'{{course}}'}</code> are filled in per student.
              </p>
            </div>

            {mayBroadcast ? (
              <button onClick={send} disabled={sending || !title.trim() || !message.trim() || !chosen?.recipients}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-orange-600 disabled:opacity-40 transition-colors">
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Send to {chosen?.recipients ?? 0}
              </button>
            ) : (
              <p className="text-xs text-gray-400 text-center py-2">
                Sending a broadcast is a manager&apos;s decision — it reaches everybody at once and
                cannot be recalled.
              </p>
            )}
          </div>
        </section>

        <div className="space-y-4">
          <section className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
            <header className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Users size={15} className="text-gray-400" />
              <h3 className="font-bold text-sm text-gray-900">Who is reachable</h3>
            </header>
            <ul className="divide-y divide-gray-50">
              {segments.map(s => (
                <li key={s.segment} className="px-5 py-3 flex items-center gap-3">
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-bold text-gray-800">{s.label}</span>
                    <span className="block text-[11px] text-gray-400 leading-snug">{s.description}</span>
                  </span>
                  <span className="text-sm font-bold text-gray-900 tabular-nums">{s.recipients}</span>
                </li>
              ))}
            </ul>
            {segments[0] && (
              <p className="px-5 py-3 text-[11px] text-gray-400 border-t border-gray-50">
                {segments[0].optedOutExcluded} student{segments[0].optedOutExcluded === 1 ? '' : 's'} asked
                to stop and {segments[0].optedOutExcluded === 1 ? 'is' : 'are'} excluded from every group.
              </p>
            )}
          </section>

          <section className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
            <header className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900">Recent broadcasts</h3>
            </header>
            {history.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">Nothing sent yet.</p>
            ) : (
              <ul className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                {history.map(b => (
                  <li key={b.id} className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-gray-800 flex-1 truncate">{b.title}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${STATUS_TONE[b.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {b.status.toLowerCase()}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {b.sentCount ?? 0} of {b.recipientCount ?? 0} · {b.createdByName}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminBroadcasts;
