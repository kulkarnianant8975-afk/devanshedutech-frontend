import React, { useState, useEffect, useCallback } from 'react';
import {
  UserPlus, Shield, Search, Loader2, X, Save, KeyRound, AlertCircle,
  CheckCircle2, UserX, UserCheck, Lock, ScrollText, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { userService, errorMessage } from '../../services/api';
import { can } from '../../lib/permissions';
import {
  StaffUserDTO, RoleOptionDTO, RoleName, AuditEntryDTO, UserResponseDTO
} from '../../dtos';

/**
 * Staff administration.
 *
 * Every control here is also enforced on the server, so a stale page cannot be used to do
 * something the role does not allow — the request simply comes back 403 and the message is
 * shown as-is. Controls the current user cannot use are disabled with the reason visible
 * rather than hidden, because a silently missing button reads as a bug.
 */

const ROLE_STYLES: Record<RoleName, string> = {
  SUPER_ADMIN: 'bg-purple-50 text-purple-700 border-purple-100',
  ADMIN: 'bg-orange-50 text-orange-700 border-orange-100',
  MANAGER: 'bg-blue-50 text-blue-700 border-blue-100',
  SALES_EXECUTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  VIEWER: 'bg-gray-100 text-gray-600 border-gray-200',
  NONE: 'bg-red-50 text-red-600 border-red-100',
};

const initials = (name: string) =>
  name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

interface Props {
  currentUser: UserResponseDTO | null;
}

const AdminTeam: React.FC<Props> = ({ currentUser }) => {
  const [users, setUsers] = useState<StaffUserDTO[]>([]);
  const [roles, setRoles] = useState<RoleOptionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ user: StaffUserDTO; activate: boolean } | null>(null);
  const [pwUser, setPwUser] = useState<StaffUserDTO | null>(null);
  const [showAudit, setShowAudit] = useState(false);
  const [audit, setAudit] = useState<AuditEntryDTO[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const canManage = can(currentUser, 'USER_MANAGE');
  const canAssignRole = can(currentUser, 'ROLE_ASSIGN');
  const canViewAudit = can(currentUser, 'AUDIT_VIEW');

  const flash = (msg: string) => {
    setSuccess(msg);
    window.setTimeout(() => setSuccess(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getTeam();
      setUsers(data.users);
      setRoles(data.roles);
    } catch (err) {
      setError(errorMessage(err, 'Could not load the team. Check your connection and try again.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadAudit = async () => {
    setAuditLoading(true);
    try {
      setAudit(await userService.getAudit(0, 60));
    } catch (err) {
      setError(errorMessage(err, 'Could not load the audit trail.'));
    } finally {
      setAuditLoading(false);
    }
  };

  const toggleAudit = () => {
    const next = !showAudit;
    setShowAudit(next);
    if (next && audit.length === 0) loadAudit();
  };

  const applyRole = async (user: StaffUserDTO, role: RoleName) => {
    if (role === user.role) return;
    setBusyId(user.id);
    setError(null);
    try {
      const updated = await userService.changeRole(user.id, role);
      setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
      flash(`${updated.displayName} is now ${updated.roleLabel}.`);
    } catch (err) {
      setError(errorMessage(err, 'Could not change that role.'));
    } finally {
      setBusyId(null);
    }
  };

  const applyActive = async () => {
    if (!confirm) return;
    const { user, activate } = confirm;
    setBusyId(user.id);
    setError(null);
    try {
      const updated = await userService.setActive(user.id, activate);
      setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
      flash(activate
        ? `${updated.displayName} can sign in again.`
        : `${updated.displayName} has been deactivated. Their history is kept.`);
      setConfirm(null);
    } catch (err) {
      setError(errorMessage(err, 'Could not update that account.'));
      setConfirm(null);
    } finally {
      setBusyId(null);
    }
  };

  const visible = users.filter(u => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return u.displayName.toLowerCase().includes(q)
      || u.email.toLowerCase().includes(q)
      || u.roleLabel.toLowerCase().includes(q);
  });

  const isSelf = (u: StaffUserDTO) => u.id === currentUser?.id;

  return (
    <div className="space-y-6">
      {/* Feedback */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            role="alert"
            className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl"
          >
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium flex-1">{error}</p>
            <button onClick={() => setError(null)} aria-label="Dismiss"><X size={18} /></button>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            role="status"
            className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-2xl"
          >
            <CheckCircle2 size={20} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium flex-1">{success}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or role..."
            aria-label="Search staff"
            className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-3 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-colors"
          >
            <RefreshCw size={18} /> <span className="hidden sm:inline">Refresh</span>
          </button>
          {canViewAudit && (
            <button
              onClick={toggleAudit}
              aria-expanded={showAudit}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold transition-colors ${
                showAudit ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ScrollText size={18} /> <span className="hidden sm:inline">Activity</span>
            </button>
          )}
          {canManage && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-orange-600 transition-colors"
            >
              <UserPlus size={18} /> Add member
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/60">
                <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Member</th>
                <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Last sign-in</th>
                <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [1, 2, 3, 4].map(i => (
                  <tr key={i}><td colSpan={5} className="p-5"><div className="h-12 bg-gray-50 rounded-2xl animate-pulse" /></td></tr>
                ))
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-16 text-center">
                    <Shield size={40} className="mx-auto text-gray-200 mb-4" />
                    <p className="font-bold text-gray-700">
                      {search ? 'No one matches that search.' : 'No staff accounts yet.'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {search
                        ? 'Try a different name, email or role.'
                        : 'Add your counsellors so leads can be assigned to them.'}
                    </p>
                  </td>
                </tr>
              ) : (
                visible.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-orange-50 text-primary flex items-center justify-center font-bold flex-shrink-0 overflow-hidden">
                          {u.photoURL
                            ? <img src={u.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            : initials(u.displayName)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">
                            {u.displayName}
                            {isSelf(u) && <span className="ml-2 text-[10px] font-bold text-gray-400 uppercase">You</span>}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      {canAssignRole && !isSelf(u) && !u.roleLockedByConfig ? (
                        <select
                          value={u.role}
                          disabled={busyId === u.id}
                          onChange={e => applyRole(u, e.target.value as RoleName)}
                          aria-label={`Role for ${u.displayName}`}
                          className={`text-xs font-bold px-3 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 ${ROLE_STYLES[u.role]}`}
                        >
                          {roles.filter(r => r.grantable || r.value === u.role).map(r => (
                            <option key={r.value} value={r.value} disabled={!r.grantable}>{r.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border ${ROLE_STYLES[u.role]}`}>
                          {u.roleLockedByConfig && <Lock size={11} />}
                          {u.roleLabel}
                        </span>
                      )}
                      {u.roleLockedByConfig && (
                        <p className="text-[10px] text-gray-400 mt-1.5">Set in server configuration</p>
                      )}
                    </td>
                    <td className="p-5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${u.active ? 'text-emerald-600' : 'text-gray-400'}`}>
                        <span className={`w-2 h-2 rounded-full ${u.active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        {u.active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="p-5 text-sm text-gray-500">{formatDate(u.lastLoginAt)}</td>
                    <td className="p-5">
                      <div className="flex items-center justify-end gap-1">
                        {busyId === u.id && <Loader2 size={16} className="animate-spin text-gray-400 mr-1" />}
                        {canManage && !isSelf(u) && (
                          <>
                            <button
                              onClick={() => setPwUser(u)}
                              title="Set a new password"
                              className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                              <KeyRound size={18} />
                            </button>
                            <button
                              onClick={() => setConfirm({ user: u, activate: !u.active })}
                              title={u.active ? 'Deactivate this account' : 'Reactivate this account'}
                              className={`p-2.5 rounded-xl transition-colors ${
                                u.active ? 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                                         : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              {u.active ? <UserX size={18} /> : <UserCheck size={18} />}
                            </button>
                          </>
                        )}
                        {isSelf(u) && (
                          <span className="text-xs text-gray-400 pr-2">Ask another admin</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit trail */}
      <AnimatePresence>
        {showAudit && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="p-5 border-b border-gray-100 flex items-center gap-3">
              <ScrollText size={18} className="text-gray-400" />
              <h3 className="font-bold text-gray-900">Access activity</h3>
              <span className="text-xs text-gray-400">Sign-ins, role changes and account updates</span>
            </div>
            {auditLoading ? (
              <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-gray-300" /></div>
            ) : audit.length === 0 ? (
              <p className="p-10 text-center text-sm text-gray-500">Nothing recorded yet.</p>
            ) : (
              <ul className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                {audit.map(a => (
                  <li key={a.id} className="p-4 px-5 flex items-start gap-4 text-sm">
                    <span className="font-mono text-[11px] text-gray-400 pt-0.5 w-32 flex-shrink-0">
                      {new Date(a.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-800 text-xs uppercase tracking-wide">{a.action.replace(/_/g, ' ')}</p>
                      <p className="text-gray-600 mt-0.5">{a.detail || '—'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{a.actorEmail || 'unknown'}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {isAddOpen && (
        <AddMemberModal
          roles={roles}
          onClose={() => setIsAddOpen(false)}
          onCreated={(u) => { setUsers(prev => [...prev, u]); setIsAddOpen(false); flash(`${u.displayName} can now sign in.`); }}
          onError={setError}
        />
      )}

      {pwUser && (
        <PasswordModal
          user={pwUser}
          onClose={() => setPwUser(null)}
          onDone={() => { flash(`Password updated for ${pwUser.displayName}.`); setPwUser(null); }}
          onError={setError}
        />
      )}

      {confirm && (
        <ConfirmModal
          title={confirm.activate ? 'Reactivate this account?' : 'Deactivate this account?'}
          body={confirm.activate
            ? `${confirm.user.displayName} will be able to sign in again and hold leads.`
            : `${confirm.user.displayName} will not be able to sign in. Their history and past activity are kept, and you can reactivate them at any time.`}
          confirmLabel={confirm.activate ? 'Reactivate' : 'Deactivate'}
          destructive={!confirm.activate}
          busy={busyId === confirm.user.id}
          onCancel={() => setConfirm(null)}
          onConfirm={applyActive}
        />
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */

const Shell: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> =
  ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
      role="dialog" aria-modal="true" aria-label={title}
      className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
    >
      <div className="flex items-center justify-between p-6 pb-2">
        <h3 className="text-xl font-bold">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl" aria-label="Close"><X size={20} /></button>
      </div>
      <div className="p-6 pt-4">{children}</div>
    </motion.div>
  </div>
);

const field = "w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20";
const label = "block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1";

const AddMemberModal: React.FC<{
  roles: RoleOptionDTO[];
  onClose: () => void;
  onCreated: (u: StaffUserDTO) => void;
  onError: (m: string) => void;
}> = ({ roles, onClose, onCreated, onError }) => {
  const grantable = roles.filter(r => r.grantable && r.value !== 'NONE');
  const [form, setForm] = useState({
    displayName: '', email: '', phone: '', password: '',
    role: (grantable.find(r => r.value === 'SALES_EXECUTIVE')?.value ?? grantable[0]?.value ?? 'VIEWER') as RoleName,
  });
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      setLocalError('Password must be at least 8 characters.');
      return;
    }
    setSaving(true);
    setLocalError(null);
    try {
      onCreated(await userService.create(form));
    } catch (err) {
      const msg = errorMessage(err, 'Could not create that account.');
      setLocalError(msg);
      onError(msg);
    } finally {
      setSaving(false);
    }
  };

  const chosen = grantable.find(r => r.value === form.role);

  return (
    <Shell title="Add a team member" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {localError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">{localError}</p>
        )}
        <div>
          <label className={label} htmlFor="tm-name">Full name</label>
          <input id="tm-name" required value={form.displayName}
            onChange={e => setForm({ ...form, displayName: e.target.value })}
            className={field} placeholder="Sneha Kulkarni" />
        </div>
        <div>
          <label className={label} htmlFor="tm-email">Email</label>
          <input id="tm-email" type="email" required value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            className={field} placeholder="sneha@devanshedutech.com" />
        </div>
        <div>
          <label className={label} htmlFor="tm-phone">Phone <span className="normal-case font-normal">(optional)</span></label>
          <input id="tm-phone" value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            className={field} placeholder="+91 98765 43210" />
        </div>
        <div>
          <label className={label} htmlFor="tm-role">Role</label>
          <select id="tm-role" value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value as RoleName })}
            className={field}>
            {grantable.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          {chosen && <p className="text-xs text-gray-500 mt-2 ml-1">{chosen.description}</p>}
        </div>
        <div>
          <label className={label} htmlFor="tm-pw">Temporary password</label>
          <input id="tm-pw" type="password" required minLength={8} value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            className={field} placeholder="At least 8 characters" />
          <p className="text-xs text-gray-500 mt-2 ml-1">Share this with them directly. They can be given a new one at any time.</p>
        </div>
        <button type="submit" disabled={saving}
          className="w-full bg-primary text-white py-4 rounded-2xl font-bold hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
          {saving ? <><Loader2 size={18} className="animate-spin" /> Creating…</> : <><Save size={18} /> Create account</>}
        </button>
      </form>
    </Shell>
  );
};

const PasswordModal: React.FC<{
  user: StaffUserDTO;
  onClose: () => void;
  onDone: () => void;
  onError: (m: string) => void;
}> = ({ user, onClose, onDone, onError }) => {
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setLocalError('Password must be at least 8 characters.'); return; }
    setSaving(true);
    try {
      await userService.resetPassword(user.id, password);
      onDone();
    } catch (err) {
      const msg = errorMessage(err, 'Could not set that password.');
      setLocalError(msg);
      onError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Shell title={`New password for ${user.displayName}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {localError && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">{localError}</p>}
        <div>
          <label className={label} htmlFor="pw-new">New password</label>
          <input id="pw-new" type="password" required minLength={8} autoFocus value={password}
            onChange={e => setPassword(e.target.value)} className={field} placeholder="At least 8 characters" />
        </div>
        <p className="text-xs text-gray-500 ml-1">
          They will need to sign in again with this password. Send it to them over a private channel.
        </p>
        <button type="submit" disabled={saving}
          className="w-full bg-primary text-white py-4 rounded-2xl font-bold hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
          {saving ? <><Loader2 size={18} className="animate-spin" /> Saving…</> : <><KeyRound size={18} /> Set password</>}
        </button>
      </form>
    </Shell>
  );
};

const ConfirmModal: React.FC<{
  title: string; body: string; confirmLabel: string; destructive?: boolean; busy?: boolean;
  onCancel: () => void; onConfirm: () => void;
}> = ({ title, body, confirmLabel, destructive, busy, onCancel, onConfirm }) => (
  <Shell title={title} onClose={onCancel}>
    <p className="text-gray-600 text-sm leading-relaxed mb-6">{body}</p>
    <div className="flex gap-3">
      <button onClick={onCancel} className="flex-1 py-3 rounded-2xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
        Cancel
      </button>
      <button onClick={onConfirm} disabled={busy}
        className={`flex-1 py-3 rounded-2xl font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2 transition-colors ${
          destructive ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
        {busy && <Loader2 size={16} className="animate-spin" />}{confirmLabel}
      </button>
    </div>
  </Shell>
);

export default AdminTeam;
