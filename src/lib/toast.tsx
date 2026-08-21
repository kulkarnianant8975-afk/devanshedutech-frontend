import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

/**
 * Told once, in one place, in words a counsellor can act on.
 *
 * Every screen had grown its own banner: some at the top, some inline, some that vanished after
 * three seconds and some that never did. That inconsistency is not only untidy — a counsellor who
 * has learned that confirmations appear at the top of one screen will miss one that appears at
 * the bottom of another, and a missed confirmation means sending the same message twice.
 *
 * Two rules the rest of this follows:
 *
 * A success disappears on its own. It confirms something the person already intended, so it does
 * not need acknowledging — and a queue of ticks to dismiss is its own annoyance.
 *
 * A failure does not. It carries information the person now has to act on, and clearing it
 * automatically means the one time they looked away is the one time they never learn the message
 * did not send.
 */

type Tone = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  tone: Tone;
  message: string;
  /** Extra context under the headline — what to do about it, usually. */
  detail?: string;
}

interface ToastApi {
  success: (message: string, detail?: string) => void;
  error: (message: string, detail?: string) => void;
  info: (message: string, detail?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/** Successes clear themselves; failures wait to be read. */
const DISMISS_AFTER: Record<Tone, number | null> = {
  success: 4000,
  info: 6000,
  error: null,
};

const STYLE: Record<Tone, { icon: typeof CheckCircle2; ring: string; iconTone: string }> = {
  success: { icon: CheckCircle2, ring: 'border-emerald-200', iconTone: 'text-emerald-600' },
  error:   { icon: AlertCircle,  ring: 'border-red-200',     iconTone: 'text-red-600' },
  info:    { icon: Info,         ring: 'border-sky-200',     iconTone: 'text-sky-600' },
};

let nextId = 1;

/** Above this many on screen at once, the oldest disposable ones start giving up their place. */
const VISIBLE = 4;

/**
 * Keeps the stack short without ever dropping a failure.
 *
 * A burst is normally a burst of confirmations — saving eight rows, sending six brochures — and
 * those are disposable by definition: each one repeats something the person just did. Failures
 * are not interchangeable with them. Four failed sends are four students who did not get their
 * message, and quietly discarding three to keep the corner tidy would defeat the entire reason
 * failures do not auto-dismiss.
 *
 * So the trim only ever evicts successes and notices. If everything on screen is a failure, the
 * stack is allowed to grow past the limit and scroll.
 */
const trim = (list: Toast[]): Toast[] => {
  const evictable = list.filter(t => t.tone !== 'error').length;
  let toDrop = Math.min(list.length - VISIBLE, evictable);
  if (toDrop <= 0) return list;

  return list.filter(t => {
    if (toDrop > 0 && t.tone !== 'error') { toDrop--; return false; }
    return true;
  });
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts(current => current.filter(t => t.id !== id));
  }, []);

  const push = useCallback((tone: Tone, message: string, detail?: string) => {
    const id = nextId++;
    setToasts(current => trim([...current, { id, tone, message, detail }]));

    const after = DISMISS_AFTER[tone];
    if (after) window.setTimeout(() => dismiss(id), after);
  }, [dismiss]);

  const api = useMemo<ToastApi>(() => ({
    success: (message, detail) => push('success', message, detail),
    error: (message, detail) => push('error', message, detail),
    info: (message, detail) => push('info', message, detail),
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {typeof document !== 'undefined' && createPortal(
        <div
          // Bottom on a phone where the thumb is, top-right on a desktop where the eye is.
          // A run of failures is allowed to outgrow the limit, so the column scrolls rather than
          // running off the screen. Padding keeps the shadows from being clipped by that scroll.
          className="fixed z-[100] pointer-events-none inset-x-3 bottom-3 sm:inset-x-auto sm:bottom-auto sm:top-4 sm:right-4 sm:w-96 flex flex-col gap-2 max-h-[80vh] overflow-y-auto p-1 -m-1"
        >
          <AnimatePresence initial={false}>
            {toasts.map(toast => {
              const { icon: Icon, ring, iconTone } = STYLE[toast.tone];
              return (
                <motion.div
                  key={toast.id}
                  layout
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
                  // A failure interrupts a screen reader; a confirmation waits its turn.
                  role={toast.tone === 'error' ? 'alert' : 'status'}
                  aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}
                  className={`pointer-events-auto flex items-start gap-3 rounded-2xl bg-white border ${ring} shadow-lg px-4 py-3`}
                >
                  <Icon size={18} className={`${iconTone} shrink-0 mt-0.5`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">{toast.message}</p>
                    {toast.detail && (
                      <p className="text-xs text-gray-500 mt-0.5">{toast.detail}</p>
                    )}
                  </div>
                  <button
                    onClick={() => dismiss(toast.id)}
                    aria-label="Dismiss"
                    className="shrink-0 text-gray-300 hover:text-gray-600 -mr-1 -mt-0.5 p-1"
                  >
                    <X size={15} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
};

/**
 * Falls back to doing nothing outside a provider rather than throwing.
 *
 * A missing confirmation is a small problem; a component that crashes because nobody wrapped it
 * is a large one, and tests mounting a single screen should not have to know about this.
 */
export const useToast = (): ToastApi => {
  const context = useContext(ToastContext);
  return context ?? {
    success: () => {},
    error: () => {},
    info: () => {},
  };
};
