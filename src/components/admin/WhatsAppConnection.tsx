import React, { useState, useEffect } from 'react';
import { MessageCircle, Loader2, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { whatsappService, errorMessage } from '../../services/api';
import { useToast } from '../../lib/toast';
import { WhatsAppStatusDTO, WhatsAppTestDTO } from '../../dtos';

/**
 * Checking WhatsApp works, against your own phone.
 *
 * Testing a messaging integration by sending to a real lead is a bad trade: an expired token or
 * a number missing from the allowed list is invisible until a message does not arrive, and by
 * then it has not arrived for somebody who mattered.
 *
 * The two sends are separate and ordered on purpose. A template is the only thing that will
 * reach a phone which has never messaged the institute, because WhatsApp's free-reply window
 * has never opened. Replying opens it, and only then can a normal message be tested.
 */

const WhatsAppConnection: React.FC = () => {
  const toast = useToast();
  const [status, setStatus] = useState<WhatsAppStatusDTO | null>(null);
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState<null | 'template' | 'message'>(null);
  const [result, setResult] = useState<WhatsAppTestDTO | null>(null);

  useEffect(() => {
    let live = true;
    whatsappService.status()
      .then(s => live && setStatus(s))
      .catch(() => live && setStatus(null));
    return () => { live = false; };
  }, []);

  const send = async (what: 'template' | 'message') => {
    if (!phone.trim()) { toast.error('Enter the number to test with, including the country code.'); return; }
    setBusy(what);
    setResult(null);
    try {
      setResult(what === 'template'
        ? await whatsappService.sendTemplate(phone.trim())
        : await whatsappService.sendMessage(phone.trim()));
    } catch (e) {
      toast.error(errorMessage(e, 'The test could not be run.'));
    } finally {
      setBusy(null);
    }
  };

  if (!status) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white overflow-hidden mb-6">
      <header className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900 flex-1">WhatsApp connection</h3>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border ${
          status.sendsAutomatically
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
            : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
          {status.channel}
        </span>
      </header>

      <div className="p-4">
        <p className="text-xs text-gray-500 mb-3">{status.detail}</p>

        {!status.canTest ? (
          <p className="text-xs text-gray-400">
            Self-testing works on Meta&rsquo;s Cloud API. Its test number sends free messages to
            up to five numbers you verify, which is the safest way to check this before a student
            is on the other end. See WHATSAPP.md for the setup.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <label htmlFor="wa-phone" className="sr-only">Your number, with country code</label>
              <input
                id="wa-phone"
                type="tel"
                inputMode="numeric"
                placeholder="Your number, e.g. 919876543210"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg flex-1 min-w-[13rem]"
              />
              <button
                onClick={() => send('template')}
                disabled={busy !== null}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {busy === 'template' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                1. Send template
              </button>
              <button
                onClick={() => send('message')}
                disabled={busy !== null}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
              >
                {busy === 'message' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                2. Send message
              </button>
            </div>

            <p className="text-[11px] text-gray-400 mb-3">
              Send the template first — a phone that has never messaged the institute can only
              receive one. Reply to it, and the second button will then work.
            </p>

            {result && (
              <div className={`rounded-lg px-3 py-2 border text-sm ${
                result.sent
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                  : 'bg-amber-50 border-amber-100 text-amber-900'}`}>
                <p className="flex items-start gap-2">
                  {result.sent
                    ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                    : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
                  <span>{result.detail}</span>
                </p>
                <p className="text-xs mt-1.5 opacity-80 pl-6">{result.nextStep}</p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default WhatsAppConnection;
