import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { CounsellorScoreDTO } from '../../dtos';

/**
 * How each counsellor is doing, side by side.
 *
 * <p>A table rather than a chart, deliberately. Six measures per person is not something a chart
 * form answers — a grouped bar chart of caseload against calls against demos against misses is
 * six bars per counsellor that nobody reads, and the numbers themselves are what a manager acts
 * on. The one bar here is on follow-ups done, because that is the column being compared between
 * people; every other column is read for its own value.</p>
 *
 * <p>Misses are marked with an icon and a word, never colour alone.</p>
 */

interface Props {
  counsellors: CounsellorScoreDTO[];
  onPick?: (userId: string) => void;
}

const CounsellorTable: React.FC<Props> = ({ counsellors, onPick }) => {
  if (counsellors.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-8 text-center">
        No leads are assigned to anybody yet.
      </p>
    );
  }

  // Scaled against the busiest person, so the bars compare counsellors rather than measure them
  // against a target nobody set.
  const mostCalls = Math.max(1, ...counsellors.map(c => c.followUpsDone));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 pr-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Counsellor
            </th>
            <th className="text-left py-2 px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Follow-ups done
            </th>
            <th className="text-right py-2 px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Active leads
            </th>
            <th className="text-right py-2 px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Demos
            </th>
            <th className="text-right py-2 px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Enrolled
            </th>
            <th className="text-right py-2 pl-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Missed
            </th>
          </tr>
        </thead>
        <tbody>
          {counsellors.map(c => {
            const missed = c.overdueTouches + c.blankNextTouch;
            return (
              <tr
                key={c.userId}
                onClick={onPick ? () => onPick(c.userId) : undefined}
                className={`border-b border-gray-50 last:border-b-0 ${
                  onPick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
              >
                <td className="py-3 pr-3">
                  <span className="font-bold text-gray-900">{c.name}</span>
                </td>

                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums font-semibold text-gray-800 w-8 shrink-0">
                      {c.followUpsDone}
                    </span>
                    {/* Thin mark, anchored to a common baseline, rounded at the data end only. */}
                    <span className="h-1.5 bg-gray-100 rounded-full flex-1 min-w-[60px] overflow-hidden">
                      <span
                        className="block h-full bg-primary rounded-r-full"
                        style={{ width: `${Math.max(2, (c.followUpsDone / mostCalls) * 100)}%` }}
                      />
                    </span>
                  </div>
                </td>

                <td className="py-3 px-3 text-right tabular-nums text-gray-700">{c.activeLeads}</td>
                <td className="py-3 px-3 text-right tabular-nums text-gray-700">{c.demosBooked}</td>
                <td className="py-3 px-3 text-right tabular-nums font-semibold text-gray-900">
                  {c.enrolled}
                  {c.conversionRate !== null && (
                    <span className="text-[11px] font-normal text-gray-400 ml-1">
                      {c.conversionRate}%
                    </span>
                  )}
                </td>

                <td className="py-3 pl-3 text-right">
                  {missed === 0 ? (
                    <span className="text-gray-300 tabular-nums">0</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-700 font-semibold tabular-nums"
                      title={`${c.overdueTouches} overdue, ${c.blankNextTouch} with no next date`}>
                      <AlertTriangle size={12} className="shrink-0" aria-hidden="true" />
                      {missed}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="text-[11px] text-gray-400 mt-2">
        Missed counts follow-ups whose date has passed, plus active leads carrying no next date at
        all. Follow-ups done and demos are for the period above; leads and enrolments are totals.
      </p>
    </div>
  );
};

export default CounsellorTable;
