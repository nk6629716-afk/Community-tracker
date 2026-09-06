import React, { useState } from 'react';
import { 
  PlusCircle, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  FileText, 
  User, 
  Activity,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Issue } from '../../types';
import { AuthUser } from '../../services/api';
import { InteractiveMap } from '../map/InteractiveMap';
import { CATEGORY_LABELS, SEVERITY_INFO, STATUS_INFO } from '../../utils/priority';
import { formatDateTime } from '../../utils/formatters';

interface CitizenDashboardProps {
  user: AuthUser;
  issues: Issue[];
  onLodgeIssue: () => void;
  onSelectIssue: (issue: Issue) => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({
  user,
  issues,
  onLodgeIssue,
  onSelectIssue,
}) => {
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // Filter issues for this citizen
  const myReports = issues.filter(
    (i) => i.userId === user.id || i.created_by.toLowerCase().includes(user.name.toLowerCase())
  );
  // Fallback to all recent if user hasn't created one yet
  const displayReports = myReports.length > 0 ? myReports : issues.slice(0, 5);

  const totalCount = myReports.length > 0 ? myReports.length : issues.length;
  const activeCount = (myReports.length > 0 ? myReports : issues).filter((i) => i.status !== 'resolved').length;
  const resolvedCount = (myReports.length > 0 ? myReports : issues).filter((i) => i.status === 'resolved').length;

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Citizen Welcome & Profile Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-violet-500/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/15 border border-violet-400/25 text-violet-300 text-xs font-bold">
                <User className="w-3.5 h-3.5 text-violet-400" />
                <span>Verified Citizen Identity</span>
              </span>
              {user.area && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 text-xs font-medium">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  <span>{user.area}</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Welcome, {user.name}
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Track your submitted civic signals, review live status progressions, and lodge GPS-assisted community reports.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onLodgeIssue}
              className="btn-glass-primary px-6 py-3.5 rounded-xl text-white text-sm font-bold shadow-lg flex items-center gap-2 cursor-pointer group"
            >
              <PlusCircle className="w-4 h-4 text-cyan-300 transition-transform group-hover:rotate-90 duration-300" />
              <span>Lodge Issue (GPS)</span>
            </button>
          </div>
        </div>

        {/* 3 Core Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              My Submissions
            </span>
            <span className="text-3xl font-black text-white mt-1 block">
              {totalCount}
            </span>
            <span className="text-[11px] text-slate-500">Live signals registered</span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
              In Triage / Action
            </span>
            <span className="text-3xl font-black text-amber-400 mt-1 block">
              {activeCount}
            </span>
            <span className="text-[11px] text-amber-300/60">Under municipal assessment</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">
              Resolved & Verified
            </span>
            <span className="text-3xl font-black text-emerald-400 mt-1 block">
              {resolvedCount}
            </span>
            <span className="text-[11px] text-emerald-300/60">Community improvement completed</span>
          </div>
        </div>
      </div>

      {/* Grid: My Reports & Interactive Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: My Reports Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-400" />
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                My Incident Signals
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Live Realtime Feed
            </span>
          </div>

          <div className="space-y-3">
            {displayReports.length === 0 ? (
              <div className="glass-card p-8 rounded-2xl text-center text-slate-400 text-sm">
                You have not lodged any issues yet. Click &ldquo;Lodge Issue&rdquo; to send your first civic signal!
              </div>
            ) : (
              displayReports.map((report) => {
                const statusInfo = STATUS_INFO[report.status];
                const sevInfo = SEVERITY_INFO[report.severity];

                return (
                  <div
                    key={report.id}
                    onClick={() => {
                      setSelectedIssue(report);
                      onSelectIssue(report);
                    }}
                    className="glass-card glass-card-hover p-4 sm:p-5 rounded-2xl cursor-pointer border border-white/10 hover:border-violet-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-white border border-white/15">
                          {CATEGORY_LABELS[report.category] || report.category}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${sevInfo.border} ${sevInfo.bg} ${sevInfo.color}`}>
                          {sevInfo.label}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatDateTime(report.created_at)}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-white truncate">
                        {report.title}
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">{report.address}</span>
                      </div>
                    </div>

                    {/* Progression Badge */}
                    <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                        report.status === 'resolved'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : report.status === 'in_progress'
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          report.status === 'resolved'
                            ? 'bg-emerald-400'
                            : report.status === 'in_progress'
                            ? 'bg-sky-400 animate-ping'
                            : 'bg-amber-400'
                        }`} />
                        <span>{statusInfo.label}</span>
                      </span>

                      <ArrowRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 Col: Citizen Localized Map & Profile HUD */}
        <div className="space-y-6">
          <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">Local Map View</h3>
              </div>
              <span className="text-[11px] text-cyan-300 font-medium">GPS Active</span>
            </div>

            <div className="rounded-xl overflow-hidden border border-white/10 h-64">
              <InteractiveMap
                issues={displayReports}
                selectedIssueId={selectedIssue?.id}
                onSelectIssue={(iss) => onSelectIssue(iss)}
                className="h-full w-full"
              />
            </div>
          </div>

          {/* Profile Card */}
          <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-violet-400" />
              <h3 className="font-bold text-sm text-white">Citizen Profile</h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-slate-400">Account Name</span>
                <span className="text-white font-medium">{user.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-slate-400">Email</span>
                <span className="text-white font-mono">{user.email}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-slate-400">Age</span>
                <span className="text-white">{user.age ? `${user.age} yrs` : 'Not specified'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Designated Ward</span>
                <span className="text-cyan-300 font-medium">{user.area || 'Citywide'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
