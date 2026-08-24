import React, { useState } from 'react';
import { History } from 'lucide-react';
import { LOCALE } from '../../lib/followUp';

/**
 * When somebody last spoke to this student, and what came of it.
 *
 * <p>Both were already stored on every lead and shown nowhere — the note appeared only in the CSV
 * export. So the lists answered "when is this due next" and never "when did we last try", which
 * are different questions: a lead due tomorrow that nobody has reached in three weeks needs a
 * different call from one spoken to yesterday.</p>
 *
 * <p>Kept to one line. This sits in a row that already carries a name, a course, a grade, a stage
 * and a next date, and a paragraph in that space would cost more attention than it returns. The
 * full history is a click away in the lead itself.</p>
 */

interface Props {
  at?: string | null;
  /** Already formatted by the server as "Connected — wants evening batches". */
  note?: string | null;
  /** Wider layouts can afford the note on its own line; a card cannot. */
  compact?: boolean;
}

/** How long ago, in the terms somebody actually thinks in. */
const ago = (iso: string, now: number): string => {
  const then = new Date(iso);
  const days = Math.floor((now - then.getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return then.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' });
};

const LastFollowUp: React.FC<Props> = ({ at, note, compact }) => {
  // Captured once when the row mounts rather than read during every render. "How long ago" does
  // depend on the clock, but a list row does not need it to the second, and reading it mid-render
  // makes the component impure — the same props would produce different output on a re-render
  // that changed nothing.
  const [now] = useState(() => Date.now());

  if (!at && !note) {
    // Said rather than left blank. An empty cell reads as missing data; this is a fact about the
    // student, and on an active lead it is the most important one on the row.
    return <span className="text-xs text-gray-400">Never contacted</span>;
  }

  const days = at ? Math.floor((now - new Date(at).getTime()) / 86_400_000) : null;
  const stale = days !== null && days >= 7;

  return (
    <div className="min-w-0">
      <div className={`text-sm flex items-center gap-1.5 ${stale ? 'text-amber-700 font-semibold' : 'text-gray-600'}`}>
        <History size={13} className="shrink-0 text-gray-400" />
        {at ? ago(at, now) : '—'}
      </div>
      {note && (
        <p className={`text-[11px] text-gray-500 mt-0.5 truncate ${compact ? 'max-w-[150px]' : 'max-w-[220px]'}`}
          title={note}>
          {note}
        </p>
      )}
    </div>
  );
};

export default LastFollowUp;
