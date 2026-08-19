import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquareText, Loader2, AlertCircle, X, CheckCircle2, Save, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { leadService, errorMessage } from '../../services/api';
import { EditablePackDTO, AssetSummaryDTO, UserResponseDTO } from '../../dtos';

/**
 * Editing what gets sent to students.
 *
 * These are the SOP's own words, and they were written for this institute — but a phrase that
 * works in Parbhani is not necessarily the one typed here, and changing it should not require a
 * deployment.
 *
 * The preview matters more than it looks. A placeholder is invisible until it is filled in, and
 * a message that reads perfectly with {{first_name}} in it can read absurdly with a real name.
 */

const SAMPLE: Record<string, string> = {
  first_name: 'Rohit',
  full_name: 'Rohit Deshmukh',
  course: 'Data Analytics',
  city: 'Parbhani',
  counsellor: 'Sneha',
  batch: 'September morning batch, starting 6 September, 10am to 12pm',
};

const preview = (template: string) =>
  Object.entries(SAMPLE).reduce(
    (text, [key, value]) => text.replaceAll(`{{${key}}}`, value), template);

interface Props { currentUser?: UserResponseDTO | null; }

const AdminScripts: React.FC<Props> = () => {
  const [packs, setPacks] = useState<EditablePackDTO[]>([]);
  const [assets, setAssets] = useState<AssetSummaryDTO[]>([]);
  const [placeholders, setPlaceholders] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await leadService.scripts();
      setPacks(data.packs);
      setAssets(data.assets);
      setPlaceholders(data.placeholders);
      setAttachments(Object.fromEntries(data.packs.map(p => [p.key, p.assetKeys])));
    } catch (err) {
      setError(errorMessage(err, 'Could not load the message scripts.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (pack: EditablePackDTO) => {
    setSavingKey(pack.key);
    setError(null);
    try {
      const updated = await leadService.updatePack(pack.key, {
        coverTemplate: drafts[pack.key] ?? pack.coverTemplate,
        assetKeys: attachments[pack.key] ?? pack.assetKeys,
      });
      setPacks(prev => prev.map(p => (p.key === updated.key ? updated : p)));
      setDrafts(d => { const next = { ...d }; delete next[pack.key]; return next; });
      setSuccess(`"${pack.name}" saved. It applies to the next message sent.`);
      window.setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      // The server rejects an unknown placeholder with an explanation; show it as written.
      setError(errorMessage(err, 'Could not save that script.'));
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-48 bg-white rounded-[28px] animate-pulse" />)}</div>;
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
            role="status" className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 text-emerald-700 p-3.5 rounded-2xl">
            <CheckCircle2 size={18} /><p className="text-sm font-medium">{success}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex items-start gap-3">
          <MessageSquareText size={18} className="text-gray-400 mt-0.5" />
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-gray-900">Message scripts</h2>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              What counsellors send from a lead&apos;s screen. These start as the SOP&apos;s own
              wording; change them freely, and the next message sent uses the new text.
            </p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {Object.entries(placeholders).map(([key, description]) => (
                <span key={key} title={description}
                  className="text-[11px] font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                  {`{{${key}}}`}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-2">
              Anything else in double braces is refused on save — a student would receive it as
              literal text.
            </p>
          </div>
        </div>
      </div>

      {packs.map(pack => {
        const text = drafts[pack.key] ?? pack.coverTemplate;
        const chosen = attachments[pack.key] ?? pack.assetKeys;
        const changed = text !== pack.coverTemplate
          || chosen.join(',') !== pack.assetKeys.join(',');
        const showingPreview = previewing === pack.key;

        return (
          <section key={pack.key} className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
            <header className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-sm text-gray-900">{pack.name}</h3>
                {pack.situation && <p className="text-xs text-gray-500 mt-0.5">{pack.situation}</p>}
              </div>
              <button onClick={() => setPreviewing(showingPreview ? null : pack.key)}
                aria-pressed={showingPreview}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                  showingPreview ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                <Eye size={13} /> Preview
              </button>
            </header>

            <div className="p-5 space-y-3">
              {showingPreview ? (
                <div className="p-4 rounded-2xl bg-[#dcf8c6] text-[13px] text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {preview(text)}
                </div>
              ) : (
                <textarea value={text} rows={6}
                  aria-label={`Message for ${pack.name}`}
                  onChange={e => setDrafts(d => ({ ...d, [pack.key]: e.target.value }))}
                  className="w-full text-[13px] px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none resize-y leading-relaxed" />
              )}

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Attachments</p>
                <div className="flex flex-wrap gap-1.5">
                  {assets.map(a => {
                    const on = chosen.includes(a.key);
                    return (
                      <button key={a.key} aria-pressed={on}
                        onClick={() => setAttachments(prev => ({
                          ...prev,
                          [pack.key]: on ? chosen.filter(k => k !== a.key) : [...chosen, a.key],
                        }))}
                        className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors ${
                          on ? 'bg-orange-50 border-primary/40 text-primary'
                             : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'}`}>
                        {a.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {changed && (
                <button onClick={() => save(pack)} disabled={savingKey === pack.key}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-orange-600 disabled:opacity-50 transition-colors">
                  {savingKey === pack.key ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  Save changes
                </button>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default AdminScripts;
