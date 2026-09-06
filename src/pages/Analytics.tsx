import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  Layers, 
  ShieldCheck,
  Flame,
  ArrowUpRight
} from 'lucide-react';
import { AnalyticsData, Issue } from '../types';
import { CATEGORY_LABELS, SEVERITY_INFO, STATUS_INFO, getPriorityBadge } from '../utils/priority';
import { Vector2, Vector5 } from '../components/common/DecorativeVectors';

interface AnalyticsProps {
  analytics: AnalyticsData | null;
  onSelectIssue: (issue: Issue) => void;
}

export const Analytics: React.FC<AnalyticsProps> = ({ analytics, onSelectIssue }) => {
  if (!analytics) {
    return (
      <div className="p-12 text-center text-slate-500">
        Loading community intelligence analytics...
      </div>
    );
  }

  // Calculate percentages for category breakdown
  const categoryEntries = (Object.entries(analytics.by_category) as [string, number][]).sort((a, b) => b[1] - a[1]);
  const maxCategoryCount = Math.max(...categoryEntries.map((e) => e[1]), 1);

  // Severity entries
  const severityOrder = ['critical', 'high', 'medium', 'low'];
  const totalSeverity = (Object.values(analytics.by_severity) as number[]).reduce((acc: number, v: number) => acc + v, 0) || 1;

  // Status entries
  const totalStatus = (Object.values(analytics.by_status) as number[]).reduce((acc: number, v: number) => acc + v, 0) || 1;

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Subtle decorative Vector 2 (municipal constellation network) */}
        <div className="absolute -top-2 right-44 w-28 h-24 opacity-10 text-[#123B5D] pointer-events-none hidden lg:block">
          <Vector2 className="w-full h-full" />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                <BarChart3 className="w-3.5 h-3.5 text-[#123B5D]" />
                Municipal Authority & Operations Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17202A] tracking-tight">
              Community Intelligence Analytics
            </h1>
            <p className="text-sm text-[#667085] mt-1">
              Data-driven insights to help civic leadership prioritize resources and track resolution velocity.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetry Connected
            </span>
          </div>
        </div>

        {/* 6 Core Stats Cards (Page 24, #31) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Reports
            </span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
              {analytics.total_reports}
            </span>
            <span className="text-[10px] text-slate-400">All-time logged</span>
          </div>

          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
              Active Issues
            </span>
            <span className="text-2xl font-extrabold text-amber-900 mt-1 block">
              {analytics.active_issues}
            </span>
            <span className="text-[10px] text-amber-700">Open in community</span>
          </div>

          <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-200">
            <span className="text-[11px] font-bold text-[#123B5D] uppercase tracking-wider block">
              In Progress
            </span>
            <span className="text-2xl font-extrabold text-[#123B5D] mt-1 block">
              {analytics.in_progress}
            </span>
            <span className="text-[10px] text-sky-700">Crews assigned</span>
          </div>

          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              Resolved
            </span>
            <span className="text-2xl font-extrabold text-emerald-900 mt-1 block">
              {analytics.resolved}
            </span>
            <span className="text-[10px] text-emerald-700">Fixed & verified</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Resolution Rate
            </span>
            <span className="text-2xl font-extrabold text-[#2E8B57] mt-1 block">
              {analytics.resolution_rate}%
            </span>
            <span className="text-[10px] text-slate-400">Turnaround ratio</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Avg Turnaround
            </span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
              {analytics.avg_resolution_time_days}d
            </span>
            <span className="text-[10px] text-slate-400">From report to fix</span>
          </div>
        </div>
      </div>

      {/* Grid: Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reports by Category Bar Chart */}
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6 shadow-xs space-y-4 relative overflow-hidden">
          {/* Subtle decorative Vector 5 (trend line chart) */}
          <div className="absolute right-4 top-4 w-20 h-14 opacity-15 text-[#2F6F8F] pointer-events-none hidden sm:block">
            <Vector5 className="w-full h-full" />
          </div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#123B5D]" />
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                Reports by Category
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Incident volume</span>
          </div>

          <div className="space-y-3 pt-2">
            {categoryEntries.map(([cat, count]) => {
              const pct = Math.round((count / analytics.total_reports) * 100);
              const label = CATEGORY_LABELS[cat as any] || cat;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{label}</span>
                    <span className="text-slate-900 font-mono">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#123B5D] rounded-full transition-all duration-500"
                      style={{ width: `${(count / maxCategoryCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reports by Severity & Status Distribution */}
        <div className="space-y-6">
          {/* Reports by Severity */}
          <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                  Reports by Severity
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">Risk tiering</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {severityOrder.map((sevKey) => {
                const count = analytics.by_severity[sevKey] || 0;
                const info = SEVERITY_INFO[sevKey as any];
                const pct = Math.round((count / totalSeverity) * 100);

                return (
                  <div key={sevKey} className={`p-3.5 rounded-xl border ${info.border} ${info.bg}`}>
                    <span className={`text-xs font-bold block ${info.color}`}>
                      ● {info.label}
                    </span>
                    <span className="text-xl font-extrabold text-slate-900 mt-1 block font-mono">
                      {count}
                    </span>
                    <span className="text-[10px] text-slate-500">{pct}% of total</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#2F6F8F]" />
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                  Status Distribution
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">Pipeline state</span>
            </div>

            <div className="h-4 w-full bg-slate-100 rounded-full flex overflow-hidden">
              <div
                title="Reported"
                className="bg-[#667085] h-full"
                style={{ width: `${((analytics.by_status.reported || 0) / totalStatus) * 100}%` }}
              />
              <div
                title="In Progress"
                className="bg-[#2F6F8F] h-full"
                style={{ width: `${((analytics.by_status.in_progress || 0) / totalStatus) * 100}%` }}
              />
              <div
                title="Resolved"
                className="bg-[#2E8B57] h-full"
                style={{ width: `${((analytics.by_status.resolved || 0) / totalStatus) * 100}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs pt-1">
              <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-[#667085]" />
                Reported ({analytics.by_status.reported || 0})
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-[#2F6F8F]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2F6F8F]" />
                In Progress ({analytics.by_status.in_progress || 0})
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-[#2E8B57]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2E8B57]" />
                Resolved ({analytics.by_status.resolved || 0})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Incident Locations & Hotspots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-600" />
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                Top Problem Locations (Hotspots)
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Geographic cluster</span>
          </div>

          <div className="divide-y divide-slate-100">
            {analytics.top_locations.map((loc, index) => (
              <div key={index} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-900">
                      {loc.address}
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      {loc.high_severity_count > 0 ? (
                        <span className="text-rose-600 font-medium">
                          {loc.high_severity_count} high/critical alerts
                        </span>
                      ) : (
                        'Standard priority'
                      )}
                    </span>
                  </div>
                </div>

                <span className="font-bold text-slate-800 text-xs px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
                  {loc.count} {loc.count === 1 ? 'report' : 'reports'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Dispatch List */}
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-600" />
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                Active Priority Queue
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Top Dispatch</span>
          </div>

          <div className="divide-y divide-slate-100">
            {analytics.priority_queue.slice(0, 5).map((item, idx) => {
              const badge = getPriorityBadge(item.priority_score);
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectIssue(item)}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 cursor-pointer rounded-lg px-2 transition-colors"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="font-mono text-[#123B5D] font-bold">
                        Score {item.priority_score}/100
                      </span>
                      <span>•</span>
                      <span>▲ {item.upvotes} affected</span>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
