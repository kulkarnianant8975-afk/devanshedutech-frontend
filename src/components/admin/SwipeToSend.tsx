import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Loader2, Check, ChevronRight } from 'lucide-react';

/**
 * A swipe control for sending.
 *
 * Deliberate friction. This dispatches several messages to a real student and cannot be undone,
 * so it should not be reachable by a stray click while scrolling a long lead screen. A drag is
 * an unmistakable statement of intent.
 *
 * It is still a button underneath: Enter or Space sends, so keyboard and screen-reader users are
 * not asked to perform a gesture they cannot make.
 */

interface Props {
  label: string;
  sendingLabel?: string;
  doneLabel?: string;
  disabled?: boolean;
  sending?: boolean;
  done?: boolean;
  onSend: () => void;
}

const SwipeToSend: React.FC<Props> = ({
  label, sendingLabel = 'Sending…', doneLabel = 'Sent', disabled, sending, done, onSend,
}) => {
  const track = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  // Measured into state rather than read from the ref while rendering. A ref holds a value the
  // render is not allowed to depend on, and reading it during render gives a stale width on the
  // first pass and no re-render when it changes.
  const [trackWidth, setTrackWidth] = useState(0);
  const locked = disabled || sending || done;

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const measure = () => setTrackWidth(el.clientWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const maxOffset = Math.max(0, trackWidth - 62);

  const finish = useCallback(() => {
    if (offset >= maxOffset * 0.82) {
      onSend();
    }
    setOffset(0);
    setDragging(false);
  }, [offset, maxOffset, onSend]);

  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => {
      const rect = track.current?.getBoundingClientRect();
      if (!rect) return;
      setOffset(Math.max(0, Math.min(maxOffset, e.clientX - rect.left - 28)));
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
    };
  }, [dragging, finish, maxOffset]);

  const progress = maxOffset > 0 ? offset / maxOffset : 0;

  return (
    <div
      ref={track}
      role="button"
      tabIndex={locked ? -1 : 0}
      aria-label={label}
      aria-disabled={locked}
      onKeyDown={e => {
        if (locked) return;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSend(); }
      }}
      className={`relative h-12 rounded-2xl overflow-hidden select-none touch-none transition-colors
        focus:outline-none focus:ring-2 focus:ring-primary/40 ${
        done ? 'bg-emerald-50' : locked ? 'bg-gray-100' : 'bg-gray-50 border border-gray-200'}`}
    >
      {!done && !sending && (
        <div className="absolute inset-y-0 left-0 bg-primary/15 transition-[width] duration-75"
          style={{ width: `${offset + 56}px` }} aria-hidden="true" />
      )}

      <span className={`absolute inset-0 flex items-center justify-center text-[13px] font-bold pointer-events-none ${
        done ? 'text-emerald-700' : 'text-gray-500'}`}>
        {done ? doneLabel : sending ? sendingLabel : label}
      </span>

      {!done && !sending && (
        <div
          onPointerDown={e => { if (!locked) { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); setDragging(true); } }}
          style={{ transform: `translateX(${offset}px)` }}
          className={`absolute top-1 left-1 w-14 h-10 rounded-xl grid place-items-center
            ${locked ? 'bg-gray-300' : 'bg-primary cursor-grab active:cursor-grabbing'} text-white shadow-sm`}
          aria-hidden="true"
        >
          <ChevronRight size={18} style={{ opacity: 0.4 + progress * 0.6 }} />
        </div>
      )}

      {sending && (
        <span className="absolute top-1 left-1 w-14 h-10 rounded-xl grid place-items-center bg-primary text-white">
          <Loader2 size={16} className="animate-spin" />
        </span>
      )}
      {done && (
        <span className="absolute top-1 left-1 w-14 h-10 rounded-xl grid place-items-center bg-emerald-600 text-white">
          <Check size={16} />
        </span>
      )}
    </div>
  );
};

export default SwipeToSend;
