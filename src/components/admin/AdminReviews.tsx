import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Loader2, AlertCircle, Trash2, Pencil, X, Save, Star, Globe, EyeOff, Video,
} from 'lucide-react';
import { reviewService, assetService, errorMessage, backendUrl } from '../../services/api';
import { useToast } from '../../lib/toast';
import { can } from '../../lib/permissions';
import { resolveImageUrl, uploadImageToCDN, MAX_IMAGE_SIZE_BYTES, MAX_IMAGE_SIZE_MB } from '../../utils/imageUtils';
import { ReviewDTO, AssetDTO, UserResponseDTO } from '../../dtos';
import SearchBar from './SearchBar';
import SectionIntro from './SectionIntro';

/**
 * Student reviews, as the office collects them.
 *
 * <p>They arrive by WhatsApp: a paragraph, sometimes a selfie, occasionally a video. Before this
 * screen the only thing the website could show was a video marked in the Media Library — no name,
 * no photograph, and nowhere for the words, which is most of what students actually send.</p>
 *
 * <p>Nothing is published on save. The gap between receiving a review and showing it is where
 * the spelling gets checked and the student gets asked whether their face may go on a public
 * page, and a toggle that defaults to on removes that gap without anybody deciding to.</p>
 */

interface Props { currentUser?: UserResponseDTO | null; }

const EMPTY = {
  studentName: '', courseName: '', reviewText: '',
  imageUrl: '', videoUrl: '', rating: '', sortOrder: '0',
};

const AdminReviews: React.FC<Props> = ({ currentUser }) => {
  const toast = useToast();
  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const [videos, setVideos] = useState<AssetDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ ...EMPTY });

  const mayEdit = can(currentUser, 'CONTENT_MANAGE');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setReviews(await reviewService.list());
    } catch (e) {
      setLoadError(errorMessage(e, 'The reviews could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    // Videos already uploaded to the Media Library, so a review can point at one rather than
    // making somebody upload the same file twice.
    assetService.list()
      .then(all => setVideos(all.filter(a => a.type === 'VIDEO')))
      .catch(() => { /* a review can still carry a pasted link */ });
  }, []);

  const open = (review?: ReviewDTO) => {
    if (review) {
      setEditing(review.id);
      setForm({
        studentName: review.studentName ?? '',
        courseName: review.courseName ?? '',
        reviewText: review.reviewText ?? '',
        imageUrl: review.imageUrl ?? '',
        videoUrl: review.videoUrl ?? '',
        rating: review.rating ? String(review.rating) : '',
        sortOrder: String(review.sortOrder ?? 0),
      });
    } else {
      setEditing(null);
      setForm({ ...EMPTY });
    }
    setAdding(true);
  };

  const close = () => { setAdding(false); setEditing(null); setForm({ ...EMPTY }); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.reviewText.trim() && !form.videoUrl.trim()) {
      toast.error('Add what the student said, or a video of them saying it.',
        'A card with only a name gives nobody a reason to read it.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        studentName: form.studentName.trim(),
        courseName: form.courseName.trim(),
        reviewText: form.reviewText.trim(),
        imageUrl: form.imageUrl.trim(),
        videoUrl: form.videoUrl.trim(),
        rating: form.rating ? Number(form.rating) : undefined,
        sortOrder: Number(form.sortOrder) || 0,
      };

      if (editing) {
        await reviewService.update(editing, payload);
        toast.success(`${payload.studentName}'s review was updated.`);
      } else {
        await reviewService.create(payload);
        toast.success(`${payload.studentName}'s review was added.`,
          'It is not on the website yet — publish it when you are ready.');
      }
      close();
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'That review could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (review: ReviewDTO) => {
    try {
      const updated = await reviewService.update(review.id, { published: !review.published });
      toast.success(updated.published
        ? `${review.studentName}'s review is now on the website.`
        : `${review.studentName}'s review was taken off the website.`,
        updated.published ? 'Visitors can read it straight away.' : undefined);
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'That could not be changed.'));
    }
  };

  const remove = async (review: ReviewDTO) => {
    if (!window.confirm(`Delete ${review.studentName}'s review? This cannot be undone.`)) return;
    try {
      await reviewService.remove(review.id);
      toast.success(`${review.studentName}'s review was deleted.`);
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'That could not be deleted.'));
    }
  };

  const pickPhoto = async (file: File) => {
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error(`That photo is larger than ${MAX_IMAGE_SIZE_MB} MB.`, 'Nothing was uploaded.');
      return;
    }
    setUploading(true);
    try {
      const cdnUrl = await uploadImageToCDN(file, 'placed-students', backendUrl);
      setForm(f => ({ ...f, imageUrl: cdnUrl }));
      toast.success('Photo uploaded.');
    } catch (err) {
      toast.error(errorMessage(err, 'That photo could not be uploaded.'));
    } finally {
      setUploading(false);
    }
  };

  const term = search.trim().toLowerCase();
  const shown = term
    ? reviews.filter(r => [r.studentName, r.courseName, r.reviewText]
        .some(field => field?.toLowerCase().includes(term)))
    : reviews;

  const field = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none';
  const label = 'block text-[11px] font-semibold text-gray-500 mb-1';

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

      <SectionIntro
        screen="AdminReviews"
        purpose="What students said about the course — the words, a photograph and a video, shown on the public Reviews page."
        steps={[
          "Add a review with the student's name and either what they wrote, a video, or both.",
          "A photograph and a rating are optional; a review with neither still reads well.",
          "Nothing appears on the website until you press the globe. That is where the spelling gets checked and the student gets asked whether their face may be shown.",
          "Order decides which review leads on the page. Lower numbers come first.",
        ]}
      />

      <div className="flex items-center gap-3 flex-wrap">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search reviews by student, course or what they wrote"
          count={`${shown.length} of ${reviews.length}`}
        />
        {mayEdit && (
          <button onClick={() => open()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-orange-600 transition-colors shrink-0">
            <Plus size={16} /> Add a review
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading the reviews…
        </div>
      ) : shown.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center">
          <Star className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            {reviews.length === 0 ? 'No reviews yet.' : 'No review matches that.'}
          </p>
          {reviews.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">
              When a student sends one on WhatsApp, add it here.
            </p>
          )}
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {shown.map(review => (
            <li key={review.id}
              className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-3">
              {review.imageUrl ? (
                <img src={resolveImageUrl(review.imageUrl, 120)} alt=""
                  loading="lazy" decoding="async"
                  className="w-12 h-12 rounded-full object-cover shrink-0" />
              ) : (
                <span className="w-12 h-12 rounded-full bg-orange-50 text-primary font-bold
                  grid place-items-center shrink-0">
                  {review.studentName.charAt(0).toUpperCase()}
                </span>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-gray-900 truncate">{review.studentName}</p>
                    <p className="text-[11px] text-gray-400 truncate">
                      {review.courseName || 'No course noted'}
                    </p>
                  </div>
                  {review.published ? (
                    <span title="Showing on the website"
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700
                        bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md shrink-0">
                      <Globe className="w-3 h-3" /> live
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-gray-400 shrink-0">draft</span>
                  )}
                </div>

                {review.rating != null && (
                  <p className="text-[11px] text-amber-600 mt-0.5" aria-label={`${review.rating} out of 5`}>
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </p>
                )}

                {review.reviewText && (
                  <p className="text-xs text-gray-600 mt-1.5 line-clamp-3">
                    &ldquo;{review.reviewText}&rdquo;
                  </p>
                )}

                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {review.videoUrl && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-violet-700
                      bg-violet-50 border border-violet-100 px-1.5 py-0.5 rounded-md">
                      <Video className="w-3 h-3" /> video
                    </span>
                  )}
                  {mayEdit && (
                    <>
                      <button onClick={() => togglePublished(review)}
                        title={review.published ? 'Take off the website' : 'Show on the website'}
                        className={`p-1 ${review.published
                          ? 'text-emerald-600 hover:text-emerald-800'
                          : 'text-gray-300 hover:text-emerald-600'}`}
                        aria-label={review.published
                          ? `Take ${review.studentName}'s review off the website`
                          : `Publish ${review.studentName}'s review`}>
                        {review.published ? <Globe className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button onClick={() => open(review)}
                        className="p-1 text-gray-300 hover:text-primary"
                        aria-label={`Edit ${review.studentName}'s review`}>
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => remove(review)}
                        className="p-1 text-gray-300 hover:text-red-500"
                        aria-label={`Delete ${review.studentName}'s review`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">

              <header className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
                <Star size={18} className="text-primary" />
                <h3 className="text-base font-bold text-gray-900 flex-1">
                  {editing ? 'Edit review' : 'Add a review'}
                </h3>
                <button onClick={close} aria-label="Close" className="text-gray-400 hover:text-gray-700">
                  <X size={18} />
                </button>
              </header>

              <form onSubmit={submit} className="p-5 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={label} htmlFor="rv-name">Student name</label>
                    <input id="rv-name" required autoFocus value={form.studentName}
                      onChange={e => setForm({ ...form, studentName: e.target.value })}
                      placeholder="Priya Deshmukh" className={field} />
                  </div>
                  <div>
                    <label className={label} htmlFor="rv-course">Course</label>
                    <input id="rv-course" value={form.courseName}
                      onChange={e => setForm({ ...form, courseName: e.target.value })}
                      placeholder="Data Analytics with Gen AI" className={field} />
                  </div>
                </div>

                <div>
                  <label className={label} htmlFor="rv-text">What they said</label>
                  <textarea id="rv-text" rows={4} value={form.reviewText}
                    onChange={e => setForm({ ...form, reviewText: e.target.value })}
                    placeholder="Paste what the student sent on WhatsApp."
                    className={`${field} resize-y`} />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Words or a video — a review needs at least one of them.
                  </p>
                </div>

                <div>
                  <label className={label} htmlFor="rv-photo">Photo <span className="font-normal text-gray-400">optional</span></label>
                  <div className="flex items-center gap-3">
                    {form.imageUrl && (
                      <img src={resolveImageUrl(form.imageUrl, 120)} alt=""
                        className="w-12 h-12 rounded-full object-cover shrink-0" />
                    )}
                    <input id="rv-photo" type="file" accept="image/*" disabled={uploading}
                      onChange={e => { const f = e.target.files?.[0]; if (f) pickPhoto(f); }}
                      className="w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3
                        file:rounded-lg file:border file:border-gray-200 file:text-xs file:bg-gray-50" />
                    {uploading && <Loader2 size={16} className="animate-spin text-gray-400 shrink-0" />}
                  </div>
                </div>

                <div>
                  <label className={label} htmlFor="rv-video">Video <span className="font-normal text-gray-400">optional</span></label>
                  {videos.length > 0 && (
                    <select
                      aria-label="Choose a video from the Media Library"
                      value={videos.some(v => `/api/assets/${v.id}/download` === form.videoUrl)
                        ? form.videoUrl : ''}
                      onChange={e => setForm({ ...form, videoUrl: e.target.value })}
                      className={`${field} bg-white mb-2`}>
                      <option value="">Choose from the Media Library…</option>
                      {videos.map(v => (
                        <option key={v.id} value={`/api/assets/${v.id}/download`}>
                          {v.name}{v.sizeLabel ? ` · ${v.sizeLabel}` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  <input id="rv-video" value={form.videoUrl}
                    onChange={e => setForm({ ...form, videoUrl: e.target.value })}
                    placeholder="…or paste a YouTube or Drive link" className={field} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={label} htmlFor="rv-rating">Rating <span className="font-normal text-gray-400">optional</span></label>
                    <select id="rv-rating" value={form.rating}
                      onChange={e => setForm({ ...form, rating: e.target.value })}
                      className={`${field} bg-white`}>
                      <option value="">Not rated</option>
                      {[5, 4, 3, 2, 1].map(n => (
                        <option key={n} value={n}>{'★'.repeat(n)} {n} of 5</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={label} htmlFor="rv-order">Order on the page</label>
                    <input id="rv-order" type="number" value={form.sortOrder}
                      onChange={e => setForm({ ...form, sortOrder: e.target.value })}
                      className={field} />
                    <p className="text-[11px] text-gray-400 mt-1">Lower comes first.</p>
                  </div>
                </div>

                <button type="submit" disabled={saving || uploading}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl
                    bg-gray-900 text-white text-sm font-bold hover:bg-black disabled:opacity-50">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {editing ? 'Save changes' : 'Add review'}
                </button>

                {!editing && (
                  <p className="text-[11px] text-gray-400 text-center">
                    Saved as a draft. Press the globe on the card to put it on the website.
                  </p>
                )}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminReviews;
