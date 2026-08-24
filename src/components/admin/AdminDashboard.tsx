import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle, Loader2, RefreshCw,
  CheckCircle2, AlertTriangle, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { leadService, errorMessage } from '../../services/api';
import DailyLeadsChart from './DailyLeadsChart';
import CounsellorTable from './CounsellorTable';
import { can } from '../../lib/permissions';
import {
  PipelineMetricsDTO, MetricDTO, FunnelStepDTO, SourcePerformanceDTO,
  WeeklyCountDTO, UserResponseDTO
} from '../../dtos';

/**
 * The manager dashboard: the six numbers the playbook asks for, plus the funnel and which
 * source actually produces admissions.
 *
 * Every figure comes from the server's single metrics calculation — nothing is computed here.
 * Two screens showing different conversion rates is how a team stops trusting both.
 *
 * The charts are deliberately single-series: these are magnitudes and headline numbers, so
 * they are stat tiles and directly-labelled bars rather than anything that needs a legend.
 * Status is shown with an icon and a word as well as a colour, so it survives colour-blindness
 * and a black-and-white print.
 */

const WEEK_OPTIONS = [4, 8, 12, 26];

const formatValue = (m: MetricDTO) => {
  if (m.value == null) return '—';
  const rounded = Number.isInteger(m.value) ? m.value : m.value.toFixed(1);
  return `${rounded}`;
};

/**
 * One number, large, with what it counts underneath.
 *
 * A stat tile rather than a chart because there is no shape to a total — and a bar chart of five
 * unrelated totals invites comparing figures that have nothing to do with each other.
 */
const Headline: React.FC<{ label: string; value: number; hint: string; tone?: 'good' }> =
  ({ label, value, hint, tone }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
    <p className={`text-2xl font-bold tabular-nums ${tone === 'good' ? 'text-emerald-700' : 'text-gray-900'}`}>
      {value.toLocaleString('en-IN')}
    </p>
    <p className="text-xs font-semibold text-gray-700 mt-0.5">{label}</p>
    <p className="text-[11px] text-gray-400">{hint}</p>
  </div>
);

const MetricTile: React.FC<{ metric: MetricDTO }> = ({ metric }) => {
  const unknown = metric.value == null;
  const status = metric.healthy;

  return (
    <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex flex-col">
      <p className="text-xs font-bold text-gray-500">{metric.label}</p>

      <div className="flex items-baseline gap-1 mt-2">
        <span className={`text-[32px] leading-none font-bold tabular-nums ${
          unknown ? 'text-gray-300' : 'text-gray-900'}`}>
          {formatValue(metric)}
        </span>
        {!unknown && metric.unit && (
          <span className="text-sm font-bold text-gray-400">{metric.unit}</span>
        )}
      </div>

      {unknown ? (
        <p className="text-xs text-gray-400 mt-2 flex-1">
          Not enough data yet{metric.sampleSize > 0 ? ` — ${metric.sampleSize} so far` : ''}.
        </p>
      ) : (
        <>
          {status != null && (
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold mt-2 ${
              status ? 'text-emerald-700' : 'text-red-600'}`}>
              {status ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
              {status ? 'On target' : 'Off target'}
            </span>
          )}
          <p className="text-xs text-gray-400 mt-2 flex-1">
            Based on {metric.sampleSize.toLocaleString('en-IN')} record
            {metric.sampleSize === 1 ? '' : 's'}
          </p>
        </>
      )}

      <p className="text-[11px] text-gray-400 mt-3 pt-3 border-t border-gray-50">
        Target: {metric.target}
      </p>
    </div>
  );
};

const Funnel: React.FC<{ steps: FunnelStepDTO[] }> = ({ steps }) => {
  // The stage losing the most leads, which is where the playbook says to look first.
  let worst: FunnelStepDTO | null = null;
  for (const s of steps) {
    if (s.dropFromPrevious == null) continue;
    if (worst == null || s.dropFromPrevious > (worst.dropFromPrevious ?? 0)) worst = s;
  }

  return (
    <section className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
      <header className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-bold text-sm text-gray-900">Admissions funnel</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          How many leads ever reached each stage, including those that later went cold.
        </p>
      </header>

      <div className="p-5 space-y-2.5">
        {steps.map(step => (
          <div key={step.stage} className="grid grid-cols-[110px_1fr_64px] items-center gap-3">
            <span className="text-xs font-bold text-gray-600 truncate">{step.label}</span>
            <div className="h-7 bg-gray-50 rounded-lg overflow-hidden">
              <div
                className="h-full bg-primary/85 rounded-lg flex items-center px-2.5 min-w-[2px] transition-all"
                style={{ width: `${Math.max(step.percentOfTotal, 0.5)}%` }}
                title={`${step.reached} leads reached ${step.label}`}
              >
                <span className="text-[11px] font-bold text-white tabular-nums">
                  {step.reached}
                </span>
              </div>
            </div>
            <span className={`text-xs text-right tabular-nums font-medium ${
              step === worst ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
              {step.dropFromPrevious == null ? '—' : `−${step.dropFromPrevious}%`}
            </span>
          </div>
        ))}
      </div>

      {worst && worst.dropFromPrevious != null && (
        <p className="mx-5 mb-5 text-xs text-gray-500 bg-gray-50 rounded-2xl p-3 leading-relaxed">
          The biggest fall is into <strong className="text-gray-700">{worst.label}</strong>, losing{' '}
          <strong className="text-gray-700">{worst.dropFromPrevious}%</strong>. Fix the weakest
          stage before anything else.
        </p>
      )}
    </section>
  );
};

const Sources: React.FC<{ sources: SourcePerformanceDTO[] }> = ({ sources }) => {
  const best = sources.reduce((max, s) => Math.max(max, s.conversionRate ?? 0), 0) || 1;

  return (
    <section className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
      <header className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-bold text-sm text-gray-900">Which source produces admissions</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Not which produces the most enquiries — which produces students.
        </p>
      </header>

      {sources.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-gray-400">
          No sources recorded yet. Enquiries captured from now on carry their channel.
        </p>
      ) : (
        <div className="p-5 space-y-3.5">
          {sources.map(s => (
            <div key={s.source}>
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="text-xs font-bold text-gray-700 flex-1 truncate">{s.label}</span>
                <span className="text-[11px] text-gray-400 tabular-nums">
                  {s.enrolled}/{s.leads}
                </span>
                <span className="text-xs font-bold text-gray-900 tabular-nums w-12 text-right">
                  {s.conversionRate == null ? '—' : `${s.conversionRate}%`}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full transition-all"
                  style={{ width: `${((s.conversionRate ?? 0) / best) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

const Weekly: React.FC<{ weeks: WeeklyCountDTO[] }> = ({ weeks }) => {
  const peak = Math.max(1, ...weeks.map(w => w.leads));
  return (
    <section className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
      <header className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-bold text-sm text-gray-900">Enquiries per week</h3>
      </header>
      <div className="p-5">
        <div className="flex items-end gap-1.5 h-28">
          {weeks.map(w => (
            <div key={w.weekStarting} className="flex-1 flex flex-col items-center gap-1.5 group">
              <span className="text-[10px] font-bold text-gray-400 tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
                {w.leads}
              </span>
              <div
                className="w-full bg-primary/80 rounded-t-lg hover:bg-primary transition-colors"
                style={{ height: `${Math.max((w.leads / peak) * 100, 2)}%` }}
                title={`${w.leads} enquiries in the week of ${new Date(w.weekStarting).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-1.5 mt-2">
          {weeks.map((w, i) => (
            <span key={w.weekStarting} className="flex-1 text-[9px] text-gray-400 text-center">
              {i === 0 || i === weeks.length - 1
                ? new Date(w.weekStarting).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                : ''}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

interface Props {
  currentUser?: UserResponseDTO | null;
}

const AdminDashboard: React.FC<Props> = ({ currentUser }) => {
  const [data, setData] = useState<PipelineMetricsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  // Only a failure to LOAD lives here. A banner is right for that: it explains an empty
  // screen and stays put while the person decides what to do. Everything a person
  // actively did — saved, sent, deleted — is reported by a toast instead.
  const [loadError, setLoadError] = useState<string | null>(null);
  const [weeks, setWeeks] = useState(8);

  const seesTeam = can(currentUser, 'REPORT_VIEW_TEAM');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setData(await leadService.pipelineMetrics(weeks));
    } catch (err) {
      setLoadError(errorMessage(err, 'Could not load the numbers. Check your connection and try again.'));
    } finally {
      setLoading(false);
    }
  }, [weeks]);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-40 bg-white rounded-[28px] animate-pulse" />)}
      </div>
    );
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

      {/* Filters sit in one row above the charts */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500 mr-1">Window</span>
        {WEEK_OPTIONS.map(w => (
          <button key={w} onClick={() => setWeeks(w)} aria-pressed={weeks === w}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
              weeks === w ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
            {w} weeks
          </button>
        ))}
        <button onClick={load} disabled={loading}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors disabled:opacity-50">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Refresh
        </button>
      </div>

      {data && (
        <>
          {/* The five counts a person opens this screen to read. Stat tiles rather than a
              chart: each is one number with no shape to it, and a bar chart of five unrelated
              totals compares things that have nothing to do with each other. */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Headline label="Total leads" value={data.totalLeads} hint="all time" />
            <Headline label="New enquiries" value={data.newLeadsInWindow} hint="this period" />
            <Headline label="Follow-ups made" value={data.followUpsInWindow} hint="this period" />
            <Headline label="Demos booked" value={data.demosBookedInWindow} hint="this period" />
            <Headline label="Enrolled" value={data.enrolmentsInWindow} hint="this period" tone="good" />
          </div>

          {data.missedFollowUps > 0 && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl p-4">
              <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-800">
                  {data.missedFollowUps} follow-up{data.missedFollowUps === 1 ? '' : 's'} overdue
                </p>
                <p className="text-xs text-red-700 mt-0.5">
                  Active students whose follow-up date has passed. Every day one waits, it gets
                  harder to restart the conversation.
                </p>
              </div>
            </div>
          )}

          <section className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-sm text-gray-900 mb-3">New enquiries per day</h3>
            <DailyLeadsChart daily={data.daily ?? []} />
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.metrics.map(m => <MetricTile key={m.key} metric={m} />)}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <Funnel steps={data.funnel} />
            <div className="space-y-4">
              <Sources sources={data.sources} />
              <Weekly weeks={data.weekly} />
            </div>
          </div>

          {seesTeam && (
            <section className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
              <header className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Users size={15} className="text-gray-400" />
                <h3 className="font-bold text-sm text-gray-900">Counsellor scorecard</h3>
                <span className="text-[11px] text-gray-400 ml-auto">{data.windowDescription}</span>
              </header>
              <div className="p-5">
                <CounsellorTable counsellors={data.counsellors} />
              </div>
            </section>
          )}

          <p className="text-xs text-gray-400 text-center">
            {data.windowDescription} · {data.totalLeads.toLocaleString('en-IN')} leads in total
          </p>
        </>
      )}
    </div>
  );
};


export default AdminDashboard;
