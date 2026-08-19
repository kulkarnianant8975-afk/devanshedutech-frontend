import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Check, X, ClipboardCopy } from 'lucide-react';
import { assistantService, errorMessage } from '../../services/api';
import { GradeName, GradeSuggestionDTO } from '../../dtos';

/**
 * An opinion on the lead, a briefing before a call, and a draft message.
 *
 * Everything here is a suggestion the counsellor accepts, edits, or ignores. The grade is not
 * applied by pressing "suggest" — grading drives the whole follow-up ladder, and a student
 * regraded by a misreading would be contacted more or less often for reasons nobody could
 * reconstruct. So it appears with its reasoning and a button, and the counsellor decides.
 *
 * The whole panel is absent when no model is configured, rather than present and failing.
 */

type Task = 'grade' | 'summary' | 'draft';

/**
 * Defined at module level, not inside the panel. A component created during render is a new type
 * on every render, so React throws away its DOM and state each time — which for a button under
 * the pointer means losing focus and the hover state mid-click.
 */
const AskButton: React.FC<{
  what: Task;
  label: string;
  busy: Task | null;
  onRun: (what: Task) => void;
}> = ({ what, label, busy, onRun }) => (
  <button
    onClick={() => onRun(what)}
    disabled={busy !== null}
    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
  >
    {busy === what ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
    {label}
  </button>
);

interface Props {
  leadId: string;
  canEdit: boolean;
  onApplyGrade: (grade: GradeName) => void;
  onUseDraft: (text: string) => void;
}

const AssistantPanel: React.FC<Props> = ({ leadId, canEdit, onApplyGrade, onUseDraft }) => {
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [suggestion, setSuggestion] = useState<GradeSuggestionDTO | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [intent, setIntent] = useState('');

  useEffect(() => {
    let live = true;
    setSuggestion(null); setSummary(null); setDraft(null); setError(null);
    assistantService.available(leadId)
      .then(a => live && setAvailable(a))
      .catch(() => live && setAvailable(false));
    return () => { live = false; };
  }, [leadId]);

  if (!available) return null;

  const run = async (what: Task) => {
    setBusy(what);
    setError(null);
    try {
      if (what === 'grade') setSuggestion(await assistantService.suggestGrade(leadId));
      if (what === 'summary') setSummary(await assistantService.summarise(leadId));
      if (what === 'draft') setDraft(await assistantService.draft(leadId, intent || undefined));
    } catch (e) {
      setError(errorMessage(e, 'The assistant could not answer. Write it yourself for now.'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="py-5 border-b border-gray-100">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={14} className="text-gray-400" />
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex-1">
          Assistant
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <AskButton what="summary" label="Brief me" busy={busy} onRun={run} />
        {canEdit && <AskButton what="grade" label="Suggest a grade" busy={busy} onRun={run} />}
        {canEdit && <AskButton what="draft" label="Draft a message" busy={busy} onRun={run} />}
      </div>

      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

      {summary && (
        <div className="mb-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
          <p className="text-sm text-gray-700 whitespace-pre-line">{summary}</p>
        </div>
      )}

      {suggestion && (
        <div className="mb-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
          <p className="text-sm text-gray-700">
            {suggestion.grade
              ? <>Suggests <span className="font-bold">{suggestion.grade}</span>.</>
              : 'No clear grade.'}{' '}
            {suggestion.reasoning}
          </p>
          {suggestion.grade && canEdit && (
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => { onApplyGrade(suggestion.grade as GradeName); setSuggestion(null); }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-800"
              >
                <Check size={12} /> Use {suggestion.grade}
              </button>
              <button
                onClick={() => setSuggestion(null)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
              >
                <X size={12} /> Ignore
              </button>
            </div>
          )}
        </div>
      )}

      {canEdit && (
        <input
          value={intent}
          onChange={e => setIntent(e.target.value)}
          placeholder="What should the message do? e.g. confirm Saturday's demo"
          aria-label="What should the message do"
          className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none mb-2"
        />
      )}

      {draft && (
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
          <p className="text-sm text-gray-700 whitespace-pre-line mb-2">{draft}</p>
          <button
            onClick={() => onUseDraft(draft)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-800"
          >
            <ClipboardCopy size={12} /> Put it in the note
          </button>
          <p className="text-[11px] text-gray-400 mt-2">
            Read it before you send it. Anything in brackets needs filling in.
          </p>
        </div>
      )}
    </section>
  );
};

export default AssistantPanel;
