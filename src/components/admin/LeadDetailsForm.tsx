import React, { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { LeadDTO, LeadPatchDTO } from '../../dtos';

/**
 * Correcting a student's own details.
 *
 * <p>Everything else about a lead could be changed — grade, stage, course, owner, fee plan — and
 * the four things a counsellor most often gets wrong could not. A name misheard at the counter,
 * a digit dropped from a phone number, a city typed into the wrong box: all permanent, on the
 * record a student is called from.</p>
 *
 * <p>Only changed fields are sent. A form that posts everything it holds will happily overwrite a
 * field somebody else edited while this drawer sat open, and blank an optional one that was
 * simply not filled in here.</p>
 */

interface Props {
  lead: LeadDTO;
  saving?: boolean;
  onSave: (changes: LeadPatchDTO) => void | Promise<void>;
  onCancel: () => void;
}

const LeadDetailsForm: React.FC<Props> = ({ lead, saving, onSave, onCancel }) => {
  const [form, setForm] = useState({
    fullName: lead.fullName ?? '',
    mobileNumber: lead.mobileNumber ?? '',
    email: lead.email ?? '',
    cityName: lead.cityName ?? '',
    courseInterested: lead.courseInterested ?? '',
  });

  const field = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none';
  const label = 'block text-[11px] font-semibold text-gray-500 mb-1';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    // Only what actually changed. Sending the whole form would overwrite a field somebody else
    // edited while this drawer was open.
    const changes: LeadPatchDTO = {};
    if (form.fullName.trim() !== (lead.fullName ?? '')) changes.fullName = form.fullName.trim();
    if (form.mobileNumber.trim() !== (lead.mobileNumber ?? '')) changes.mobileNumber = form.mobileNumber.trim();
    if (form.email.trim() !== (lead.email ?? '')) changes.email = form.email.trim();
    if (form.cityName.trim() !== (lead.cityName ?? '')) changes.cityName = form.cityName.trim();
    if (form.courseInterested.trim() !== (lead.courseInterested ?? '')) {
      changes.courseInterested = form.courseInterested.trim();
    }

    if (Object.keys(changes).length === 0) {
      onCancel();
      return;
    }
    onSave(changes);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className={label} htmlFor="ld-name">Full name</label>
        <input id="ld-name" required value={form.fullName}
          onChange={e => setForm({ ...form, fullName: e.target.value })}
          className={field} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={label} htmlFor="ld-phone">Mobile number</label>
          <input id="ld-phone" required type="tel" inputMode="numeric" value={form.mobileNumber}
            onChange={e => setForm({ ...form, mobileNumber: e.target.value })}
            className={field} />
          <p className="text-[10px] text-gray-400 mt-1">
            If this number already belongs to another student, the change is refused rather than
            merging the two records.
          </p>
        </div>
        <div>
          <label className={label} htmlFor="ld-city">City</label>
          <input id="ld-city" value={form.cityName}
            onChange={e => setForm({ ...form, cityName: e.target.value })}
            placeholder="Parbhani" className={field} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={label} htmlFor="ld-email">Email <span className="font-normal text-gray-400">optional</span></label>
          <input id="ld-email" type="email" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            className={field} />
        </div>
        <div>
          <label className={label} htmlFor="ld-course">Course they asked about</label>
          <input id="ld-course" value={form.courseInterested}
            onChange={e => setForm({ ...form, courseInterested: e.target.value })}
            placeholder="Data Analytics" className={field} />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button type="submit" disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold disabled:opacity-50">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Save details
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-800">
          Cancel
        </button>
      </div>
    </form>
  );
};

export default LeadDetailsForm;
