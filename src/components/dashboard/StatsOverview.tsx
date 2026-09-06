import React from 'react';
import { FileText, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { AnalyticsData } from '../../types';

interface StatsOverviewProps {
  analytics: AnalyticsData | null;
  isLoading?: boolean;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ analytics, isLoading }) => {
  const stats = [
    {
      label: 'Total Reports',
      value: analytics ? analytics.total_reports : 0,
      icon: FileText,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/15 border border-violet-500/30',
      subtext: 'Citizen signals logged',
    },
    {
      label: 'Active Issues',
      value: analytics ? analytics.active_issues : 0,
      icon: AlertTriangle,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/15 border border-amber-500/30',
      subtext: 'Requiring action',
    },
    {
      label: 'In Progress',
      value: analytics ? analytics.in_progress : 0,
      icon: Clock,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/15 border border-cyan-500/30',
      subtext: 'Squads dispatched',
    },
    {
      label: 'Resolved',
      value: analytics ? analytics.resolved : 0,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/15 border border-emerald-500/30',
      subtext: `${analytics ? analytics.resolution_rate : 0}% resolution rate`,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={i}
            className="glass-card rounded-2xl p-5 border border-white/10 hover:border-cyan-400/30 transition-all duration-300 relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {stat.label}
              </span>
              <div className={`p-2 rounded-xl ${stat.bgColor} transition-transform group-hover:scale-110 duration-200`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>

            {isLoading ? (
              <div className="h-8 w-16 bg-white/10 rounded animate-pulse" />
            ) : (
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {stat.value}
              </div>
            )}

            <div className="text-[11px] font-medium text-slate-400 mt-1">
              {stat.subtext}
            </div>
          </div>
        );
      })}
    </div>
  );
};
