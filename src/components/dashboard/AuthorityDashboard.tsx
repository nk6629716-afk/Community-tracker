import React, { useState, useEffect } from 'react';
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
  CheckSquare,
  UserPlus,
  Users,
  ShieldCheck,
  Award,
  Trash2,
  Key,
  Copy,
  Check,
  Radio,
  Megaphone,
  Sliders,
  Download,
  Cpu,
  Terminal,
  X,
  Shield
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
  // Navigation between Incident Management, User Management, Officer Provisioning, and Advanced Controls
  const [tabMode, setTabMode] = useState<'incidents' | 'users' | 'provision' | 'security'>('incidents');

  // Password Reset Verification Code State
  const [activeGeneratedCode, setActiveGeneratedCode] = useState<{
    code: string;
    email: string;
    userName: string;
    expiresAt: string;
    instructions?: string;
  } | null>(null);
  const [isCopiedCode, setIsCopiedCode] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState<string | null>(null);

  // 10-Minute Master Admin Dispatch Authorization State
  const [dispatchCodeInput, setDispatchCodeInput] = useState('');
  const [activeDispatchCodesList, setActiveDispatchCodesList] = useState<any[]>([]);
  const [isLoadingDispatchCodes, setIsLoadingDispatchCodes] = useState(false);
  const [isGeneratingDispatchCode, setIsGeneratingDispatchCode] = useState(false);
  const [dispatchCodeNote, setDispatchCodeNote] = useState('');
  const [latestGeneratedDispatchCode, setLatestGeneratedDispatchCode] = useState<{
    code: string;
    expiresAt: string;
    expiresInSeconds: number;
    generatedBy: string;
  } | null>(null);
  const [isCopiedDispatchCode, setIsCopiedDispatchCode] = useState(false);
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());

  // Advanced Security & Admin Controls State
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSeverity, setBroadcastSeverity] = useState<'high' | 'critical'>('high');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState<string | null>(null);
  const [directCodeIdentifier, setDirectCodeIdentifier] = useState('');
  const [activeResetCodesList, setActiveResetCodesList] = useState<any[]>([]);
  const [isLoadingCodes, setIsLoadingCodes] = useState(false);

  // 1-second interval ticker for live countdown timers on 10-minute codes
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimeRemaining = (expiresAtMs: number) => {
    const diff = Math.max(0, Math.floor((expiresAtMs - nowTimestamp) / 1000));
    if (diff <= 0) return 'Expired';
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes}m ${seconds < 10 ? '0' : ''}${seconds}s`;
  };

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

  // Load users automatically on mount
  useEffect(() => {
    fetchUsers();
    fetchActiveDispatchCodes();
  }, []);

  // Fetch Active Developer Reset Codes
  const fetchActiveResetCodes = async () => {
    try {
      setIsLoadingCodes(true);
      const data = await api.getResetCodes();
      setActiveResetCodesList(data);
    } catch (err: any) {
      console.warn('Failed to load active reset codes:', err);
    } finally {
      setIsLoadingCodes(false);
    }
  };

  // Fetch Active 10-Minute Dispatch Codes
  const fetchActiveDispatchCodes = async () => {
    try {
      setIsLoadingDispatchCodes(true);
      const data = await api.getDispatchCodes();
      setActiveDispatchCodesList(data);
    } catch (err: any) {
      console.warn('Failed to load active dispatch codes:', err);
    } finally {
      setIsLoadingDispatchCodes(false);
    }
  };

  useEffect(() => {
    if (tabMode === 'users' || tabMode === 'provision') {
      fetchUsers();
    }
    if (tabMode === 'security') {
      fetchActiveResetCodes();
      fetchActiveDispatchCodes();
      fetchUsers();
    }
  }, [tabMode]);

  // Handle Developer Reset Code Generation for a specific user
  const handleGenerateResetCode = async (identifier: string) => {
    try {
      setIsGeneratingCode(identifier);
      const res = await api.generateResetCode(identifier);
      setActiveGeneratedCode({
        code: res.code,
        email: res.email,
        userName: res.userName,
        expiresAt: res.expiresAt,
        instructions: res.instructions,
      });
      setIsCopiedCode(false);
      fetchActiveResetCodes();
    } catch (err: any) {
      alert(err.message || 'Failed to generate developer reset passcode');
    } finally {
      setIsGeneratingCode(null);
    }
  };

  // Handle 10-Minute Dispatch Code Generation (Master Admin Only)
  const handleGenerateDispatchCode = async (note?: string) => {
    try {
      setIsGeneratingDispatchCode(true);
      const res = await api.generateDispatchCode(note || dispatchCodeNote.trim() || undefined);
      setLatestGeneratedDispatchCode(res);
      setIsCopiedDispatchCode(false);
      setDispatchCodeNote('');
      await fetchActiveDispatchCodes();
    } catch (err: any) {
      alert(err.message || 'Failed to generate 10-minute dispatch authorization code');
    } finally {
      setIsGeneratingDispatchCode(false);
    }
  };

  // Handle Revoking a Dispatch Code
  const handleRevokeDispatchCode = async (code: string) => {
    if (!window.confirm(`Revoke 10-minute authorization code "${code}"?`)) return;
    try {
      await api.revokeDispatchCode(code);
      await fetchActiveDispatchCodes();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke authorization code');
    }
  };

  // Handle Emergency Broadcast
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    if (user.role === 'AUTHORITY' && !dispatchCodeInput.trim()) {
      setBroadcastStatus('⚠️ Error: Municipal Officers must provide an active 10-minute Master Admin authorization code.');
      return;
    }

    try {
      setIsBroadcasting(true);
      setBroadcastStatus(null);
      await api.broadcastEmergency(
        broadcastMessage.trim(), 
        broadcastSeverity,
        user.role === 'AUTHORITY' ? dispatchCodeInput.trim().toUpperCase() : undefined
      );
      setBroadcastStatus('📡 Emergency broadcast transmitted live across the civic mesh to every logged-in account!');
      setBroadcastMessage('');
      setDispatchCodeInput('');
      fetchActiveDispatchCodes();
      setTimeout(() => setBroadcastStatus(null), 7000);
    } catch (err: any) {
      setBroadcastStatus(`Broadcast authorization failed: ${err.message}`);
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Export Incident Dataset as JSON
  const handleExportIncidents = () => {
    const jsonStr = JSON.stringify(issues, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `citypulse_incident_telemetry_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-1.5 bg-white/5 rounded-2xl border border-white/10 max-w-3xl">
        <button
          onClick={() => setTabMode('incidents')}
          className={`flex-1 min-w-[160px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            tabMode === 'incidents'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-cyan-300" />
          <span>Incident Queue & Triage</span>
          <span className="px-2 py-0.5 rounded-full bg-black/30 text-cyan-200 text-[11px] font-mono">
            {issues.length}
          </span>
        </button>

        <button
          onClick={() => setTabMode('users')}
          className={`flex-1 min-w-[160px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            tabMode === 'users'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4 text-violet-300" />
          <span>User Access Control</span>
          {users.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-black/30 text-violet-200 text-[11px] font-mono">
              {users.length} Users
            </span>
          )}
        </button>

        <button
          onClick={() => setTabMode('provision')}
          className={`flex-1 min-w-[160px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            tabMode === 'provision'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <UserPlus className="w-4 h-4 text-emerald-300" />
          <span>Add Municipal Officer</span>
        </button>

        <button
          onClick={() => setTabMode('security')}
          className={`flex-1 min-w-[160px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            tabMode === 'security'
              ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sliders className="w-4 h-4 text-amber-300" />
          <span>Advanced Admin & Security</span>
          {activeResetCodesList.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-black/40 text-amber-300 text-[10px] font-mono">
              {activeResetCodesList.length} Codes
            </span>
          )}
        </button>
      </div>

      {/* TAB CONTENT: PROVISION OFFICER */}
      {tabMode === 'provision' && (
        <div className="space-y-8 animate-fade-in">
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900/60 to-cyan-950/40 shadow-2xl">
            <div className="max-w-4xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Municipal Officer Provisioning Desk</span>
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Register New Municipal Officer
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 mb-6">
                Create verified municipal officer accounts with assigned municipal department, jurisdiction/ward, and immediate clearance.
              </p>

              {officerSuccessMessage && (
                <div className="mb-5 p-4 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold animate-fade-in flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{officerSuccessMessage}</span>
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
                    placeholder="e.g. Public Works Dept (PWD)"
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

                <div className="sm:col-span-2 lg:col-span-3 pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isCreatingOfficer}
                    className="btn-glass-primary py-3 px-6 rounded-xl text-white text-sm font-bold shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isCreatingOfficer ? (
                      <span>Provisioning Officer...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-cyan-300" />
                        <span>Create & Verify Municipal Officer</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTabMode('users')}
                    className="py-3 px-5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-sm font-semibold transition border border-white/10 cursor-pointer"
                  >
                    View All Users & Officers
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: MASTER USER MANAGEMENT */}
      {tabMode === 'users' && (
        <div className="space-y-8 animate-fade-in">
          {/* Quick Add Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-violet-900/30 via-slate-900/40 to-cyan-900/30 border border-violet-500/20">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-400" />
                <span>Municipal User Directory & Access Management</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Grant municipal officer status to citizens or provision dedicated officer logins.
              </p>
            </div>
            <button
              onClick={() => setTabMode('provision')}
              className="btn-glass-primary px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-cyan-300" />
              <span>+ Add New Municipal Officer</span>
            </button>
          </div>

          {/* User Directory & Management */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white">Registered User Directory & Access Control</h3>
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
                      <th className="py-3 px-4">User Details</th>
                      <th className="py-3 px-4">Role & Clearance</th>
                      <th className="py-3 px-4">Ward / Department</th>
                      <th className="py-3 px-4">Age</th>
                      <th className="py-3 px-4 text-right">Access Grant / Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-white/5 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{u.name}</span>
                            {u.id === 'admin_master_001' && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[9px] font-mono">
                                MASTER
                              </span>
                            )}
                          </div>
                          <div className="text-slate-400 font-mono text-[11px]">{u.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase border ${
                              u.role === 'ADMIN'
                                ? 'bg-amber-500/15 border-amber-400/30 text-amber-300'
                                : u.role === 'AUTHORITY'
                                ? 'bg-cyan-500/15 border-cyan-400/30 text-cyan-300'
                                : 'bg-violet-500/15 border-violet-400/30 text-violet-300'
                            }`}
                          >
                            {u.role === 'AUTHORITY' ? '🛡️ Municipal Officer' : u.role === 'ADMIN' ? '👑 Master Admin' : 'Citizen'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {u.area || u.department || '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {u.age ? `${u.age} yrs` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5">
                          {u.id !== 'admin_master_001' && (
                            <>
                              {u.role === 'CITIZEN' ? (
                                <button
                                  onClick={() => handleRoleChange(u.id, 'AUTHORITY')}
                                  className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-semibold text-[11px] border border-cyan-500/30 transition cursor-pointer"
                                  title="Grant Municipal Officer access"
                                >
                                  Grant Officer
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleRoleChange(u.id, 'CITIZEN')}
                                  className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold text-[11px] transition cursor-pointer"
                                  title="Demote to standard citizen"
                                >
                                  Set Citizen
                                </button>
                              )}

                              <button
                                onClick={() => handleGenerateResetCode(u.id)}
                                disabled={isGeneratingCode === u.id}
                                className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-semibold text-[11px] border border-amber-500/30 transition cursor-pointer inline-flex items-center gap-1"
                                title="Generate Developer Password Reset Verification Passcode"
                              >
                                <Key className="w-3 h-3" />
                                <span>{isGeneratingCode === u.id ? 'Generating...' : 'Reset Code'}</span>
                              </button>

                              <button
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-semibold text-[11px] border border-rose-500/30 transition cursor-pointer"
                                title="Revoke access and delete account"
                              >
                                Revoke
                              </button>
                            </>
                          )}
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

      {/* TAB CONTENT: ADVANCED ADMIN & SECURITY CONTROLS */}
      {tabMode === 'security' && (
        <div className="space-y-8 animate-fade-in">
          {/* Emergency Alert Dispatch Console */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-slate-900/60 to-orange-950/30 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Megaphone className="w-3.5 h-3.5 text-amber-400" />
                  <span>Civic Emergency Dispatch Terminal</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/50 flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 animate-pulse" />
                  <span>LIVE MESH SOCKET</span>
                </span>
              </div>

              {/* Master Admin Direct Action or Municipal Officer Badge */}
              {user.role === 'ADMIN' ? (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-200 text-xs font-bold flex items-center gap-1.5">
                    👑 Master Admin Direct Authority
                  </span>
                  <button
                    type="button"
                    onClick={() => handleGenerateDispatchCode()}
                    disabled={isGeneratingDispatchCode}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>{isGeneratingDispatchCode ? 'Generating...' : '+ Issue 10-Min Officer Code'}</span>
                  </button>
                </div>
              ) : (
                <span className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-bold flex items-center gap-1.5">
                  🛡️ Municipal Officer Clearance
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white">
              City-Wide Incident Alert & Mesh Broadcast
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 mb-5">
              Dispatch high-priority alert signals directly to every account currently logged in across the real-time civic network.
            </p>

            {/* Quick Master Admin Generated Code Callout (if just generated) */}
            {latestGeneratedDispatchCode && user.role === 'ADMIN' && (
              <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-purple-950/70 via-slate-900/80 to-amber-950/70 border border-amber-400/50 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold border border-amber-400/30">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">10-Minute Officer Dispatch Passcode:</span>
                      <span className="font-mono font-black text-amber-300 text-sm tracking-wider px-2 py-0.5 rounded bg-black/50 border border-amber-400/40">
                        {latestGeneratedDispatchCode.code}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-300">
                      Share this code with Municipal Officers. Expires in{' '}
                      <strong className="text-amber-400">
                        {formatTimeRemaining(new Date(latestGeneratedDispatchCode.expiresAt).getTime())}
                      </strong>.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(latestGeneratedDispatchCode.code);
                    setIsCopiedDispatchCode(true);
                    setTimeout(() => setIsCopiedDispatchCode(false), 2000);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition border border-white/20 cursor-pointer self-start sm:self-auto"
                >
                  {isCopiedDispatchCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopiedDispatchCode ? 'Copied to Clipboard' : 'Copy Code'}</span>
                </button>
              </div>
            )}

            {broadcastStatus && (
              <div className={`mb-5 p-4 rounded-xl text-xs font-bold animate-fade-in flex items-center gap-2 border ${
                broadcastStatus.includes('failed') || broadcastStatus.includes('Error') || broadcastStatus.includes('Invalid')
                  ? 'bg-red-500/20 border-red-400/40 text-red-200'
                  : 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
              }`}>
                <Radio className="w-4 h-4 animate-pulse shrink-0" />
                <span>{broadcastStatus}</span>
              </div>
            )}

            <form onSubmit={handleSendBroadcast} className="space-y-4 max-w-3xl">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Alert Message & Civic Advisory *
                </label>
                <input
                  type="text"
                  required
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="e.g. Flash flood warning in Sector 4. Municipal squads deployed. Avoid underpass."
                  className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                />
              </div>

              {/* Master Admin Authorization Code Field for Municipal Officers */}
              {user.role === 'AUTHORITY' && (
                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      <span>10-Minute Master Admin Authorization Code *</span>
                    </label>
                    <span className="text-[10px] text-amber-400/80 font-mono">10-MIN EXPIRY ENFORCED</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={dispatchCodeInput}
                    onChange={(e) => setDispatchCodeInput(e.target.value.toUpperCase())}
                    placeholder="Enter 10-Minute Code (e.g. CMD-842913)"
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-sm font-mono tracking-wider font-bold placeholder:font-normal placeholder:tracking-normal"
                  />
                  <p className="text-[11px] text-slate-400">
                    Municipal Officers require a special 10-minute code exclusively generated from the Master Admin Dashboard.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-400">Severity Tier:</label>
                  <select
                    value={broadcastSeverity}
                    onChange={(e) => setBroadcastSeverity(e.target.value as any)}
                    className="glass-input px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-slate-900 border border-white/10"
                  >
                    <option value="high">High Advisory (Amber)</option>
                    <option value="critical">Critical Emergency (Red)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isBroadcasting}
                  className="btn-glass-primary px-6 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 cursor-pointer shadow-lg ml-auto"
                >
                  <Radio className="w-4 h-4 text-cyan-300 animate-pulse" />
                  <span>{isBroadcasting ? 'Transmitting Signal...' : 'Broadcast Across City Mesh'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* 10-MINUTE DISPATCH AUTHORIZATION CODE LEDGER (MASTER ADMIN & OFFICERS) */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  <h3 className="text-xl font-bold text-white">10-Minute Emergency Dispatch Clearance Ledger</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Master Admin time-locked authorization codes (10 minutes validity) required for Municipal Officers to dispatch emergency alerts.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchActiveDispatchCodes}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition border border-white/10 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDispatchCodes ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>

                {user.role === 'ADMIN' && (
                  <button
                    onClick={() => handleGenerateDispatchCode()}
                    disabled={isGeneratingDispatchCode}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>{isGeneratingDispatchCode ? 'Issuing...' : '+ Issue 10-Min Code'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Active Dispatch Codes Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Active 10-Minute Dispatch Passcodes ({activeDispatchCodesList.length})
                </span>
                <span className="text-[10px] text-amber-400/80 font-mono">EXPIRES AFTER 10 MINUTES</span>
              </div>

              {isLoadingDispatchCodes ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading active dispatch clearance codes...</div>
              ) : activeDispatchCodesList.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center text-xs text-slate-400">
                  {user.role === 'ADMIN'
                    ? 'No active 10-minute dispatch authorization codes currently live. Click "+ Issue 10-Min Code" above to grant temporary dispatch authority to Municipal Officers.'
                    : 'No active 10-minute dispatch codes currently live. Please ask the Master Administrator to generate an authorization code from their dashboard.'}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-white/5 text-slate-400 uppercase text-[10px] font-bold border-b border-white/10">
                      <tr>
                        <th className="p-3">Authorization Code</th>
                        <th className="p-3">Time Remaining</th>
                        <th className="p-3">Generated By</th>
                        <th className="p-3">Usage</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {activeDispatchCodesList.map((c) => {
                        const timeLeft = formatTimeRemaining(c.expiresAt);
                        const isExpired = timeLeft === 'Expired';
                        return (
                          <tr key={c.code} className="hover:bg-white/5 transition">
                            <td className="p-3 font-mono font-bold text-amber-300 text-sm">
                              {c.code}
                            </td>
                            <td className="p-3">
                              <span className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-full text-[11px] ${
                                isExpired 
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}>
                                <Clock className="w-3 h-3" />
                                <span>{timeLeft}</span>
                              </span>
                            </td>
                            <td className="p-3 text-slate-300">
                              <span className="font-semibold text-white">{c.generatedBy}</span>
                              {c.note && <span className="block text-[10px] text-slate-400">{c.note}</span>}
                            </td>
                            <td className="p-3 text-slate-400 font-mono text-[11px]">
                              {c.usedCount > 0 ? `Used (${c.usedCount}x)` : 'Unused'}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(c.code);
                                    alert(`Code "${c.code}" copied to clipboard!`);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center gap-1 transition cursor-pointer text-[11px]"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </button>
                                {user.role === 'ADMIN' && (
                                  <button
                                    onClick={() => handleRevokeDispatchCode(c.code)}
                                    className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold flex items-center gap-1 transition cursor-pointer text-[11px] border border-rose-500/30"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Revoke</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Developer Verification Passcodes & Password Recovery Console */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Key className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xl font-bold text-white">Developer Password Reset Authorization Console</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Generate secure, time-stamped verification codes for citizens or officers who require password recovery.
                </p>
              </div>

              <button
                onClick={fetchActiveResetCodes}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition border border-white/10 cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Codes</span>
              </button>
            </div>

            {/* Quick Identifier Generator Form */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 max-w-2xl">
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Generate Verification Code for Any Registered Email:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter citizen or officer email (e.g. citizen@citypulse.gov)"
                  value={directCodeIdentifier}
                  onChange={(e) => setDirectCodeIdentifier(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl glass-input text-xs"
                />
                <button
                  onClick={() => {
                    if (directCodeIdentifier.trim()) {
                      handleGenerateResetCode(directCodeIdentifier.trim());
                      setDirectCodeIdentifier('');
                    }
                  }}
                  disabled={!directCodeIdentifier.trim() || isGeneratingCode !== null}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingCode ? 'Generating...' : 'Issue Code'}
                </button>
              </div>
            </div>

            {/* Active Verification Codes Table */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Active Unexpired Authorization Passcodes ({activeResetCodesList.length})
              </span>

              {isLoadingCodes ? (
                <div className="p-8 text-center text-xs text-slate-400">Checking authorization ledger...</div>
              ) : activeResetCodesList.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center text-xs text-slate-400">
                  No active password reset passcodes currently pending. Generate a code using the form above or the User Access Control table.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-white/5 uppercase tracking-wider text-[10px] text-slate-400 font-bold border-b border-white/10">
                      <tr>
                        <th className="py-2.5 px-4">User Account</th>
                        <th className="py-2.5 px-4">Verification Passcode</th>
                        <th className="py-2.5 px-4">Expires</th>
                        <th className="py-2.5 px-4">Authorized By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {activeResetCodesList.map((rc: any, idx: number) => (
                        <tr key={idx} className="hover:bg-white/5">
                          <td className="py-2.5 px-4 font-semibold text-white">
                            <div>{rc.userName || 'Citizen'}</div>
                            <div className="text-slate-400 text-[11px] font-mono">{rc.email}</div>
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold text-cyan-300 text-sm">
                            <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-400/30">
                              {rc.code}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                            {new Date(rc.expiresAt).toLocaleTimeString()}
                          </td>
                          <td className="py-2.5 px-4 text-slate-300">
                            {rc.generatedBy}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Advanced Triage & Telemetry Operations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-white">Incident Data & Audit Management</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Download verified incident datasets or trigger automated pipeline syncs across municipal sub-stations.
              </p>
              <button
                onClick={handleExportIncidents}
                className="btn-glass-secondary px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 cursor-pointer w-full justify-center"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export Municipal Dataset (JSON)</span>
              </button>
            </div>

            <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Live Civic Mesh Telemetry</h4>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-slate-400 text-[10px] block">SOCKET.IO PROTOCOL</span>
                  <span className="text-emerald-400 font-bold font-mono">CONNECTED (14ms)</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-slate-400 text-[10px] block">SECURITY CLEARANCE</span>
                  <span className="text-cyan-300 font-bold font-mono">ROLE: {user.role}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GENERATED DEVELOPER VERIFICATION PASSCODE */}
      {activeGeneratedCode && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-modal w-full max-w-md rounded-3xl p-6 relative border border-amber-500/40 shadow-2xl space-y-5">
            <button
              onClick={() => setActiveGeneratedCode(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shadow-md">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Developer Passcode Issued</h3>
                <p className="text-xs text-slate-400">One-Time Account Password Recovery</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-black/60 border border-amber-400/30 text-center space-y-2">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Authorization Verification Passcode
              </span>
              <div className="text-3xl font-black font-mono tracking-widest text-cyan-300 py-1 select-all">
                {activeGeneratedCode.code}
              </div>
              <div className="text-[11px] text-slate-400">
                Issued for: <span className="text-white font-bold">{activeGeneratedCode.userName}</span> ({activeGeneratedCode.email})
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/10">
              ℹ️ Share this verification code with the user. They must enter this exact code on the <strong>Password Recovery Portal</strong> to verify their request and set a new password.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Citypulse Recovery Passcode: ${activeGeneratedCode.code}\nUser: ${activeGeneratedCode.userName} (${activeGeneratedCode.email})\nEnter this code on the Password Recovery portal to reset your password.`
                  );
                  setIsCopiedCode(true);
                  setTimeout(() => setIsCopiedCode(false), 3000);
                }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isCopiedCode ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Code & Instructions</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setActiveGeneratedCode(null)}
                className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
