import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Send, CheckCircle2, Clock, AlertTriangle, FileText, Video, Link2, Image } from 'lucide-react';
import { leadService, errorMessage } from '../../services/api';
import { SendPackSummaryDTO, PreparedPackDTO } from '../../dtos';

/**
 * Composing what goes to a student.
 *
 * The reply window is shown rather than merely enforced. WhatsApp only allows an ordinary
 * message within twenty-four hours of the student's last one; outside that, an approved
 * template is the only thing that will arrive. A counsellor who is not told that concludes the
 * software is broken, so the state and the reason are on screen.
 *
 * Sending is deliberately manual: the message opens in the counsellor's own WhatsApp and they
 * press send. Every message a student receives therefore comes from a person, which is what the
 * SOP asks for, and it works today without any messaging provider account.
 */

const ICONS: Record<string, React.ElementType> = {
  PDF: FileText, VIDEO: Video, LINK: Link2, IMAGE: Image,
};

const TYPE_TONE: Record<string, string> = {
  PDF: 'bg-red-600', VIDEO: 'bg-sky-600', LINK: 'bg-emerald-600', IMAGE: 'bg-amber-600',
};

const windowLabel = (mins: number | null) => {
  if (mins == null) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m left` : `${m}m left`;
};

interface Props {
  leadId: string;
  studentName: string;
  onSent: () => void;
  onError: (message: string) => void;
}

const SendPackPanel: React.FC<Props> = ({ leadId, studentName, onSent, onError }) => {
  const [packs, setPacks] = useState<SendPackSummaryDTO[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [prepared, setPrepared] = useState<PreparedPackDTO | null>(null);
  const [message, setMessage] = useState('');
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    leadService.packs()
      .then(list => { setPacks(list); if (list.length) setSelected(list[0].key); })
      .catch(() => { /* the rest of the lead screen still works without packs */ });
  }, []);

  const prepare = useCallback(async (packKey: string) => {
    setLoading(true);
    setSent(false);
    try {
      const p = await leadService.preparePack(leadId, packKey);
      setPrepared(p);
      setMessage(p.message);
      setExcluded(new Set());
    } catch (err) {
      onError(errorMessage(err, 'Could not prepare that message.'));
    } finally {
      setLoading(false);
    }
  }, [leadId, onError]);

  useEffect(() => { if (selected) prepare(selected); }, [selected, prepare]);

  const included = (prepared?.assets ?? []).filter(a => !excluded.has(a.key));

  const openWhatsApp = () => {
    if (!prepared) return;
    // The edited message goes, not the prepared one — the counsellor's wording wins.
    const phoneUrl = prepared.whatsappUrl?.split('?text=')[0];
    if (phoneUrl) {
      window.open(`${phoneUrl}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
    }
    setSent(true);
  };

  const confirmSent = async () => {
    if (!prepared) return;
    setSending(true);
    try {
      await leadService.recordPackSent(leadId, prepared.packKey, included.map(a => a.key));
      onSent();
      setSent(false);
    } catch (err) {
      onError(errorMessage(err, 'Sent, but it could not be recorded on the timeline.'));
    } finally {
      setSending(false);
    }
  };

  if (packs.length === 0) return null;

  return (
    <section className="py-5 border-b border-gray-100">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Send pack</p>

      {prepared && (
        <div className={`flex flex-wrap items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold mb-3 ${
          prepared.freeReplyOpen ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>
          {prepared.freeReplyOpen ? <Clock size={14} /> : <AlertTriangle size={14} />}
          <span>
            {prepared.freeReplyOpen
              ? `Free reply open · ${windowLabel(prepared.replyWindowMinutesLeft)}`
              : 'Window closed · template only'}
          </span>
          <span className="font-medium opacity-80 text-[11px]">
            {prepared.freeReplyOpen ? 'Sends as normal messages' : 'Until they reply'}
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
        {packs.map(p => (
          <button key={p.key} onClick={() => setSelected(p.key)} title={p.situation}
            aria-pressed={selected === p.key}
            className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors ${
              selected === p.key
                ? 'bg-orange-50 border-primary/40 text-primary'
                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>
            {p.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-8 text-center"><Loader2 size={20} className="animate-spin mx-auto text-gray-300" /></div>
      ) : prepared ? (
        <>
          {prepared.situation && (
            <p className="text-[11px] text-gray-400 mb-2">{prepared.situation}</p>
          )}

          <textarea
            value={message} onChange={e => setMessage(e.target.value)} rows={5}
            aria-label={`Message to ${studentName}`}
            className="w-full text-[13px] px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none resize-y leading-relaxed"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Edit freely — what you send is what goes, not the template.
          </p>

          {prepared.assets.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {prepared.assets.map(a => {
                const Icon = ICONS[a.type] ?? FileText;
                const off = excluded.has(a.key);
                return (
                  <li key={a.key}>
                    <button
                      onClick={() => setExcluded(prev => {
                        const next = new Set(prev);
                        if (next.has(a.key)) next.delete(a.key);
                        else next.add(a.key);
                        return next;
                      })}
                      aria-pressed={!off}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl border text-left transition-opacity ${
                        off ? 'opacity-40 border-gray-200' : 'border-gray-200 bg-white'}`}
                    >
                      <span className={`w-7 h-5 rounded text-[8px] font-bold text-white flex items-center justify-center ${TYPE_TONE[a.type] ?? 'bg-gray-500'}`}>
                        {a.type}
                      </span>
                      <span className="flex-1 min-w-0 text-[12px] font-medium text-gray-800 truncate">{a.name}</span>
                      {a.sizeLabel && <span className="text-[10px] text-gray-400">{a.sizeLabel}</span>}
                      <Icon size={13} className="text-gray-300" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {!sent ? (
            <button onClick={openWhatsApp} disabled={!prepared.whatsappUrl}
              className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-orange-600 disabled:opacity-40 transition-colors">
              <Send size={16} /> Open in WhatsApp
            </button>
          ) : (
            <button onClick={confirmSent} disabled={sending}
              className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              {sending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              I sent it — record on the timeline
            </button>
          )}

          <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
            {included.length} attachment{included.length === 1 ? '' : 's'} plus the message.
            {' '}{prepared.note}
          </p>
        </>
      ) : null}
    </section>
  );
};

export default SendPackPanel;
