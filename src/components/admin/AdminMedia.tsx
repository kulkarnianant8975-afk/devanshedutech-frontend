import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText, Video, Link2, Image as ImageIcon, Plus, Upload, Trash2, Loader2,
  AlertCircle, CheckCircle2, Eye, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { assetService, courseService, errorMessage } from '../../services/api';
import { can } from '../../lib/permissions';
import { AssetDTO, CourseResponseDTO, UserResponseDTO } from '../../dtos';

/**
 * The media library.
 *
 * Everything a counsellor can attach to a message lives here: syllabuses, fee sheets, project
 * videos, booking links. Adding one used to mean a deployment, which is the wrong shape for the
 * material that changes most often — a syllabus is revised, a batch video is recorded, a form
 * moves. When adding a file is hard, people paste links into the message text instead, where
 * nothing can track or verify them.
 */

type Kind = 'PDF' | 'VIDEO' | 'LINK' | 'IMAGE';

/**
 * WhatsApp's own limits, shown before the upload rather than discovered after it.
 *
 * Meta refuses anything larger outright, so a bigger file could be stored and never sent — and
 * the moment to learn that is not while a student is waiting for it.
 */
const UPLOAD: Record<string, { accept: string; limit: string; note: string }> = {
  PDF:   { accept: 'application/pdf', limit: '100 MB',
           note: 'PDF, up to 100 MB.' },
  VIDEO: { accept: 'video/mp4,video/3gpp', limit: '16 MB',
           note: 'MP4, up to 16 MB — about a minute of 720p. WhatsApp refuses anything larger, so put a longer film on YouTube and add the link instead.' },
  IMAGE: { accept: 'image/jpeg,image/png', limit: '5 MB',
           note: 'JPG or PNG, up to 5 MB.' },
};

const KINDS: { type: Kind; label: string; icon: typeof FileText; hint: string }[] = [
  { type: 'PDF',   label: 'Documents', icon: FileText,  hint: 'Syllabus, fee sheet, brochure' },
  { type: 'VIDEO', label: 'Videos',    icon: Video,     hint: 'Upload an MP4 up to 16 MB, or add a link for anything longer' },
  { type: 'LINK',  label: 'Links',     icon: Link2,     hint: 'Booking forms, the courses page, a map' },
  { type: 'IMAGE', label: 'Images',    icon: ImageIcon, hint: 'Posters and batch photos, up to 5 MB' },
];

const ICONS: Record<string, typeof FileText> = {
  PDF: FileText, VIDEO: Video, LINK: Link2, IMAGE: ImageIcon,
};

const TONE: Record<string, string> = {
  PDF:   'bg-rose-50 text-rose-600 border-rose-100',
  VIDEO: 'bg-violet-50 text-violet-600 border-violet-100',
  LINK:  'bg-sky-50 text-sky-600 border-sky-100',
  IMAGE: 'bg-amber-50 text-amber-600 border-amber-100',
};

interface Props { currentUser?: UserResponseDTO | null; }

const AdminMedia: React.FC<Props> = ({ currentUser }) => {
  const [assets, setAssets] = useState<AssetDTO[]>([]);
  const [courses, setCourses] = useState<CourseResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showRetired, setShowRetired] = useState(false);
  const [adding, setAdding] = useState<Kind | null>(null);

  const [form, setForm] = useState({ name: '', url: '', courseId: '' });
  // Video and image can be either; a document is always a file and a link is always a link.
  const [mode, setMode] = useState<'upload' | 'link'>('upload');
  const fileRef = useRef<HTMLInputElement>(null);

  const mayEdit = can(currentUser, 'SETTINGS_MANAGE');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, courseList] = await Promise.all([
        assetService.list(showRetired),
        courseService.getAll().catch(() => [] as CourseResponseDTO[]),
      ]);
      setAssets(list);
      setCourses(courseList);
    } catch (e) {
      setError(errorMessage(e, 'Could not load the library.'));
    } finally {
      setLoading(false);
    }
  }, [showRetired]);

  useEffect(() => { load(); }, [load]);

  const flash = (msg: string) => {
    setSuccess(msg);
    window.setTimeout(() => setSuccess(null), 3500);
  };

  const reset = () => {
    setForm({ name: '', url: '', courseId: '' });
    setMode('upload');
    setAdding(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const add = async () => {
    if (!adding) return;
    setBusy(true);
    setError(null);
    try {
      const file = fileRef.current?.files?.[0];
      const uploading = adding !== 'LINK' && mode === 'upload';
      if (uploading) {
        if (!file) { setError('Choose a file first.'); setBusy(false); return; }
        const created = await assetService.upload(file, form.name || file.name, adding, form.courseId || undefined);
        flash(`Uploaded ${created.name} (${created.sizeLabel ?? ''}).`);
      } else {
        const created = await assetService.create({
          name: form.name,
          type: adding,
          url: form.url,
          courseId: form.courseId || undefined,
        });
        flash(`Added ${created.name}.`);
      }
      reset();
      await load();
    } catch (e) {
      setError(errorMessage(e, 'That could not be saved.'));
    } finally {
      setBusy(false);
    }
  };

  const retire = async (asset: AssetDTO) => {
    setError(null);
    try {
      await assetService.retire(asset.id);
      flash(`${asset.name} is no longer offered.`);
      await load();
    } catch (e) {
      setError(errorMessage(e, 'That could not be retired.'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading the library…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            role="alert"
            className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} aria-label="Dismiss"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" /><span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <p className="text-sm text-gray-500 max-w-xl">
          Everything a counsellor can attach to a WhatsApp message. Anything added here appears in
          the send panel immediately — no deployment, no waiting.
        </p>
        <label className="flex items-center gap-1.5 text-xs text-gray-500 shrink-0">
          <input type="checkbox" checked={showRetired}
            onChange={e => setShowRetired(e.target.checked)}
            className="rounded border-gray-300" />
          Show retired
        </label>
      </div>

      {KINDS.map(({ type, label, icon: Icon, hint }) => {
        const items = assets.filter(a => a.type === type);
        return (
          <section key={type} className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <header className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Icon className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900 flex-1">{label}</h3>
              <span className="text-xs text-gray-400">{items.length}</span>
              {mayEdit && (
                <button
                  onClick={() => { reset(); setAdding(type); }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              )}
            </header>

            <div className="p-4">
              <p className="text-xs text-gray-400 mb-3">{hint}</p>

              {items.length === 0 ? (
                <p className="text-sm text-gray-400">Nothing here yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {items.map(a => {
                    const RowIcon = ICONS[a.type] ?? Link2;
                    const course = courses.find(c => c.id === a.courseId);
                    return (
                      <li key={a.id}
                        className={`flex items-center gap-3 py-2 px-3 rounded-xl border ${
                          a.active === false ? 'border-gray-100 bg-gray-50 opacity-60' : 'border-gray-100'}`}>
                        <span className={`w-7 h-7 rounded-lg grid place-items-center border shrink-0 ${TONE[a.type]}`}>
                          <RowIcon className="w-3.5 h-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-gray-800 truncate">{a.name}</span>
                          <span className="block text-xs text-gray-400 truncate">
                            {a.sizeLabel && <>{a.sizeLabel} · </>}
                            {course ? <>{course.name} · </> : null}
                            {a.url}
                          </span>
                        </span>
                        {a.tracked && (
                          <span title="Opening this is recorded against the lead"
                            className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md shrink-0">
                            <Eye className="w-3 h-3" /> tracked
                          </span>
                        )}
                        {a.active === false && (
                          <span className="text-[11px] text-gray-400 shrink-0">retired</span>
                        )}
                        {mayEdit && a.active !== false && (
                          <button onClick={() => retire(a)}
                            className="p-1 text-gray-300 hover:text-red-500 shrink-0"
                            aria-label={`Retire ${a.name}`}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        );
      })}

      {/* Adding, as a sheet rather than a separate page — the library stays visible behind it. */}
      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={reset}>
            <motion.div
              initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-md p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-base font-bold text-gray-900 flex-1">
                  Add {KINDS.find(k => k.type === adding)?.label.replace(/s$/, '')}
                </h3>
                <button onClick={reset} aria-label="Close" className="text-gray-400 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label htmlFor="am-name" className="block text-xs font-semibold text-gray-500 mb-1">
                    What a counsellor will see
                  </label>
                  <input id="am-name" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder={adding === 'VIDEO' ? 'Placement stories 2026' : 'Data Analytics — syllabus and fees'}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl" />
                </div>

                {adding !== 'LINK' && adding !== 'PDF' && (
                  <div className="flex gap-1 p-0.5 bg-gray-100 rounded-xl">
                    {(['upload', 'link'] as const).map(m => (
                      <button key={m} type="button" onClick={() => setMode(m)}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg ${
                          mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                        {m === 'upload' ? 'Upload a file' : 'Use a link'}
                      </button>
                    ))}
                  </div>
                )}

                {adding !== 'LINK' && (adding === 'PDF' || mode === 'upload') ? (
                  <div>
                    <label htmlFor="am-file" className="block text-xs font-semibold text-gray-500 mb-1">
                      The file
                    </label>
                    <input id="am-file" ref={fileRef} type="file" accept={UPLOAD[adding].accept}
                      className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-gray-200 file:text-sm file:bg-gray-50" />
                    <p className="text-[11px] text-gray-400 mt-1">{UPLOAD[adding].note}</p>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="am-url" className="block text-xs font-semibold text-gray-500 mb-1">
                      Link
                    </label>
                    <input id="am-url" value={form.url}
                      onChange={e => setForm({ ...form, url: e.target.value })}
                      placeholder="https://…"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl" />
                  </div>
                )}

                <div>
                  <label htmlFor="am-course" className="block text-xs font-semibold text-gray-500 mb-1">
                    For one course only <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <select id="am-course" value={form.courseId}
                    onChange={e => setForm({ ...form, courseId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white">
                    <option value="">Any course</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <button onClick={add} disabled={busy}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 disabled:opacity-50">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" />
                        : (adding !== 'LINK' && (adding === 'PDF' || mode === 'upload'))
                          ? <Upload className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {(adding !== 'LINK' && (adding === 'PDF' || mode === 'upload')) ? 'Upload' : 'Add'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminMedia;
