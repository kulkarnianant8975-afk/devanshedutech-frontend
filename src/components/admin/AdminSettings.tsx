import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, Save, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../lib/toast';
import { leadService, errorMessage } from '../../services/api';
import { LadderStepDTO, GradeName, UserResponseDTO } from '../../dtos';

/**
 * Follow-up settings.
 *
 * The day offsets are the numbers most worth adjusting once real conversion data arrives: the
 * SOP's day 3 nudge may work better on day 2 for this institute. They live in the database
 * precisely so tuning them is a settings change rather than a deployment.
 *
 * Step order is fixed and not editable. Every lead currently on a lane is sitting at a step
 * number, so reordering would move students to a different point in their sequence without
 * anybody asking for it.
 */

const LANES: { grade: GradeName; label: string; blurb: string; tone: string }[] = [
  { grade: 'HOT', label: 'Hot', tone: 'text-red-700 bg-red-50 border-red-100',
    blurb: 'Ready within about two weeks. Burns through in a week — if somebody that ready has not moved after seven days of daily contact, they were never hot.' },
  { grade: 'WARM', label: 'Warm', tone: 'text-amber-700 bg-amber-50 border-amber-100',
    blurb: "Interested but still comparing. The SOP's twenty-one day cadence." },
  { grade: 'COLD', label: 'Cold', tone: 'text-sky-700 bg-sky-50 border-sky-100',
    blurb: 'Just browsing. Announcements only, spanning a full intake cycle so a June enquiry is still on the list when results come out.' },
];

interface Props { currentUser?: UserResponseDTO | null; }

const AdminSettings: React.FC<Props> = () => {
  const toast = useToast();
  const [steps, setSteps] = useState<LadderStepDTO[]>([]);
  const [loading, setLoading] = useState(true);
  // Only a failure to LOAD lives here. A banner is right for that: it explains an empty
  // screen and stays put while the person decides what to do. Everything a person
  // actively did — saved, sent, deleted — is reported by a toast instead.
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setSteps(await leadService.ladderConfig());
    } catch (err) {
      setLoadError(errorMessage(err, 'Could not load the follow-up settings.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (step: LadderStepDTO) => {
    const dayOffset = edits[step.id];
    if (dayOffset === undefined || dayOffset === step.dayOffset) return;
    setBusyId(step.id);
    try {
      const updated = await leadService.updateLadderStep(step.id, { dayOffset });
      setSteps(prev => prev.map(s => (s.id === updated.id ? updated : s)));
      setEdits(e => { const n = { ...e }; delete n[step.id]; return n; });
      toast.success(`Step ${step.stepNo} of the ${step.grade.toLowerCase()} lane now falls on day ${dayOffset}.`);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save that change.'));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-64 bg-white rounded-[28px] animate-pulse" />)}</div>;
  }

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

      <div className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-gray-100">
        <Sliders size={18} className="text-gray-400 mt-0.5" />
        <div>
          <h2 className="text-sm font-bold text-gray-900">Follow-up timing</h2>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
            Each grade is a lane of seven steps. Work them, and a lead that has not converted by
            the end moves down a lane — Hot to Warm, Warm to Cold, Cold to closed. Changing a day
            here affects leads already in that lane from their next morning pass onward.
          </p>
        </div>
      </div>

      {LANES.map(lane => {
        const laneSteps = steps.filter(s => s.grade === lane.grade).sort((a, b) => a.stepNo - b.stepNo);
        if (laneSteps.length === 0) return null;
        return (
          <section key={lane.grade} className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
            <header className="px-5 py-4 border-b border-gray-100">
              <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-lg border ${lane.tone}`}>
                {lane.label}
              </span>
              <p className="text-xs text-gray-500 mt-2 max-w-2xl leading-relaxed">{lane.blurb}</p>
            </header>

            <div className="divide-y divide-gray-50">
              {laneSteps.map(step => {
                const pending = edits[step.id];
                const changed = pending !== undefined && pending !== step.dayOffset;
                return (
                  <div key={step.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="w-6 text-xs font-bold text-gray-300 tabular-nums">{step.stepNo}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{step.title}</p>
                      {step.action && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{step.action}</p>}
                    </div>
                    <label className="text-xs text-gray-400 flex-shrink-0" htmlFor={`day-${step.id}`}>day</label>
                    <input
                      id={`day-${step.id}`} type="number" min={0} max={365}
                      value={pending ?? step.dayOffset}
                      onChange={e => setEdits(prev => ({ ...prev, [step.id]: Number(e.target.value) }))}
                      className="w-16 text-sm font-bold text-center px-2 py-1.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none tabular-nums"
                    />
                    <button onClick={() => save(step)} disabled={!changed || busyId === step.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-white disabled:opacity-0 disabled:pointer-events-none hover:bg-orange-600 transition-all flex items-center gap-1.5">
                      {busyId === step.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <p className="text-xs text-gray-400">
        Step order is fixed. Every lead currently on a lane sits at a step number, so reordering
        would move students to a different point in their sequence without anybody asking for it.
      </p>
    </div>
  );
};

export default AdminSettings;
