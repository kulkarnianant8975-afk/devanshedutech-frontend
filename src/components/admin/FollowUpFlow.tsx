import React from 'react';
import { PhoneCall, MessageCircle, Mail, CalendarDays, ArrowRight } from 'lucide-react';
import { LeadActivityDTO } from '../../dtos';
import { LOCALE } from '../../lib/followUp';

/**
 * The conversation so far, and when the next one is.
 *
 * <p>All of this was already on the timeline, and that was the problem. The timeline records ten
 * kinds of event — captures, assignments, grade changes, stage changes, system actions — in one
 * list, so the three things a counsellor needs before dialling ("what did they say last time,
 * what did I do about it, when am I due back") were three finds among a dozen rows. Somebody
 * mid-call does not read a dozen rows; they guess, or they open with a question the student has
 * already answered.</p>
 *
 * <p>So this shows contacts only, in order, each with what the student actually said. The
 * timeline still holds everything — nothing was removed from it. This is the same record with
 * the noise taken out.</p>
 */

/** The event types that represent somebody actually reaching the student. */
const CONTACT_TYPES = new Set(['CALL', 'WHATSAPP', 'EMAIL', 'DEMO']);

const ICONS: Record<string, typeof PhoneCall> = {
  CALL: PhoneCall,
  WHATSAPP: MessageCircle,
  EMAIL: Mail,
  DEMO: CalendarDays,
};

interface Props {
  activities: LeadActivityDTO[];
}

/*
 * Where the lead goes next is deliberately not repeated here.
 *
 * This sat directly beneath the Next touch card, which already shows the date, the note, whether
 * it is overdue, and the controls to change it. Showing all of that again a couple of inches
 * lower was not reassurance, it was two places to read and one of them to eventually disagree
 * with the other. The card answers "when next"; this answers "what happened before".
 */

const stamp = (iso: string): string => {
  const when = new Date(iso);
  const today = new Date();
  const sameDay = when.toDateString() === today.toDateString();
  const time = when.toLocaleTimeString(LOCALE, { hour: 'numeric', minute: '2-digit' });
  if (sameDay) return `Today, ${time}`;

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (when.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;

  return `${when.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' })}, ${time}`;
};

const FollowUpFlow: React.FC<Props> = ({ activities }) => {
  const contacts = activities.filter(a => CONTACT_TYPES.has(a.type));

  return (
    <section className="py-5 border-b border-gray-100">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">
        Follow-up flow
      </p>

      {contacts.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">
          Nobody has spoken to this student yet. The first call will appear here.
        </p>
      ) : (
        <ol className="space-y-0">
          {contacts.map((contact, i) => {
            const Icon = ICONS[contact.type] ?? PhoneCall;
            const last = i === contacts.length - 1;
            const first = i === 0;
            return (
              <li key={contact.id} className="flex gap-3 relative pb-4">
                {!last && (
                  <span className="absolute left-[13px] top-7 bottom-0 w-px bg-gray-200" aria-hidden="true" />
                )}
                <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${
                  first ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                  <Icon size={13} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm font-bold text-gray-800">
                      {contact.outcomeLabel ?? contact.summary}
                    </span>
                    {first && (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-primary">
                        most recent
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-400">
                    {stamp(contact.createdAt)}
                    {contact.createdByName ? ` · ${contact.createdByName}` : ''}
                  </p>

                  {/* What the student actually said. The reason this component exists — it is
                      the one thing worth reading before dialling, and it was previously a line
                      of small grey text among a dozen unrelated rows. */}
                  {contact.detail && (
                    <p className="mt-1.5 text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                      &ldquo;{contact.detail}&rdquo;
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {contacts.length > 0 && (
        <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-1">
          <ArrowRight size={11} className="shrink-0" />
          Every grade change, message and system action is still on the full timeline below.
        </p>
      )}
    </section>
  );
};

export default FollowUpFlow;
