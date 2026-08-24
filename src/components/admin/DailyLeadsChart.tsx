import React, { useState } from 'react';
import { DailyCountDTO } from '../../dtos';
import { LOCALE } from '../../lib/followUp';

/**
 * New enquiries per day.
 *
 * <p>One series, so no legend — the title says what the line is. An area rather than bars because
 * the question is the shape of a month, not the exact height of the 14th; bars would put
 * thirty-one competing marks on a strip this size and invite reading each one.</p>
 *
 * <p>The days with no enquiries are drawn, not skipped. A chart of only the days something
 * happened draws a busy, even line over a month that was silent for eleven days of it, which is
 * the opposite of what the reader needs to know.</p>
 */

interface Props {
  daily: DailyCountDTO[];
}

const WIDTH = 720;
const HEIGHT = 160;
const PAD = { top: 12, right: 8, bottom: 22, left: 28 };

const DailyLeadsChart: React.FC<Props> = ({ daily }) => {
  const [hover, setHover] = useState<number | null>(null);

  if (daily.length === 0) {
    return <p className="text-sm text-gray-400 py-8 text-center">No enquiries in this period.</p>;
  }

  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const peak = Math.max(1, ...daily.map(d => d.leads));

  const x = (i: number) => PAD.left + (daily.length === 1 ? plotW / 2 : (i / (daily.length - 1)) * plotW);
  const y = (n: number) => PAD.top + plotH - (n / peak) * plotH;

  const line = daily.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.leads)}`).join(' ');
  const area = `${line} L ${x(daily.length - 1)} ${PAD.top + plotH} L ${x(0)} ${PAD.top + plotH} Z`;

  const total = daily.reduce((sum, d) => sum + d.leads, 0);
  const busiest = daily.reduce((max, d) => (d.leads > max.leads ? d : max), daily[0]);
  const shown = hover !== null ? daily[hover] : null;

  const label = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' });

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 mb-1">
        <div>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">{total}</p>
          <p className="text-xs text-gray-500">
            new enquiries · busiest was {label(busiest.day)} with {busiest.leads}
          </p>
        </div>
        {shown && (
          <p className="text-xs font-semibold text-gray-700 tabular-nums">
            {label(shown.day)}: {shown.leads}
          </p>
        )}
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto"
        role="img"
        aria-label={`New enquiries per day. ${total} in total, busiest ${label(busiest.day)} with ${busiest.leads}.`}
        onMouseLeave={() => setHover(null)}
      >
        {/* Recessive gridlines: enough to read a height against, not enough to compete with it. */}
        {[0, 0.5, 1].map(f => (
          <line key={f}
            x1={PAD.left} x2={WIDTH - PAD.right}
            y1={PAD.top + plotH * f} y2={PAD.top + plotH * f}
            stroke="#E5E7EB" strokeWidth="1" />
        ))}
        <text x={PAD.left - 6} y={PAD.top + 4} textAnchor="end" className="fill-gray-400" fontSize="9">
          {peak}
        </text>
        <text x={PAD.left - 6} y={PAD.top + plotH + 3} textAnchor="end" className="fill-gray-400" fontSize="9">
          0
        </text>

        <path d={area} fill="var(--color-primary)" opacity="0.10" />
        <path d={line} fill="none" stroke="var(--color-primary)" strokeWidth="2"
          strokeLinejoin="round" strokeLinecap="round" />

        {hover !== null && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + plotH}
              stroke="#9CA3AF" strokeWidth="1" strokeDasharray="3 3" />
            {/* A 2px surface ring, so the marker reads as on top of the line rather than in it. */}
            <circle cx={x(hover)} cy={y(daily[hover].leads)} r="5"
              fill="var(--color-primary)" stroke="#fff" strokeWidth="2" />
          </>
        )}

        {/* Hit targets wider than the marks, so hovering does not require precision. */}
        {daily.map((d, i) => (
          <rect key={d.day}
            x={x(i) - plotW / (daily.length * 2) - 1}
            y={PAD.top}
            width={Math.max(6, plotW / daily.length)}
            height={plotH}
            fill="transparent"
            onMouseEnter={() => setHover(i)} />
        ))}

        <text x={PAD.left} y={HEIGHT - 6} className="fill-gray-400" fontSize="9">
          {label(daily[0].day)}
        </text>
        <text x={WIDTH - PAD.right} y={HEIGHT - 6} textAnchor="end" className="fill-gray-400" fontSize="9">
          {label(daily[daily.length - 1].day)}
        </text>
      </svg>
    </div>
  );
};

export default DailyLeadsChart;
