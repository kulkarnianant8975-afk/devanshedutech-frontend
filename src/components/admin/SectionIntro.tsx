import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ChevronDown, Check } from 'lucide-react';

/**
 * What this screen is for, and how to work it.
 *
 * <p>Sixteen screens, and three of them said what they were. The rest opened onto a table and a
 * row of controls and left somebody to work out the rest by clicking things — on a CRM where
 * clicking the wrong thing messages a real student. "I do not know what this screen does" and
 * "I am afraid to touch it" are the same problem.</p>
 *
 * <p>The one-line purpose is always visible. The steps are folded away, because they are worth
 * reading once and then never again, and a permanent block of instructions above a table somebody
 * uses forty times a day is its own kind of clutter. Dismissing it is remembered per screen —
 * learning the Media Library says nothing about whether you have learned Broadcasts.</p>
 */

interface Props {
  /** One sentence: what this screen is for. Always visible. */
  purpose: string;
  /** The three or four steps of actually using it, in order. */
  steps?: string[];
  /** Distinguishes what has been dismissed. Stable — it is a storage key. */
  screen: string;
}

const KEY = (screen: string) => `dvt.intro.${screen}`;

/** Browsers can refuse storage entirely; a guidance note is not worth breaking a screen over. */
const readDismissed = (screen: string): boolean => {
  try {
    return window.localStorage.getItem(KEY(screen)) === 'done';
  } catch {
    return false;
  }
};

const SectionIntro: React.FC<Props> = ({ purpose, steps, screen }) => {
  const [dismissed, setDismissed] = useState(() => readDismissed(screen));
  const [open, setOpen] = useState(false);

  const dismiss = () => {
    setDismissed(true);
    setOpen(false);
    try {
      window.localStorage.setItem(KEY(screen), 'done');
    } catch {
      // Dismissed for this visit at least, which is the behaviour somebody asked for.
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
      <div className="flex items-start gap-3">
        <Lightbulb size={16} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-gray-600 flex-1 leading-relaxed">{purpose}</p>

        {steps && steps.length > 0 && !dismissed && (
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            aria-expanded={open}
            className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-orange-700 transition-colors">
            How it works
            <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {open && steps && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <ol className="mt-3 pt-3 border-t border-gray-100 space-y-2">
              {steps.map((step, i) => (
                <li key={step} className="flex gap-2.5 text-sm text-gray-600">
                  <span className="w-5 h-5 rounded-full bg-orange-50 text-primary text-[11px] font-bold
                    flex items-center justify-center shrink-0 tabular-nums">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>

            <button
              type="button"
              onClick={dismiss}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800">
              <Check size={13} /> Got it — stop showing this
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SectionIntro;
