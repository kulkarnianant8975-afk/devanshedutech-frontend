import React, { useState } from 'react';
import { UserPlus, Loader2, X, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { leadService, errorMessage } from '../../services/api';
import { LeadOptionsDTO } from '../../dtos';

/**
 * A lead a counsellor enters by hand.
 *
 * Someone walks in, or phones, or leaves their name at a college seminar. Until this existed
 * those enquiries lived in a notebook or a phone's contacts — outside the pipeline, so nothing
 * chased them and nothing counted them. The follow-up rules only protect students the CRM knows
 * about.
 *
 * Deliberately short. It is filled in with a student standing there, so it asks for the two
 * things needed to ring them back and treats everything else as optional. A counsellor can add
 * the rest from the lead itself once the conversation is over.
 */

interface Props {
  options: LeadOptionsDTO | null;
  onClose: () => void;
  onCreated: (leadId: string, duplicate: boolean, message: string) => void;
}

const AddLeadModal: React.FC<Props> = ({ options, onClose, onCreated }) => {
  const [form, setForm] = useState({
    fullName: '', mobileNumber: '', courseInterested: '',
    cityName: '', education: '', source: 'WALK_IN', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const result = await leadService.createManual({
        fullName: form.fullName,
        mobileNumber: form.mobileNumber,
        courseInterested: form.courseInterested || undefined,
        cityName: form.cityName || undefined,
        education: form.education || undefined,
        source: form.source,
        notes: form.notes || undefined,
      });
      onCreated(result.id, result.duplicate, result.message);
    } catch (err) {
      setError(errorMessage(err, 'That could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  const field = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none';

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}>
      <motion.div
        initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">

        <header className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <UserPlus size={18} className="text-primary" />
          <h3 className="text-base font-bold text-gray-900 flex-1">Add a student</h3>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </header>

        <form onSubmit={submit} className="p-5 space-y-3">
          {error && (
            <p className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /> <span>{error}</span>
            </p>
          )}

          <div>
            <label htmlFor="al-name" className="block text-xs font-semibold text-gray-500 mb-1">
              Name
            </label>
            <input id="al-name" required autoFocus value={form.fullName}
              onChange={e => setForm({ ...form, fullName: e.target.value })}
              placeholder="Rohit Deshmukh" className={field} />
          </div>

          <div>
            <label htmlFor="al-phone" className="block text-xs font-semibold text-gray-500 mb-1">
              Mobile number
            </label>
            <input id="al-phone" required type="tel" inputMode="numeric" value={form.mobileNumber}
              onChange={e => setForm({ ...form, mobileNumber: e.target.value })}
              placeholder="98765 43210" className={field} />
            <p className="text-[11px] text-gray-400 mt-1">
              If this number is already in the pipeline, their existing record opens instead of a
              second one being created.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="al-source" className="block text-xs font-semibold text-gray-500 mb-1">
                How they reached us
              </label>
              <select id="al-source" value={form.source}
                onChange={e => setForm({ ...form, source: e.target.value })}
                className={`${field} bg-white`}>
                {(options?.sources ?? [
                  { value: 'WALK_IN', label: 'Walk-in' },
                  { value: 'PHONE_CALL', label: 'Phone call' },
                ]).map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="al-city" className="block text-xs font-semibold text-gray-500 mb-1">
                City <span className="font-normal text-gray-400">optional</span>
              </label>
              <input id="al-city" value={form.cityName}
                onChange={e => setForm({ ...form, cityName: e.target.value })}
                placeholder="Parbhani" className={field} />
            </div>
          </div>

          <div>
            <label htmlFor="al-course" className="block text-xs font-semibold text-gray-500 mb-1">
              Course they asked about <span className="font-normal text-gray-400">optional</span>
            </label>
            <input id="al-course" value={form.courseInterested}
              onChange={e => setForm({ ...form, courseInterested: e.target.value })}
              placeholder="Data Analytics" className={field} />
          </div>

          <div>
            <label htmlFor="al-education" className="block text-xs font-semibold text-gray-500 mb-1">
              What they are studying <span className="font-normal text-gray-400">optional</span>
            </label>
            <input id="al-education" value={form.education}
              onChange={e => setForm({ ...form, education: e.target.value })}
              placeholder="Final year BCA" className={field} />
          </div>

          <div>
            <label htmlFor="al-notes" className="block text-xs font-semibold text-gray-500 mb-1">
              What they said <span className="font-normal text-gray-400">optional</span>
            </label>
            <textarea id="al-notes" rows={2} value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Wants evening batches, parents deciding"
              className={`${field} resize-y`} />
          </div>

          <button type="submit" disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-orange-600 disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            Add to my day
          </button>

          <p className="text-[11px] text-gray-400 text-center">
            It becomes yours, with today&rsquo;s follow-up booked. Grade it once you have spoken.
          </p>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default AddLeadModal;
