import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, Loader2, CheckCheck, Clock, AlertTriangle, UserPlus, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationService, errorMessage } from '../../services/api';
import { NotificationDTO } from '../../dtos';

/**
 * The notification bell.
 *
 * Polls rather than holding a socket open: these are daily-cadence facts, not chat, and a
 * connection kept alive for a screen that changes once each morning is a cost with no benefit.
 * Polling pauses while the tab is hidden, so a laptop left open overnight does not spend the
 * night talking to the server.
 */

const ICONS: Record<string, React.ElementType> = {
  LEAD_ASSIGNED: UserPlus,
  FOLLOW_UP_DUE: Clock,
  FOLLOW_UP_MISSED: AlertTriangle,
  NO_NEXT_STEP: AlertTriangle,
  DEMO_TOMORROW: CalendarDays,
  DEMO_UNMARKED: CalendarDays,
};

const TONES: Record<string, string> = {
  FOLLOW_UP_MISSED: 'text-red-600 bg-red-50',
  NO_NEXT_STEP: 'text-red-600 bg-red-50',
  DEMO_UNMARKED: 'text-amber-600 bg-amber-50',
  LEAD_ASSIGNED: 'text-emerald-600 bg-emerald-50',
};

const ago = (iso: string) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
};

interface Props {
  /** Opens the lead the notice refers to. */
  onOpenLead: (leadId: string) => void;
}

const NotificationBell: React.FC<Props> = ({ onOpenLead }) => {
  const [items, setItems] = useState<NotificationDTO[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await notificationService.list(30);
      setItems(data.items);
      setUnread(data.unread);
    } catch {
      // A failing bell must never break the page around it.
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const tick = () => { if (!document.hidden) load(); };
    const id = window.setInterval(tick, 60000);
    document.addEventListener('visibilitychange', tick);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [load]);

  useEffect(() => {
    const away = (e: MouseEvent) => {
      if (open && panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [open]);

  const openItem = async (n: NotificationDTO) => {
    setOpen(false);
    if (!n.read) {
      setItems(prev => prev.map(i => (i.id === n.id ? { ...i, read: true } : i)));
      setUnread(u => Math.max(0, u - 1));
      notificationService.markRead(n.id).catch(() => load());
    }
    if (n.leadId) onOpenLead(n.leadId);
  };

  const markAll = async () => {
    setLoading(true);
    try {
      await notificationService.markAllRead();
      await load();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={unread > 0 ? `${unread} unread notifications` : 'Notifications'}
        aria-expanded={open}
        className="relative p-2.5 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            role="dialog" aria-label="Notifications"
            className="absolute right-0 mt-2 w-[340px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-gray-100 shadow-2xl z-50 overflow-hidden"
          >
            <header className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex-1">Notifications</h3>
              {unread > 0 && (
                <button onClick={markAll} disabled={loading}
                  className="text-xs font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors">
                  {loading ? <Loader2 size={12} className="animate-spin" /> : <CheckCheck size={13} />}
                  Mark all read
                </button>
              )}
            </header>

            <div className="max-h-[420px] overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <Bell size={28} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-sm text-gray-500">Nothing needs your attention.</p>
                </div>
              ) : items.map(n => {
                const Icon = ICONS[n.kind] ?? Bell;
                return (
                  <button key={n.id} onClick={() => openItem(n)}
                    className={`w-full text-left flex gap-3 px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors ${
                      n.read ? '' : 'bg-orange-50/40'}`}>
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      TONES[n.kind] ?? 'text-gray-500 bg-gray-100'}`}>
                      <Icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[13px] leading-snug ${n.read ? 'font-medium text-gray-700' : 'font-bold text-gray-900'}`}>
                        {n.title}
                      </span>
                      {n.body && <span className="block text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</span>}
                      <span className="block text-[10px] text-gray-400 mt-1">{ago(n.createdAt)}</span>
                    </span>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
