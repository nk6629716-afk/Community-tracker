import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Filter,
  Search,
  MapPin,
  FileText,
  User,
  ArrowRight,
  Send,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  ChevronRight,
  Eye,
  Tag,
  CheckSquare
} from 'lucide-react';
import { Issue, IssueStatus } from '../../types';
import { AuthUser, api } from '../../services/api';
import { InteractiveMap } from '../map/InteractiveMap';
import { CATEGORY_LABELS, SEVERITY_INFO, STATUS_INFO } from '../../utils/priority';
import { formatDateTime, getTicketId } from '../../utils/formatters';

interface AuthorityDashboardProps {
  user: AuthUser;
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
  onRefresh?: () => void;
}

export const AuthorityDashboard: React.FC<AuthorityDashboardProps> = ({
  user,
  issues,
  onSelectIssue,
  onRefresh,
}) => {
  // Navigation between Incident Management & Master User Management
  const [tabMode, setTabMode] = useState<'incidents' | 'users'>('incidents');

  // Incident state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [activeIssue, setActiveIssue] = useState<Issue | null>(issues[0] || null);
  const [statusComment, setStatusComment] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [viewMode, setViewMode] = useState<'queue' | 'map'>('queue');
  const [updateFeedback, setUpdateFeedback] = useState<string | null>(null);

  // User & Officer Management State
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'CITIZEN' | 'AUTHORITY' | 'ADMIN'>('all');
  
  // Officer Provisioning Form
  const [officerName, setOfficerName] = useState('');
  const [officerEmail, setOfficerEmail] = useState('');
  const [officerPassword, setOfficerPassword] = useState('');
  const [officerDept, setOfficerDept] = useState('');
  const [officerArea, setOfficerArea] = useState('');
  const [officerAge, setOfficerAge] = useState('');
  const [isCreatingOfficer, setIsCreatingOfficer] = useState(false);
  const [officerSuccessMessage, setOfficerSuccessMessage] = useState<string | null>(null);
  const [officerErrorMessage, setOfficerErrorMessage] = useState<string | null>(null);

  // Fetch Users
  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (tabMode === 'users') {
      fetchUsers();
    }
  }, [tabMode]);

  // Handle direct officer provisioning
  const handleCreateOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingOfficer(true);
    setOfficerSuccessMessage(null);
    setOfficerErrorMessage(null);

    try {
      const res = await api.createOfficer({
        name: officerName,
        email: officerEmail,
        password: officerPassword,
        department: officerDept || undefined,
        area: officerArea || undefined,
        age: officerAge ? Number(officerAge) : undefined,
      });

      setOfficerSuccessMessage(`✅ ${res.message || 'Municipal Officer provisioned successfully!'}`);
      setOfficerName('');
      setOfficerEmail('');
      setOfficerPassword('');
      setOfficerDept('');
      setOfficerArea('');
      setOfficerAge('');
      fetchUsers();
      setTimeout(() => setOfficerSuccessMessage(null), 5000);
    } catch (err: any) {
      setOfficerErrorMessage(err.message || 'Failed to create officer account');
    } finally {
      setIsCreatingOfficer(false);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove user "${name}"?`)) return;
    try {
      await api.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  // Handle user role change
  const handleRoleChange = async (id: string, newRole: 'CITIZEN' | 'AUTHORITY' | 'ADMIN') => {
    try {
      await api.updateUserRole(id, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: newRole } : u))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    }
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.area && u.area.toLowerCase().includes(q));
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Filter issues
  const filteredIssues = issues.filter((issue) => {
    const q = searchQuery.trim().toLowerCase();
    const ticket = getTicketId(issue).toLowerCase();
    const matchesSearch =
      !q ||
      ticket.includes(q) ||
      issue.title.toLowerCase().includes(q) ||
      issue.description.toLowerCase().includes(q) ||
      issue.address.toLowerCase().includes(q) ||
      issue.id.toLowerCase().includes(q) ||
      issue.category.toLowerCase().includes(q);

    const matchesStatus = selectedStatus === 'all' || issue.status === selectedStatus;
    const matchesCategory = selectedCategory === 'all' || issue.category === selectedCategory;
    const matchesSeverity = selectedSeverity === 'all' || issue.severity === selectedSeverity;

    return matchesSearch && matchesStatus && matchesCategory && matchesSeverity;
  });

  // Calculate stats
  const totalReports = issues.length;
  const inTriage = issues.filter((i) => i.status === 'reported').length;
  const inProgress = issues.filter((i) => i.status === 'in_progress').length;
  const resolved = issues.filter((i) => i.status === 'resolved').length;
  const criticalCount = issues.filter((i) => i.severity === 'critical' && i.status !== 'resolved').length;

  const handleUpdateStatus = async (targetIssue: Issue, newStatus: IssueStatus) => {
    try {
      setIsUpdating(true);
      setUpdateFeedback(null);
      await api.updateStatus(targetIssue.id, newStatus, statusComment || undefined);
      setUpdateFeedback(`Status successfully updated to "${newStatus.replace('_', ' ')}"`);
      setStatusComment('');
      // Keep activeIssue updated
      setActiveIssue((prev) => (prev && prev.id === targetIssue.id ? { ...prev, status: newStatus } : prev));
      if (onRefresh) onRefresh();
      setTimeout(() => setUpdateFeedback(null), 4000);
    } catch (err: any) {
      console.error('Failed to update status:', err);
      setUpdateFeedback(err.message || 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Authority Header Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-cyan-500/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/10 via-violet-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                <span>Municipal Authority Triage Station</span>
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-400/20 text-violet-300 text-xs font-medium">
                <span>{user.name} ({user.role})</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Command Dispatch & Incident Management
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Inspect citizen-reported signals, review automated AI triage assessments, and broadcast status transitions in real time across the city grid.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'queue' ? 'map' : 'queue')}
              className="btn-glass-secondary px-4 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>{viewMode === 'queue' ? 'Switch to Map' : 'Switch to Queue'}</span>
            </button>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                title="Refresh feed"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 4 Core Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Total Ingested
            </span>
            <span className="text-3xl font-black text-white mt-1 block">
              {totalReports}
            </span>
            <span className="text-[11px] text-slate-500">Live signals in database</span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                Pending Triage
              </span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-3xl font-black text-amber-300 mt-1 block">
              {inTriage}
            </span>
            <span className="text-[11px] text-amber-400/80">Requires verification</span>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider block">
                Dispatched / In Progress
              </span>
              <AlertTriangle className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-3xl font-black text-cyan-300 mt-1 block">
              {inProgress}
            </span>
            <span className="text-[11px] text-cyan-400/80">Crews currently deployed</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">
                Resolved & Closed
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-3xl font-black text-emerald-300 mt-1 block">
              {resolved}
            </span>
            <span className="text-[11px] text-emerald-400/80">
              {criticalCount > 0 ? `${criticalCount} critical unresolved` : 'Zero active critical'}
            </span>
          </div>
        </div>
      </div>

      {/* MASTER SECTION SWITCHER TABS */}
      <div className="flex items-center gap-3 p-1.5 bg-white/5 rounded-2xl border border-white/10 max-w-xl">
        <button
          onClick={() => setTabMode('incidents')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            tabMode === 'incidents'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Incident Queue & Triage</span>
          <span className="px-2 py-0.5 rounded-full bg-black/30 text-cyan-200 text-[11px] font-mono">
            {issues.length}
          </span>
        </button>

        <button
          onClick={() => setTabMode('users')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            tabMode === 'users'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Master User Directory & Officers</span>
          {users.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-black/30 text-violet-200 text-[11px] font-mono">
              {users.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB CONTENT: MASTER USER MANAGEMENT */}
      {tabMode === 'users' && (
        <div className="space-y-8 animate-fade-in">
          {/* Top Row: Officer Provisioning Form */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-violet-500/30 bg-gradient-to-br from-violet-950/40 via-slate-900/60 to-cyan-950/40 shadow-2xl">
            <div className="max-w-4xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-400/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Master Administrator Control</span>
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Direct Municipal Officer Provisioning
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 mb-6">
                Directly create verified Municipal Officer accounts with ward assignments without requiring manual code entry.
              </p>

              {officerSuccessMessage && (
                <div className="mb-5 p-4 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold animate-fade-in">
                  {officerSuccessMessage}
                </div>
              )}

              {officerErrorMessage && (
                <div className="mb-5 p-4 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-200 text-xs font-bold animate-fade-in">
                  {officerErrorMessage}
                </div>
              )}

              <form onSubmit={handleCreateOfficer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Officer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    placeholder="e.g. Officer Vikram Sharma"
                    className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Officer Official Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={officerEmail}
                    onChange={(e) => setOfficerEmail(e.target.value)}
                    placeholder="vikram.sharma@citypulse.gov"
                    className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Temporary Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={officerPassword}
                    onChange={(e) => setOfficerPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Department / Division
                  </label>
                  <input
                    type="text"
                    value={officerDept}
                    onChange={(e) => setOfficerDept(e.target.value)}
                    placeholder="e.g. Roads & Transport Dept"
                    className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Assigned Ward / Jurisdiction
                  </label>
                  <input
                    type="text"
                    value={officerArea}
                    onChange={(e) => setOfficerArea(e.target.value)}
                    placeholder="e.g. Ward 12 - South Zone"
                    className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={officerAge}
                    onChange={(e) => setOfficerAge(e.target.value)}
                    placeholder="34"
                    className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3 pt-2">
                  <button
                    type="submit"
                    disabled={isCreatingOfficer}
                    className="btn-glass-primary py-3 px-6 rounded-xl text-white text-sm font-bold shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isCreatingOfficer ? (
                      <span>Provisioning Officer...</span>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4 text-cyan-300" />
                        <span>Create & Verify Municipal Officer</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* User Directory & Management */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white">Registered User Directory</h3>
                <p className="text-xs text-slate-400">
                  Manage citizens, active municipal officers, and authorities in the database
                </p>
              </div>

              <button
                onClick={fetchUsers}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition border border-white/10 cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Directory</span>
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search users by name, email, or area..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400/50"
                />
              </div>

              <div className="flex items-center gap-2">
                {(['all', 'CITIZEN', 'AUTHORITY', 'ADMIN'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setUserRoleFilter(r)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      userRoleFilter === r
                        ? 'bg-violet-600 text-white font-bold'
                        : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
                    }`}
                  >
                    {r === 'all' ? 'All Roles' : r === 'CITIZEN' ? 'Citizens' : r === 'AUTHORITY' ? 'Officers' : 'Admins'}
                  </button>
                ))}
              </div>
            </div>

            {/* Users Table */}
            {isLoadingUsers ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Loading user directory from database...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs bg-white/5 rounded-2xl border border-white/10">
                No users found matching your search.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-white/5 border-b border-white/10 uppercase tracking-wider text-[10px] text-slate-400 font-bold">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Ward / Department</th>
                      <th className="py-3 px-4">Age</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-white/5 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{u.name}</div>
                          <div className="text-slate-400 font-mono text-[11px]">{u.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase border ${
                              u.role === 'ADMIN' || u.role === 'AUTHORITY'
                                ? 'bg-cyan-500/15 border-cyan-400/30 text-cyan-300'
                                : 'bg-violet-500/15 border-violet-400/30 text-violet-300'
                            }`}
                          >
                            {u.role === 'AUTHORITY' ? 'Municipal Officer' : u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {u.area || '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {u.age ? `${u.age} yrs` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          {u.role === 'CITIZEN' ? (
                            <button
                              onClick={() => handleRoleChange(u.id, 'AUTHORITY')}
                              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-semibold text-[11px] border border-cyan-500/30 transition cursor-pointer"
                            >
                              Promote to Officer
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRoleChange(u.id, 'CITIZEN')}
                              className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold text-[11px] transition cursor-pointer"
                            >
                              Set to Citizen
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-semibold text-[11px] border border-rose-500/30 transition cursor-pointer"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: INCIDENT MANAGEMENT */}
      {tabMode === 'incidents' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          {/* Left Column: Filter Controls & Incident List (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Filter Bar */}
            <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by ID, keyword, road or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400/50"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-200 focus:outline-none focus:border-cyan-400/50"
                  >
                    <option value="all" className="bg-slate-900">All Statuses</option>
                    <option value="reported" className="bg-slate-900">Reported</option>
                    <option value="in_progress" className="bg-slate-900">In Progress</option>
                    <option value="resolved" className="bg-slate-900">Resolved</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-200 focus:outline-none focus:border-cyan-400/50"
                  >
                    <option value="all" className="bg-slate-900">All Categories</option>
                    <option value="road_damage" className="bg-slate-900">Roads</option>
                    <option value="garbage" className="bg-slate-900">Garbage</option>
                    <option value="water_leakage" className="bg-slate-900">Water</option>
                    <option value="streetlight" className="bg-slate-900">Streetlight</option>
                    <option value="drainage" className="bg-slate-900">Drainage</option>
                    <option value="electricity" className="bg-slate-900">Electricity</option>
                    <option value="infrastructure" className="bg-slate-900">Infrastructure</option>
                    <option value="public_space" className="bg-slate-900">Public Space</option>
                    <option value="other" className="bg-slate-900">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Severity</label>
                  <select
                    value={selectedSeverity}
                    onChange={(e) => setSelectedSeverity(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-200 focus:outline-none focus:border-cyan-400/50"
                  >
                    <option value="all" className="bg-slate-900">All Severities</option>
                    <option value="critical" className="bg-slate-900">Critical</option>
                    <option value="high" className="bg-slate-900">High</option>
                    <option value="medium" className="bg-slate-900">Medium</option>
                    <option value="low" className="bg-slate-900">Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* View Mode Toggle: Queue or Interactive Map */}
            {viewMode === 'map' ? (
              <div className="glass-card rounded-2xl p-4 border border-white/10 overflow-hidden">
                <div className="h-[520px] rounded-xl overflow-hidden relative">
                  <InteractiveMap
                    issues={filteredIssues}
                    selectedIssue={activeIssue}
                    onSelectIssue={(i) => {
                      setActiveIssue(i);
                      onSelectIssue(i);
                    }}
                    height="100%"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Showing {filteredIssues.length} incident reports</span>
                  <span>Click report to inspect & dispatch</span>
                </div>

                {filteredIssues.length === 0 ? (
                  <div className="glass-card rounded-2xl p-12 text-center border border-white/10">
                    <p className="text-slate-400 text-sm">No incidents match the active filter criteria.</p>
                  </div>
                ) : (
                  filteredIssues.map((issue) => {
                    const isSelected = activeIssue?.id === issue.id;
                    const sev = SEVERITY_INFO[issue.severity] || SEVERITY_INFO.medium;
                    const stat = STATUS_INFO[issue.status] || STATUS_INFO.reported;

                    return (
                      <div
                        key={issue.id}
                        onClick={() => {
                          setActiveIssue(issue);
                          onSelectIssue(issue);
                        }}
                        className={`glass-card rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer relative ${
                          isSelected
                            ? 'border-cyan-400/60 bg-white/10 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                            : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/15 px-2.5 py-0.5 rounded-lg border border-cyan-400/30 flex items-center gap-1">
                                <Tag className="w-3 h-3 text-cyan-400" />
                                <span>{getTicketId(issue)}</span>
                              </span>
                              <span
                                className="text-xs font-semibold px-2.5 py-0.5 rounded-full border"
                                style={{
                                  color: stat.color,
                                  backgroundColor: `${stat.color}15`,
                                  borderColor: `${stat.color}30`,
                                }}
                              >
                                {stat.label}
                              </span>
                              <span
                                className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                                style={{
                                  color: sev.color,
                                  backgroundColor: `${sev.color}15`,
                                  borderColor: `${sev.color}30`,
                                }}
                              >
                                {sev.label} Priority
                              </span>
                            </div>

                            <h3 className="text-base font-bold text-white truncate pt-1">
                              {issue.title}
                            </h3>

                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="truncate">{issue.address}</span>
                            </div>
                          </div>

                          <ChevronRight
                            className={`w-5 h-5 text-slate-500 transition-transform ${
                              isSelected ? 'rotate-90 text-cyan-400' : ''
                            }`}
                          />
                        </div>

                        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
                          <span>Reported by: <strong className="text-slate-300 font-medium">{issue.created_by}</strong></span>
                          <span>{formatDateTime(issue.created_at)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Right Column: Active Incident Details & Dispatch Station (5 cols) */}
          <div className="lg:col-span-5">
            {activeIssue ? (
              <div className="glass-card rounded-3xl p-6 border border-cyan-500/30 sticky top-24 space-y-6">
                {/* Header Details */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/15 px-2.5 py-1 rounded-lg border border-cyan-400/30 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Ticket: {getTicketId(activeIssue)}</span>
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatDateTime(activeIssue.created_at)}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {activeIssue.title}
                  </h2>

                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                    <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>{activeIssue.address}</span>
                  </div>
                </div>

                {/* Photo preview if present */}
                {(activeIssue.photo_url || ((activeIssue as any).photos && (activeIssue as any).photos.length > 0)) && (
                  <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/40 h-44 relative">
                    <img
                      src={activeIssue.photo_url || (activeIssue as any).photos[0]}
                      alt="Evidence photograph"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-black/70 text-white px-2 py-1 rounded backdrop-blur-md">
                      Citizen Photo Attachment
                    </span>
                  </div>
                )}

                {/* Description */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Description of Problem
                  </span>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {activeIssue.description}
                  </p>
                </div>

                {/* AI Auto-Triage Assessment */}
                {activeIssue.ai_summary && (
                  <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 space-y-2">
                    <div className="flex items-center gap-2 text-violet-300 text-xs font-bold">
                      <Sparkles className="w-4 h-4 text-violet-400" />
                      <span>Automated AI Assessment</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {activeIssue.ai_summary}
                    </p>
                  </div>
                )}

                {/* Real-time Status Dispatcher */}
                <div className="p-5 rounded-2xl bg-cyan-500/5 border border-cyan-400/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                      Administrative Action & Status Controls
                    </span>
                    <span className="text-xs text-slate-400">
                      Live broadcast via WebSockets
                    </span>
                  </div>

                  {updateFeedback && (
                    <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs font-medium animate-fade-in">
                      {updateFeedback}
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                      Officer Resolution Notes / Work Order Remarks
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Work crew unit 4 dispatched for immediate clearance."
                      value={statusComment}
                      onChange={(e) => setStatusComment(e.target.value)}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      disabled={isUpdating || activeIssue.status === 'reported'}
                      onClick={() => handleUpdateStatus(activeIssue, 'reported')}
                      className={`p-3 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        activeIssue.status === 'reported'
                          ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                          : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Mark Submitted</span>
                    </button>

                    <button
                      disabled={isUpdating || activeIssue.status === 'in_progress'}
                      onClick={() => handleUpdateStatus(activeIssue, 'in_progress')}
                      className={`p-3 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        activeIssue.status === 'in_progress'
                          ? 'bg-cyan-500/25 border-cyan-400/60 text-cyan-200 shadow-md'
                          : 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 text-cyan-300'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Mark Under Process</span>
                    </button>

                    <button
                      disabled={isUpdating || activeIssue.status === 'resolved'}
                      onClick={() => handleUpdateStatus(activeIssue, 'resolved')}
                      className={`col-span-2 p-3.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-2 ${
                        activeIssue.status === 'resolved'
                          ? 'bg-emerald-500/25 border-emerald-400/60 text-emerald-200'
                          : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-300'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{isUpdating ? 'Updating Status...' : 'Mark Complaint Done / Resolved'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-3xl p-12 text-center border border-white/10">
                <p className="text-slate-400 text-sm">Select an incident from the queue to view details.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
