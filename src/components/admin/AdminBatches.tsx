import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarRange, Plus, Loader2, AlertCircle, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../lib/toast';
import { batchService, courseService, errorMessage } from '../../services/api';
import { can } from '../../lib/permissions';
import { BatchDTO, CourseResponseDTO, UserResponseDTO } from '../../dtos';

/**
 * Course intakes.
 *
 * The follow-up ladder tells counsellors to share the batch start date on day twelve and to
 * offer "the next batch starts on…" on day eighteen. Until these existed, both steps asked a
 * counsellor to quote a date that lived nowhere.
 */

const STATUS_TONE: Record<string, string> = {
  PLANNED: 'bg-sky-50 text-sky-700 border-sky-100',
  OPEN: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  RUNNING: 'bg-amber-50 text-amber-700 border-amber-100',
  CLOSED: 'bg-gray-100 text-gray-500 border-gray-200',
};

const STATUSES = ['PLANNED', 'OPEN', 'RUNNING', 'CLOSED'];

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const daysUntil = (iso: string) => {
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  if (isNaN(days)) return null;
  if (days < 0) return 'started';
  if (days === 0) return 'starts today';
  return `in ${days} day${days === 1 ? '' : 's'}`;
};

interface Props { currentUser?: UserResponseDTO | null; }

const AdminBatches: React.FC<Props> = ({ currentUser }) => {
  const toast = useToast();
  const [batches, setBatches] = useState<BatchDTO[]>([]);
  const [courses, setCourses] = useState<CourseResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  // Only a failure to LOAD lives here. A banner is right for that: it explains an empty
  // screen and stays put while the person decides what to do. Everything a person
  // actively did — saved, sent, deleted — is reported by a toast instead.
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    courseId: '', name: '', startDate: '', timing: '', capacity: '', status: 'PLANNED',
  });

  const canManage = can(currentUser, 'CONTENT_MANAGE');

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [b, c] = await Promise.all([batchService.list(), courseService.getAll()]);
      setBatches(b);
      setCourses(c);
      if (c.length && !form.courseId) setForm(f => ({ ...f, courseId: c[0].id }));
    } catch (err) {
      setLoadError(errorMessage(err, 'Could not load the batches.'));
    } finally {
      setLoading(false);
    }
    // form.courseId is only seeded once; depending on it would refetch on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    setSaving(true);
    try {
      await batchService.create({
        ...form,
        capacity: form.capacity ? Number(form.capacity) : undefined,
      } as Partial<BatchDTO>);
      toast.success(`${form.name} added.`);
      setForm(f => ({ ...f, name: '', startDate: '', timing: '', capacity: '' }));
      setAdding(false);
      load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not create that batch.'));
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (batch: BatchDTO, status: string) => {
    try {
      const updated = await batchService.update(batch.id, { status });
      setBatches(prev => prev.map(b => (b.id === updated.id ? updated : b)));
      toast.success(`${batch.name} is now ${status.toLowerCase()}.`);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update that batch.'));
    }
  };

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}</div>;
  }

  const field = "w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20";
  const label = "text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block";

  return (
    <div className="space-y-5">
      <AnimatePresence>
        {loadError && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            role="alert" className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium flex-1">{loadError}</p>
            <button onClick={load} className="text-sm font-semibold underline shrink-0">Retry</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h2 className="text-sm font-bold text-gray-900">Course intakes</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            The follow-up sequence quotes these dates to students, so an out-of-date batch here
            becomes a wrong promise on the phone.
          </p>
        </div>
        {canManage && (
          <button onClick={() => setAdding(a => !a)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-orange-600 transition-colors">
            <Plus size={16} /> New batch
          </button>
        )}
      </div>

      {adding && canManage && (
        <section className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-5 grid gap-3 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="b-course">Course</label>
            <select id="b-course" value={form.courseId} onChange={e => setForm({ ...form, courseId: e.target.value })} className={field}>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="b-name">Name</label>
            <input id="b-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="September morning batch" className={field} />
          </div>
          <div>
            <label className={label} htmlFor="b-start">Starts</label>
            <input id="b-start" type="date" value={form.startDate}
              onChange={e => setForm({ ...form, startDate: e.target.value })} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="b-timing">Timing</label>
            <input id="b-timing" value={form.timing} onChange={e => setForm({ ...form, timing: e.target.value })}
              placeholder="10am to 12pm, Mon to Fri" className={field} />
          </div>
          <div>
            <label className={label} htmlFor="b-cap">
              Seats <span className="normal-case font-normal">(leave empty if uncapped)</span>
            </label>
            <input id="b-cap" type="number" min={1} value={form.capacity}
              onChange={e => setForm({ ...form, capacity: e.target.value })} className={field} />
          </div>
          <div className="flex items-end">
            <button onClick={create} disabled={saving || !form.name.trim() || !form.startDate}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold disabled:opacity-40">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Add batch
            </button>
          </div>
        </section>
      )}

      {batches.length === 0 ? (
        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-12 text-center">
          <CalendarRange size={40} className="mx-auto text-gray-200 mb-4" />
          <p className="font-bold text-gray-700">No batches yet</p>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            The follow-up sequence tells counsellors to share the next start date. Add your
            upcoming intakes so there is a date to share.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
          {batches.map(b => (
            <div key={b.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900">{b.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {b.courseName} · {formatDate(b.startDate)}
                  <span className="text-gray-400"> · {daysUntil(b.startDate)}</span>
                  {b.timing ? ` · ${b.timing}` : ''}
                  {b.capacity ? ` · ${b.capacity} seats` : ''}
                </p>
              </div>
              {canManage ? (
                <select value={b.status} onChange={e => setStatus(b, e.target.value)}
                  aria-label={`Status for ${b.name}`}
                  className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border outline-none ${STATUS_TONE[b.status]}`}>
                  {STATUSES.map(s => <option key={s} value={s}>{s.toLowerCase()}</option>)}
                </select>
              ) : (
                <span className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border ${STATUS_TONE[b.status]}`}>
                  {b.status.toLowerCase()}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBatches;
