import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle, RefreshCw, Search, CalendarClock, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../lib/toast';
import { leadService, userService, errorMessage } from '../../services/api';
import { can } from '../../lib/permissions';
import LeadDrawer from './LeadDrawer';
import SectionIntro from './SectionIntro';
import {
  BoardDTO, BoardColumnDTO, LeadDTO, LeadOptionsDTO, StageName, GradeName,
  StaffUserDTO, UserResponseDTO
} from '../../dtos';

/**
 * The pipeline as a board.
 *
 * Dragging a card is a stage change, which is a real business event: it writes to the activity
 * log and can trigger scheduling. So the card moves optimistically for responsiveness, and moves
 * back if the server refuses — which it will, for instance, when a lead is dropped into Lost
 * without a reason. Silently leaving a card where the user dropped it after a failed save is the
 * worst possible outcome, because the board would then disagree with the database.
 */

const STAGE_ACCENT: Record<StageName, string> = {
  NEW: 'bg-gray-400',
  CONTACTED: 'bg-sky-500',
  DEMO_BOOKED: 'bg-orange-500',
  DEMO_DONE: 'bg-amber-500',
  FEE_DISCUSSION: 'bg-purple-500',
  ENROLLED: 'bg-emerald-500',
  LOST: 'bg-red-400',
};

const GRADE_DOT: Record<GradeName, string> = {
  HOT: 'bg-red-500', WARM: 'bg-amber-500', COLD: 'bg-sky-500',
};

const shortDate = (iso?: string) => {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

/**
 * At module level deliberately. A component declared inside its parent is a new type on every
 * render, so React rebuilds the DOM rather than updating it — which during a drag means the
 * card you are holding is destroyed underneath you.
 */
const Column: React.FC<{
  col: BoardColumnDTO;
  canEdit: boolean;
  dragging: LeadDTO | null;
  dragOver: StageName | null;
  onDragOverColumn: (stage: StageName) => void;
  onDragLeaveColumn: () => void;
  onDropColumn: (stage: StageName) => void;
  onDragStartCard: (lead: LeadDTO) => void;
  onDragEndCard: () => void;
  onOpen: (id: string) => void;
}> = ({ col, canEdit, dragging, dragOver, onDragOverColumn, onDragLeaveColumn,
        onDropColumn, onDragStartCard, onDragEndCard, onOpen }) => {
  const isTarget = dragOver === col.stage && dragging?.stage !== col.stage;
  return (
    <div
      onDragOver={e => { if (canEdit && dragging) { e.preventDefault(); onDragOverColumn(col.stage); } }}
      onDragLeave={onDragLeaveColumn}
      onDrop={e => { e.preventDefault(); onDropColumn(col.stage); }}
      className={`w-[260px] flex-shrink-0 rounded-2xl border transition-colors ${
        isTarget ? 'border-primary bg-orange-50/60' : 'border-gray-100 bg-gray-50/60'}`}
    >
      <header className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
        <span className={`w-1 h-4 rounded-full ${STAGE_ACCENT[col.stage]}`} />
        <h3 className="text-xs font-bold text-gray-700 flex-1 truncate">{col.label}</h3>
        <span className="text-xs font-bold text-gray-400 tabular-nums">{col.total}</span>
      </header>

      <div className="p-2 space-y-2 min-h-[80px] max-h-[calc(100vh-330px)] overflow-y-auto">
        {col.leads.length === 0 ? (
          <p className="text-[11px] text-gray-400 text-center py-6">
            {isTarget ? 'Drop here' : 'Nothing here'}
          </p>
        ) : col.leads.map(lead => (
          <article
            key={lead.id}
            draggable={canEdit}
            onDragStart={() => onDragStartCard(lead)}
            onDragEnd={onDragEndCard}
            onClick={() => onOpen(lead.id)}
            onKeyDown={e => { if (e.key === 'Enter') onOpen(lead.id); }}
            tabIndex={0}
            role="button"
            aria-label={`${lead.fullName}, ${lead.stageLabel}`}
            className={`bg-white rounded-xl border border-gray-100 p-2.5 shadow-sm hover:shadow-md
              transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 ${
              dragging?.id === lead.id ? 'opacity-40' : ''}`}
          >
            <div className="flex items-start gap-1.5">
              <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                lead.grade ? GRADE_DOT[lead.grade] : 'bg-gray-200'}`} aria-hidden="true" />
              <p className="text-[13px] font-bold text-gray-900 leading-tight flex-1 truncate">
                {lead.fullName}
              </p>
            </div>
            <p className="text-[11px] text-gray-500 mt-1 truncate pl-3.5">
              {lead.courseInterested || 'General enquiry'}
            </p>
            {/* A card this small can afford one more line, and this is the line worth spending it
                on: a column of leads all sitting in "Contacted" looks identical until you can see
                which of them anybody has actually spoken to. */}
            {lead.lastTouchNote && (
              <p className="text-[10px] text-gray-400 mt-0.5 truncate pl-3.5" title={lead.lastTouchNote}>
                {lead.lastTouchNote}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 pl-3.5 flex-wrap">
              {lead.nextTouchOn ? (
                <span className={`text-[10px] font-bold flex items-center gap-1 tabular-nums ${
                  lead.daysOverdue ? 'text-red-600' : 'text-gray-400'}`}>
                  <CalendarClock size={10} />
                  {lead.daysOverdue ? `${lead.daysOverdue}d late` : shortDate(lead.nextTouchOn)}
                </span>
              ) : lead.blankNextTouch ? (
                <span className="text-[10px] font-bold text-red-500">No next step</span>
              ) : null}
              {lead.assignedToName && (
                <span className="text-[10px] text-gray-400 flex items-center gap-1 ml-auto truncate">
                  <User size={10} />{lead.assignedToName.split(' ')[0]}
                </span>
              )}
            </div>
          </article>
        ))}

        {col.total > col.leads.length && (
          <p className="text-[10px] text-gray-400 text-center py-1.5">
            showing {col.leads.length} of {col.total}
          </p>
        )}
      </div>
    </div>
  );
};

interface Props { currentUser?: UserResponseDTO | null; }

const PipelineBoard: React.FC<Props> = ({ currentUser }) => {
  const toast = useToast();
  const [board, setBoard] = useState<BoardDTO | null>(null);
  const [loading, setLoading] = useState(true);
  // Only a failure to LOAD lives here. A banner is right for that: it explains an empty
  // screen and stays put while the person decides what to do. Everything a person
  // actively did — saved, sent, deleted — is reported by a toast instead.
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [grade, setGrade] = useState<GradeName | ''>('');
  const [owner, setOwner] = useState('');
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<LeadDTO | null>(null);
  const [dragOver, setDragOver] = useState<StageName | null>(null);
  const [options, setOptions] = useState<LeadOptionsDTO | null>(null);
  const [staff, setStaff] = useState<StaffUserDTO[]>([]);

  const canEdit = can(currentUser, 'LEAD_EDIT');
  const canViewStaff = can(currentUser, 'USER_VIEW');

  useEffect(() => {
    const t = window.setTimeout(() => setQuery(search), 350);
    return () => window.clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setBoard(await leadService.board({
        q: query || undefined,
        grade: grade || undefined,
        owner: owner || undefined,
      }));
    } catch (err) {
      setLoadError(errorMessage(err, 'Could not load the board.'));
    } finally {
      setLoading(false);
    }
  }, [query, grade, owner]);

  useEffect(() => { load(); }, [load]);

  // Stable, so the drawer's effect does not re-run on every render of this screen.
  const handleUpdated = useCallback(() => { load(); }, [load]);

  useEffect(() => {
    leadService.options().then(setOptions).catch(() => {});
    if (canViewStaff) userService.getAssignable().then(setStaff).catch(() => {});
  }, [canViewStaff]);

  /** Moves a card between columns in local state, so the drop feels immediate. */
  const moveLocally = (lead: LeadDTO, to: StageName): BoardDTO | null => {
    if (!board) return null;
    return {
      ...board,
      columns: board.columns.map(col => {
        if (col.stage === lead.stage) {
          return { ...col, leads: col.leads.filter(l => l.id !== lead.id), total: col.total - 1 };
        }
        if (col.stage === to) {
          return { ...col, leads: [{ ...lead, stage: to }, ...col.leads], total: col.total + 1 };
        }
        return col;
      }),
    };
  };

  const drop = async (to: StageName) => {
    const lead = dragging;
    setDragging(null);
    setDragOver(null);
    if (!lead || lead.stage === to || !canEdit) return;

    const before = board;
    setBoard(moveLocally(lead, to));

    try {
      await leadService.patch(lead.id, { stage: to, reason: 'Moved on the pipeline board' });
      toast.success(`${lead.fullName} moved to ${to.replace(/_/g, ' ').toLowerCase()}.`);
      load();
    } catch (err) {
      // Put it back. A card sitting where the save failed would be a board that lies.
      setBoard(before);
      toast.error(errorMessage(err, 'Could not move that lead.'));
    }
  };

  if (loading && !board) {
    return (
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-[260px] h-72 bg-white rounded-2xl animate-pulse flex-shrink-0" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionIntro
        screen="PipelineBoard"
        purpose="The same students as Student Leads, arranged by how far each has got."
        steps={[
          "Drag a card into another column to move that student's stage.",
          "The dot is their grade: red hot, amber warm, blue cold.",
          "Red text means their follow-up is overdue; “No next step” means nothing will ever raise them.",
          "Click a card to open the student and record a call.",
        ]}
      />

      <AnimatePresence>
        {loadError && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            role="alert" className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium flex-1">{loadError}</p>
            <button onClick={load} className="text-sm font-semibold underline shrink-0">Retry</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search the board..." aria-label="Search leads"
            className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
        </div>
        <select value={grade} onChange={e => setGrade(e.target.value as GradeName | '')}
          aria-label="Filter by grade"
          className="text-xs font-bold px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 outline-none">
          <option value="">All grades</option>
          {options?.grades.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {canViewStaff && (
          <select value={owner} onChange={e => setOwner(e.target.value)}
            aria-label="Filter by counsellor"
            className="text-xs font-bold px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 outline-none">
            <option value="">All counsellors</option>
            {staff.map(s => <option key={s.id} value={s.id}>{s.displayName}</option>)}
          </select>
        )}
        <button onClick={load}
          className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {canEdit && (
        <p className="text-xs text-gray-400">
          Drag a card to move it. The change is recorded on the lead&apos;s timeline.
        </p>
      )}

      <div className="overflow-x-auto pb-3">
        <div className="flex gap-3 min-w-max">
          {board?.columns.map(col => (
            <Column
              key={col.stage} col={col} canEdit={canEdit}
              dragging={dragging} dragOver={dragOver}
              onDragOverColumn={setDragOver}
              onDragLeaveColumn={() => setDragOver(null)}
              onDropColumn={drop}
              onDragStartCard={setDragging}
              onDragEndCard={() => { setDragging(null); setDragOver(null); }}
              onOpen={setOpenLeadId}
            />
          ))}
        </div>
      </div>

      <LeadDrawer
        leadId={openLeadId} currentUser={currentUser} options={options} staff={staff}
        onClose={() => setOpenLeadId(null)}
        onUpdated={handleUpdated}
      />
    </div>
  );
};

export default PipelineBoard;
