import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Download, Trash2, Phone, MapPin, GraduationCap, AlertCircle,
  CheckCircle2, Loader2, X, ChevronLeft, ChevronRight, CalendarClock, Inbox
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LeadDrawer from './LeadDrawer';
import { leadService, userService, errorMessage } from '../../services/api';
import { can } from '../../lib/permissions';
import {
  LeadDTO, LeadOptionsDTO, StageName, GradeName, StaffUserDTO, UserResponseDTO
} from '../../dtos';

/**
 * The leads list.
 *
 * Filtering, sorting and paging all happen on the server: a counsellor's query is narrowed to
 * their own leads in the database, so this screen never has to filter for security reasons and
 * never loads the whole table into the browser.
 */

const GRADE_STYLES: Record<GradeName, string> = {
  HOT: 'bg-red-50 text-red-700 border-red-100',
  WARM: 'bg-amber-50 text-amber-700 border-amber-100',
  COLD: 'bg-sky-50 text-sky-700 border-sky-100',
};

const STAGE_STYLES: Record<StageName, string> = {
  NEW: 'text-gray-600',
  CONTACTED: 'text-sky-700',
  DEMO_BOOKED: 'text-orange-700',
  DEMO_DONE: 'text-amber-700',
  FEE_DISCUSSION: 'text-purple-700',
  ENROLLED: 'text-emerald-700',
  LOST: 'text-red-700',
};

const PAGE_SIZE = 25;

const formatDate = (iso?: string) => {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

interface Props {
  currentUser?: UserResponseDTO | null;
}

const AdminLeads: React.FC<Props> = ({ currentUser }) => {
  const [leads, setLeads] = useState<LeadDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [stage, setStage] = useState<StageName | ''>('');
  const [grade, setGrade] = useState<GradeName | ''>('');
  const [owner, setOwner] = useState('');
  const [openOnly, setOpenOnly] = useState(false);

  const [options, setOptions] = useState<LeadOptionsDTO | null>(null);
  const [staff, setStaff] = useState<StaffUserDTO[]>([]);

  const canAssign = can(currentUser, 'LEAD_ASSIGN');
  const canEdit = can(currentUser, 'LEAD_EDIT');
  const canDelete = can(currentUser, 'LEAD_DELETE');
  const seesEveryone = can(currentUser, 'LEAD_VIEW_ALL');
  const canViewStaff = can(currentUser, 'USER_VIEW');

  const flash = (msg: string) => {
    setSuccess(msg);
    window.setTimeout(() => setSuccess(null), 3500);
  };

  // Debounced so typing a name does not fire a request per keystroke.
  const debounce = useRef<number | undefined>(undefined);
  const [query, setQuery] = useState('');
  useEffect(() => {
    window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => { setQuery(search); setPage(0); }, 350);
    return () => window.clearTimeout(debounce.current);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await leadService.list({
        page,
        size: PAGE_SIZE,
        q: query || undefined,
        stage: stage || undefined,
        grade: grade || undefined,
        owner: owner || undefined,
        openOnly: openOnly || undefined,
      });
      setLeads(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(errorMessage(err, 'Could not load leads. Check your connection and try again.'));
    } finally {
      setLoading(false);
    }
  }, [page, query, stage, grade, owner, openOnly]);

  useEffect(() => { load(); }, [load]);

  // Stable, so the drawer's effect does not re-run on every render of this screen.
  const handleUpdated = useCallback((updated: LeadDTO) =>
    setLeads(prev => prev.map(l => (l.id === updated.id ? updated : l))), []);

  useEffect(() => {
    leadService.options().then(setOptions).catch(() => { /* filters degrade to plain text */ });
    // Loading the staff list needs USER_VIEW, which a Viewer does not hold even though they
    // can see every lead. Asking anyway would be a guaranteed 403 on every page load.
    if (canViewStaff) {
      userService.getAssignable().then(setStaff).catch(() => { /* assignment stays hidden */ });
    }
  }, [canViewStaff]);

  const patch = async (lead: LeadDTO, changes: Parameters<typeof leadService.patch>[1], note: string) => {
    setBusyId(lead.id);
    setError(null);
    try {
      const updated = await leadService.patch(lead.id, changes);
      setLeads(prev => prev.map(l => (l.id === updated.id ? updated : l)));
      flash(note);
    } catch (err) {
      setError(errorMessage(err, 'Could not update that lead.'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (lead: LeadDTO) => {
    const ok = window.confirm(
      `Permanently delete ${lead.fullName}?\n\n` +
      `The SOP marks a lead Lost and keeps it, because students often come back for a later ` +
      `intake. Deleting also destroys their call history. Continue?`
    );
    if (!ok) return;
    setBusyId(lead.id);
    try {
      await leadService.delete(lead.id);
      setLeads(prev => prev.filter(l => l.id !== lead.id));
      setTotal(t => t - 1);
      flash(`${lead.fullName} deleted.`);
    } catch (err) {
      setError(errorMessage(err, 'Could not delete that lead.'));
    } finally {
      setBusyId(null);
    }
  };

  /** Exports the current filter, not just the page on screen. */
  const exportToCSV = async () => {
    try {
      const all = await leadService.list({
        page: 0, size: 200, q: query || undefined,
        stage: stage || undefined, grade: grade || undefined,
        owner: owner || undefined, openOnly: openOnly || undefined,
      });
      const headers = ['Name', 'Phone', 'Course', 'Background', 'City', 'Source',
                       'Grade', 'Stage', 'Owner', 'Next touch', 'Last touch', 'Enquired'];
      const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const csv = [
        headers.join(','),
        ...all.items.map(l => [
          l.fullName, l.mobileNumber, l.courseInterested, l.backgroundLabel, l.cityName,
          l.sourceLabel, l.gradeLabel, l.stageLabel, l.assignedToName,
          l.nextTouchOn, l.lastTouchNote, formatDate(l.createdAt),
        ].map(escape).join(',')),
      ].join('\n');

      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      if (all.total > all.items.length) {
        flash(`Exported the first ${all.items.length} of ${all.total} matching leads.`);
      }
    } catch (err) {
      setError(errorMessage(err, 'Could not export those leads.'));
    }
  };

  const select = "text-xs font-bold px-2.5 py-1.5 rounded-lg border outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 bg-white";

  return (
    <div className="space-y-5">
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            role="alert" className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium flex-1">{error}</p>
            <button onClick={() => setError(null)} aria-label="Dismiss"><X size={18} /></button>
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            role="status" className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-2xl">
            <CheckCircle2 size={20} /><p className="text-sm font-medium">{success}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="search" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, phone, city or course..."
              aria-label="Search leads"
              className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <button onClick={exportToCSV}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-colors">
            <Download size={18} /> Export
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select value={stage} onChange={e => { setStage(e.target.value as StageName | ''); setPage(0); }}
            aria-label="Filter by stage" className={`${select} border-gray-200 text-gray-700`}>
            <option value="">All stages</option>
            {options?.stages.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={grade} onChange={e => { setGrade(e.target.value as GradeName | ''); setPage(0); }}
            aria-label="Filter by grade" className={`${select} border-gray-200 text-gray-700`}>
            <option value="">All grades</option>
            {options?.grades.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {canViewStaff && (
            <select value={owner} onChange={e => { setOwner(e.target.value); setPage(0); }}
              aria-label="Filter by counsellor" className={`${select} border-gray-200 text-gray-700`}>
              <option value="">All counsellors</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.displayName}</option>)}
            </select>
          )}
          <button onClick={() => { setOpenOnly(v => !v); setPage(0); }} aria-pressed={openOnly}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
              openOnly ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}>
            Open only
          </button>
          <span className="text-xs text-gray-400 ml-auto">
            {loading ? 'Loading…' : `${total} lead${total === 1 ? '' : 's'}`}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/60">
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Grade</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Stage</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Next touch</th>
                {seesEveryone && <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Owner</th>}
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Source</th>
                {canDelete && <th className="p-4" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i}><td colSpan={8} className="p-4"><div className="h-12 bg-gray-50 rounded-2xl animate-pulse" /></td></tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-16 text-center">
                    <Inbox size={40} className="mx-auto text-gray-200 mb-4" />
                    <p className="font-bold text-gray-700">
                      {query || stage || grade || owner ? 'No leads match these filters.' : 'No leads yet.'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {query || stage || grade || owner
                        ? 'Try clearing a filter.'
                        : 'Enquiries from the website will appear here automatically.'}
                    </p>
                  </td>
                </tr>
              ) : leads.map(lead => (
                <tr key={lead.id}
                    onClick={() => setOpenLeadId(lead.id)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open ${lead.fullName}`}
                    onKeyDown={e => { if (e.key === 'Enter') setOpenLeadId(lead.id); }}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer focus:outline-none focus:bg-orange-50/60">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-orange-50 text-primary flex items-center justify-center font-bold flex-shrink-0">
                        {lead.fullName?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate">{lead.fullName}</p>
                        <p className="text-xs text-primary font-medium truncate">
                          {lead.courseInterested || 'General enquiry'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-600 flex items-center gap-1.5">
                      <Phone size={13} className="text-gray-400" />{lead.mobileNumber}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
                      <MapPin size={12} />{lead.cityName || '—'}
                      {lead.backgroundLabel && (
                        <><GraduationCap size={12} className="ml-1" />{lead.backgroundLabel}</>
                      )}
                    </div>
                  </td>
                  <td className="p-4" onClick={e => e.stopPropagation()}>
                    {canEdit ? (
                      <select
                        value={lead.grade ?? ''} disabled={busyId === lead.id}
                        aria-label={`Grade for ${lead.fullName}`}
                        onChange={e => patch(lead, { grade: (e.target.value || undefined) as GradeName },
                          `${lead.fullName} graded ${e.target.options[e.target.selectedIndex].text}.`)}
                        className={`${select} ${lead.grade ? GRADE_STYLES[lead.grade] : 'border-dashed border-gray-300 text-gray-400'}`}
                      >
                        <option value="">Not graded</option>
                        {options?.grades.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : (
                      <span className="text-sm">{lead.gradeLabel ?? '—'}</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`text-sm font-bold ${lead.stage ? STAGE_STYLES[lead.stage] : 'text-gray-400'}`}>
                      {lead.stageLabel ?? '—'}
                    </span>
                    {lead.lostReason && (
                      <p className="text-[11px] text-gray-400 mt-0.5">{lead.lostReason.replace(/_/g, ' ').toLowerCase()}</p>
                    )}
                  </td>
                  <td className="p-4">
                    {lead.nextTouchOn ? (
                      <div className={`text-sm font-bold flex items-center gap-1.5 ${
                        lead.daysOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                        <CalendarClock size={13} />
                        {formatDate(lead.nextTouchOn)}
                        {lead.daysOverdue ? <span className="text-xs">· {lead.daysOverdue}d late</span> : null}
                      </div>
                    ) : lead.blankNextTouch ? (
                      <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                        No next touch
                      </span>
                    ) : (
                      <span className="text-sm text-gray-300">—</span>
                    )}
                    {lead.nextTouchNote && (
                      <p className="text-[11px] text-gray-400 mt-0.5 max-w-[180px] truncate">{lead.nextTouchNote}</p>
                    )}
                  </td>
                  {seesEveryone && (
                    <td className="p-4" onClick={e => e.stopPropagation()}>
                      {canAssign ? (
                        <select
                          value={lead.assignedToId ?? ''} disabled={busyId === lead.id}
                          aria-label={`Owner for ${lead.fullName}`}
                          onChange={e => patch(lead,
                            e.target.value ? { assignedToId: e.target.value } : { clearOwner: true },
                            e.target.value ? `${lead.fullName} assigned.` : `${lead.fullName} unassigned.`)}
                          className={`${select} ${lead.assignedToId ? 'border-gray-200 text-gray-700' : 'border-dashed border-red-200 text-red-500'}`}
                        >
                          <option value="">Unassigned</option>
                          {staff.map(s => <option key={s.id} value={s.id}>{s.displayName}</option>)}
                        </select>
                      ) : (
                        <span className="text-sm text-gray-600">{lead.assignedToName ?? '—'}</span>
                      )}
                    </td>
                  )}
                  <td className="p-4 text-xs text-gray-500">
                    {lead.sourceLabel ?? '—'}
                    <p className="text-[11px] text-gray-400">{formatDate(lead.createdAt)}</p>
                  </td>
                  {canDelete && (
                    <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                      {busyId === lead.id
                        ? <Loader2 size={16} className="animate-spin text-gray-400 inline" />
                        : (
                          <button onClick={() => handleDelete(lead)} title="Delete permanently"
                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                            <Trash2 size={18} />
                          </button>
                        )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">Page {page + 1} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="p-2 rounded-xl border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
                aria-label="Previous page">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="p-2 rounded-xl border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
                aria-label="Next page">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      <LeadDrawer
        leadId={openLeadId}
        currentUser={currentUser}
        options={options}
        staff={staff}
        onClose={() => setOpenLeadId(null)}
        onUpdated={handleUpdated}
      />
    </div>
  );
};

export default AdminLeads;
