import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, CheckCircle2, Clock, AlertTriangle, FileText, Video, Link2, Image, Zap } from 'lucide-react';
import SwipeToSend from './SwipeToSend';
import { leadService, assetService, errorMessage } from '../../services/api';
import { SendPackSummaryDTO, PreparedPackDTO, AssetDTO } from '../../dtos';

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
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);

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
      setAwaitingConfirm(false);
    } catch (err) {
      onError(errorMessage(err, 'Could not prepare that message.'));
    } finally {
      setLoading(false);
    }
  }, [leadId, onError]);

  useEffect(() => { if (selected) prepare(selected); }, [selected, prepare]);

  // Anything else from the media library the counsellor chooses to add. A pack names sensible
  // defaults for its situation, but somebody on a call learns things a template cannot know —
  // that this student wants the placement record rather than the syllabus.
  const [library, setLibrary] = useState<AssetDTO[]>([]);
  const [extra, setExtra] = useState<Set<string>>(new Set());
  const [showLibrary, setShowLibrary] = useState(false);

  useEffect(() => {
    let live = true;
    assetService.list().then(a => live && setLibrary(a)).catch(() => { /* the pack still sends */ });
    return () => { live = false; };
  }, []);

  const packAssets = (prepared?.assets ?? []).filter(a => !excluded.has(a.key));
  const extraAssets = library.filter(a => extra.has(a.key) && !packAssets.some(p => p.key === a.key));
  const included = [...packAssets, ...extraAssets.map(a => ({
    key: a.key, name: a.name, type: a.type, url: a.url, sizeLabel: a.sizeLabel, tracked: a.tracked,
  }))];

  /**
   * One swipe sends it. With a provider configured the message goes straight to the student;
   * without one the server returns a hand-off link, WhatsApp opens with the message ready, and
   * nothing is written to the timeline until the counsellor confirms they actually sent it.
   */
  const swipeToSend = async () => {
    if (!prepared) return;
    setSending(true);
    try {
      const outcome = await leadService.sendPack(
        leadId, prepared.packKey, message, included.map(a => a.key));

      if (outcome.sent) {
        setSent(true);
        onSent();
      } else if (outcome.handoffUrl) {
        const phoneUrl = outcome.handoffUrl.split('?text=')[0];
        window.open(`${phoneUrl}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
        setAwaitingConfirm(true);
      } else {
        onError(outcome.detail);
      }
    } catch (err) {
      onError(errorMessage(err, 'Could not send that message.'));
    } finally {
      setSending(false);
    }
  };

  const confirmSent = async () => {
    if (!prepared) return;
    setSending(true);
    try {
      await leadService.recordPackSent(leadId, prepared.packKey, included.map(a => a.key));
      setSent(true);
      setAwaitingConfirm(false);
      onSent();
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

          {library.length > 0 && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowLibrary(v => !v)}
                className="text-xs font-semibold text-gray-500 hover:text-gray-800 inline-flex items-center gap-1">
                {showLibrary ? 'Hide' : 'Add something else'}
                {extraAssets.length > 0 && (
                  <span className="ml-1 text-[11px] bg-gray-900 text-white rounded-full px-1.5">
                    {extraAssets.length}
                  </span>
                )}
              </button>

              {showLibrary && (
                <ul className="mt-2 space-y-1 max-h-56 overflow-y-auto pr-1">
                  {library.map(a => {
                    const inPack = packAssets.some(p => p.key === a.key);
                    return (
                      <li key={a.id}>
                        <label className={`flex items-center gap-2 text-sm px-2 py-1.5 rounded-lg ${
                          inPack ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-50 cursor-pointer'}`}>
                          <input
                            type="checkbox"
                            disabled={inPack}
                            checked={inPack || extra.has(a.key)}
                            onChange={e => {
                              const next = new Set(extra);
                              if (e.target.checked) next.add(a.key); else next.delete(a.key);
                              setExtra(next);
                            }}
                            className="rounded border-gray-300" />
                          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 w-10 shrink-0">
                            {a.type}
                          </span>
                          <span className="truncate flex-1">{a.name}</span>
                          {inPack && <span className="text-[11px] shrink-0">already included</span>}
                          {a.sizeLabel && !inPack && (
                            <span className="text-[11px] text-gray-400 shrink-0">{a.sizeLabel}</span>
                          )}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

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

          <div className="mt-3">
            {awaitingConfirm ? (
              <button onClick={confirmSent} disabled={sending}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                {sending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                I sent it — record on the timeline
              </button>
            ) : (
              <SwipeToSend
                label={`Swipe to send ${included.length + 1} message${included.length ? 's' : ''}`}
                sendingLabel="Sending to the student…"
                doneLabel={`Sent to ${studentName.split(' ')[0]}`}
                sending={sending}
                done={sent}
                onSend={swipeToSend}
              />
            )}
          </div>

          <p className="text-[11px] text-gray-400 mt-2 leading-relaxed flex items-start gap-1.5">
            {prepared.sendsAutomatically && <Zap size={12} className="mt-0.5 flex-shrink-0 text-emerald-600" />}
            <span>
              {prepared.note}
              {prepared.sendsAutomatically
                ? ` Sent through ${prepared.channel}, one student at a time — nothing goes out on its own.`
                : ' WhatsApp opens with the message ready; confirm once you have sent it.'}
            </span>
          </p>
        </>
      ) : null}
    </section>
  );
};

export default SendPackPanel;
