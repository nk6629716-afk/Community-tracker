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
  Eye
} from 'lucide-react';
import { Issue, IssueStatus } from '../../types';
import { AuthUser, api } from '../../services/api';
import { InteractiveMap } from '../map/InteractiveMap';
import { CATEGORY_LABELS, SEVERITY_INFO, STATUS_INFO } from '../../utils/priority';
import { formatDateTime } from '../../utils/formatters';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [activeIssue, setActiveIssue] = useState<Issue | null>(issues[0] || null);
  const [statusComment, setStatusComment] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [viewMode, setViewMode] = useState<'queue' | 'map'>('queue');
  const [updateFeedback, setUpdateFeedback] = useState<string | null>(null);

  // Filter issues
  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.id.toLowerCase().includes(searchQuery.toLowerCase());

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

      {/* Main Command Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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
                  {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => (
                    <option key={catKey} value={catKey} className="bg-slate-900">
                      {label}
                    </option>
                  ))}
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
                            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-400/20">
                              #{issue.id.slice(0, 8)}
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
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-400/20">
                    ID: {activeIssue.id}
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
              {activeIssue.photos && activeIssue.photos.length > 0 && (
                <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/40 h-44 relative">
                  <img
                    src={activeIssue.photos[0]}
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
              {activeIssue.ai_analysis && (
                <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-violet-300 text-xs font-bold">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <span>Automated AI Assessment</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activeIssue.ai_analysis.suggested_action ||
                      `Categorized under ${activeIssue.category.toUpperCase()} with confidence score ${Math.round(
                        (activeIssue.ai_analysis.confidence || 0.9) * 100
                      )}%. Priority marked as ${activeIssue.severity}.`}
                  </p>
                </div>
              )}

              {/* Real-time Status Dispatcher */}
              <div className="p-5 rounded-2xl bg-cyan-500/5 border border-cyan-400/20 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                    Dispatch & Status Transition
                  </span>
                  <span className="text-xs text-slate-400">
                    Live broadcast via Socket.IO
                  </span>
                </div>

                {updateFeedback && (
                  <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs font-medium animate-fade-in">
                    {updateFeedback}
                  </div>
                )}

                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">
                    Authority Dispatch Note / Work Order Comment
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Work crew unit 4 dispatched for immediate drainage clearance."
                    value={statusComment}
                    onChange={(e) => setStatusComment(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    disabled={isUpdating || activeIssue.status === 'reported'}
                    onClick={() => handleUpdateStatus(activeIssue, 'reported')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeIssue.status === 'reported'
                        ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>In Triage</span>
                  </button>

                  <button
                    disabled={isUpdating || activeIssue.status === 'in_progress'}
                    onClick={() => handleUpdateStatus(activeIssue, 'in_progress')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeIssue.status === 'in_progress'
                        ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Dispatch (In Progress)</span>
                  </button>

                  <button
                    disabled={isUpdating || activeIssue.status === 'resolved'}
                    onClick={() => handleUpdateStatus(activeIssue, 'resolved')}
                    className={`col-span-2 p-3 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-2 ${
                      activeIssue.status === 'resolved'
                        ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{isUpdating ? 'Broadcasting...' : 'Mark Incident Resolved & Close Signal'}</span>
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
    </div>
  );
};
