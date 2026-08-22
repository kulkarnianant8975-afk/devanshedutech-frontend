import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText, Video, Link2, Image as ImageIcon, Plus, Upload, Trash2, Loader2,
  AlertCircle, Eye, X, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../lib/toast';
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
const MB = 1024 * 1024;

const UPLOAD: Record<string, { accept: string; limit: string; bytes: number; note: string }> = {
  PDF:   { accept: 'application/pdf', limit: '100 MB', bytes: 100 * MB,
           note: 'PDF, up to 100 MB.' },
  VIDEO: { accept: 'video/mp4,video/3gpp', limit: '200 MB', bytes: 200 * MB,
           note: 'MP4, up to 200 MB. Under 16 MB it arrives as a video in the chat; larger films are hosted here and sent as a link that streams — WhatsApp will not carry a bigger file inside a message.' },
  IMAGE: { accept: 'image/jpeg,image/png', limit: '5 MB', bytes: 5 * MB,
           note: 'JPG or PNG, up to 5 MB.' },
};

/** "126 MB", for telling somebody how far over they are rather than just that they are. */
const human = (bytes: number): string =>
  bytes >= MB ? `${Math.round(bytes / MB)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const KINDS: { type: Kind; label: string; icon: typeof FileText; hint: string }[] = [
  { type: 'PDF',   label: 'Documents', icon: FileText,  hint: 'Syllabus, fee sheet, brochure' },
  { type: 'VIDEO', label: 'Videos',    icon: Video,     hint: 'Up to 200 MB. Under 16 MB plays in the chat; larger ones send as a streaming link' },
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
  const toast = useToast();
  const [assets, setAssets] = useState<AssetDTO[]>([]);
  const [courses, setCourses] = useState<CourseResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  // Only a failure to LOAD lives here. A banner is right for that: it explains an empty
  // screen, and it has to still be on screen while the person decides what to do about it.
  // Everything a person actively did is reported by a toast instead.
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showRetired, setShowRetired] = useState(false);
  const [adding, setAdding] = useState<Kind | null>(null);

  const [form, setForm] = useState({ name: '', url: '', courseId: '' });
  // Video and image can be either; a document is always a file and a link is always a link.
  const [mode, setMode] = useState<'upload' | 'link'>('upload');
  const fileRef = useRef<HTMLInputElement>(null);

  const mayEdit = can(currentUser, 'SETTINGS_MANAGE');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [list, courseList] = await Promise.all([
        assetService.list(showRetired),
        courseService.getAll().catch(() => [] as CourseResponseDTO[]),
      ]);
      setAssets(list);
      setCourses(courseList);
    } catch (e) {
      setLoadError(errorMessage(e, 'Could not load the library.'));
    } finally {
      setLoading(false);
    }
  }, [showRetired]);

  useEffect(() => { load(); }, [load]);

  const reset = () => {
    setForm({ name: '', url: '', courseId: '' });
    setMode('upload');
    setAdding(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const add = async () => {
    if (!adding) return;
    setBusy(true);
    try {
      const file = fileRef.current?.files?.[0];
      const uploading = adding !== 'LINK' && mode === 'upload';
      if (uploading) {
        if (!file) {
          toast.error('Choose a file first.', 'Nothing was selected to upload.');
          setBusy(false);
          return;
        }
        // Checked here, before a single byte leaves. The server refuses an oversized file just
        // as firmly, but only after it has been sent — and on the office connection a 126 MB
        // video is minutes of waiting to be told no. The browser already knows the size.
        const cap = UPLOAD[adding];
        if (cap && file.size > cap.bytes) {
          const noun = adding === 'VIDEO' ? 'video' : adding === 'PDF' ? 'document' : 'image';
          toast.error(`That ${noun} is ${human(file.size)} — the limit is ${cap.limit}.`,
            adding === 'VIDEO'
              ? 'Nothing was uploaded. Export it smaller, or put it on YouTube or Drive and add it here as a link instead.'
              : 'Nothing was uploaded. Compress it and try again.');
          setBusy(false);
          return;
        }
        const created = await assetService.upload(file, form.name || file.name, adding, form.courseId || undefined);
        toast.success(`${created.name} is in the library.`,
          created.sizeLabel ? `Uploaded — ${created.sizeLabel}.` : 'Uploaded.');
      } else {
        const created = await assetService.create({
          name: form.name,
          type: adding,
          url: form.url,
          courseId: form.courseId || undefined,
        });
        toast.success(`${created.name} is in the library.`,
          'Counsellors can pick it from the dropdown now.');
      }
      reset();
      await load();
    } catch (e) {
      toast.error(errorMessage(e, 'That could not be saved.'));
    } finally {
      setBusy(false);
    }
  };

  const toggleWebsite = async (asset: AssetDTO) => {
    try {
      const updated = await assetService.update(asset.id, { showOnWebsite: !asset.showOnWebsite });
      toast.success(updated.showOnWebsite
        ? `${asset.name} is now on the Student Reviews page.`
        : `${asset.name} was taken off the website.`,
        updated.showOnWebsite ? 'Visitors can watch it straight away.' : undefined);
      await load();
    } catch (e) {
      toast.error(errorMessage(e, 'That could not be changed.'));
    }
  };

  const retire = async (asset: AssetDTO) => {
    try {
      await assetService.retire(asset.id);
      toast.success(`${asset.name} was retired.`, 'It no longer appears in the send dropdown.');
      await load();
    } catch (e) {
      toast.error(errorMessage(e, 'That could not be retired.'));
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
        {loadError && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            role="alert"
            className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span className="flex-1">{loadError}</span>
            <button onClick={load} className="font-semibold underline shrink-0">Retry</button>
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
                        {a.type === 'VIDEO' && a.sizeBytes != null && a.sizeBytes > 16 * 1024 * 1024 && (
                          <span title="Too large for a WhatsApp video message, so it is sent as a link that streams"
                            className="hidden sm:inline-flex items-center text-[11px] text-violet-700 bg-violet-50 border border-violet-100 px-1.5 py-0.5 rounded-md shrink-0">
                            sends as link
                          </span>
                        )}
                        {a.tracked && (
                          <span title="Opening this is recorded against the lead"
                            className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md shrink-0">
                            <Eye className="w-3 h-3" /> tracked
                          </span>
                        )}
                        {a.showOnWebsite && (
                          <span title="Playing on the Student Reviews page of the website"
                            className="hidden sm:inline-flex items-center gap-1 text-[11px] text-orange-700 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded-md shrink-0">
                            <Globe className="w-3 h-3" /> on the website
                          </span>
                        )}
                        {a.active === false && (
                          <span className="text-[11px] text-gray-400 shrink-0">retired</span>
                        )}
                        {/* Videos only. Everything else in here is a fee sheet or an internal
                            note, and neither belongs on a public page. */}
                        {mayEdit && a.active !== false && a.type === 'VIDEO' && (
                          <button onClick={() => toggleWebsite(a)}
                            title={a.showOnWebsite
                              ? 'Remove from the Student Reviews page'
                              : 'Show on the Student Reviews page'}
                            className={`p-1 shrink-0 ${a.showOnWebsite
                              ? 'text-orange-500 hover:text-orange-700'
                              : 'text-gray-300 hover:text-orange-500'}`}
                            aria-label={a.showOnWebsite
                              ? `Remove ${a.name} from the website`
                              : `Show ${a.name} on the website`}>
                            <Globe className="w-4 h-4" />
                          </button>
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
                      placeholder="https://drive.google.com/…"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl" />
                    {/* The trade-off is the whole reason to pick one over the other, and it was
                        invisible: an uploaded file is opened through this CRM, so opens can be
                        counted; a Drive or YouTube URL is opened on somebody else's server and
                        nothing here can see it. Saying so up front beats an empty opens column
                        that reads as "nobody looked". */}
                    <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
                      A Google Drive, YouTube or any other link works, and there is no size limit.
                      Opens cannot be counted for it though — only files uploaded here are opened
                      through the CRM, which is what makes tracking possible.
                    </p>
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
