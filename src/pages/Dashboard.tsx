import React, { useState } from 'react';
import { PlusCircle, MapPin, Layers, ArrowRight, ShieldCheck, Radio, QrCode, Search, Tag, Filter, X } from 'lucide-react';
import { Issue, AnalyticsData } from '../types';
import { HeroChain } from '../components/dashboard/HeroChain';
import { StatsOverview } from '../components/dashboard/StatsOverview';
import { PriorityQueue } from '../components/dashboard/PriorityQueue';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { InteractiveMap } from '../components/map/InteractiveMap';
import { IssueCard } from '../components/issues/IssueCard';
import { Vector4, Vector9 } from '../components/common/DecorativeVectors';
import { getTicketId } from '../utils/formatters';

interface DashboardProps {
  issues: Issue[];
  analytics: AnalyticsData | null;
  isLoading: boolean;
  onNavigate: (tab: string, issueId?: string) => void;
  onSelectIssue: (issue: Issue) => void;
  onOpenAuth?: (role?: 'CITIZEN' | 'AUTHORITY', mode?: 'login' | 'signup') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  issues,
  analytics,
  isLoading,
  onNavigate,
  onSelectIssue,
  onOpenAuth,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'reported' | 'in_progress' | 'resolved'>('all');

  // Filtered search results
  const searchResults = searchQuery.trim()
    ? issues.filter((issue) => {
        const query = searchQuery.trim().toLowerCase();
        const ticketId = getTicketId(issue).toLowerCase();
        const matchesQuery =
          ticketId.includes(query) ||
          issue.id.toLowerCase().includes(query) ||
          issue.title.toLowerCase().includes(query) ||
          issue.description.toLowerCase().includes(query) ||
          issue.address.toLowerCase().includes(query) ||
          issue.category.toLowerCase().includes(query);
        const matchesStatus = selectedStatus === 'all' || issue.status === selectedStatus;
        return matchesQuery && matchesStatus;
      })
    : [];

  // Recent reports (filtered by status if selected)
  const recentIssues = (selectedStatus === 'all' 
    ? issues 
    : issues.filter((i) => i.status === selectedStatus)
  ).slice(0, 6);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Citypulse Master Hero — "One Report Starts a Chain" */}
      <HeroChain
        analytics={analytics}
        isLoading={isLoading}
        onNavigate={onNavigate}
        onOpenAuth={onOpenAuth}
      />

      {/* COMPLAINT SEARCH & TICKET TRACKER BOX */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-cyan-500/20 bg-gradient-to-r from-cyan-950/30 via-slate-900/60 to-violet-950/30 shadow-2xl">
        <div className="max-w-3xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold">
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span>Complaint Lookup & Ticket Tracking System</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Find Any Complaint or Incident by Ticket ID
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Search by Ticket ID (e.g. <span className="font-mono text-cyan-300 font-bold">#CP-XXXX</span>), location, category, or title to check live resolution status.
          </p>

          {/* Search Input Box */}
          <div className="relative mt-2">
            <Search className="w-5 h-5 text-cyan-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Ticket ID (#CP-...), keyword, address, or issue category..."
              className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-cyan-400/40 focus:border-cyan-400 text-white placeholder-slate-400 text-sm sm:text-base outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {(['all', 'reported', 'in_progress', 'resolved'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedStatus === st
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                {st === 'all' ? 'All Complaints' : st === 'reported' ? 'Submitted / Reported' : st === 'in_progress' ? 'Under Process' : 'Resolved / Done'}
              </button>
            ))}
          </div>

          {/* Active Search Results Overlay */}
          {searchQuery.trim() && (
            <div className="mt-6 text-left space-y-3 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300">
                  Found {searchResults.length} matching complaint{searchResults.length === 1 ? '' : 's'}
                </span>
                <span className="text-[11px] text-slate-400">Click any card to open detailed view</span>
              </div>

              {searchResults.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs bg-white/5 rounded-2xl border border-white/10">
                  No complaints found matching "<span className="text-white font-semibold">{searchQuery}</span>". Try searching by another keyword or ticket ID.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.slice(0, 6).map((issue) => (
                    <IssueCard key={issue.id} issue={issue} onClick={onSelectIssue} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4 Core Metrics Row (Section immediately following Hero scroll sequence) */}
      <div id="dashboard-metrics" className="scroll-mt-24">
        <StatsOverview analytics={analytics} isLoading={isLoading} />
      </div>

      {/* Main Map & Intelligence Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prominent Live Map (2 cols) */}
        <div className="lg:col-span-2 glass-card rounded-3xl border border-white/10 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <h2 className="font-bold text-base text-white">
                  Live Community Incident Map
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time geospatial signals color-coded by AI-evaluated severity & status
              </p>
            </div>
            <button
              onClick={() => onNavigate('map')}
              className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 flex items-center gap-1 transition"
            >
              Expand Map <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="rounded-2xl overflow-hidden border border-white/10">
            <InteractiveMap
              issues={issues}
              onSelectIssue={onSelectIssue}
              className="h-[430px] w-full"
            />
          </div>
        </div>

        {/* Live Activity Stream (1 col) */}
        <div className="space-y-6">
          <ActivityFeed
            activities={analytics?.recent_activity || []}
            onSelectIssueId={(id) => onNavigate('reports', id)}
          />

          {/* Quick link to QR Codes */}
          <div className="glass-card rounded-2xl p-5 border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 via-slate-900/60 to-violet-950/40 relative overflow-hidden group">
            <div className="absolute -right-3 -bottom-3 w-24 h-24 opacity-15 text-cyan-300 pointer-events-none">
              <Vector4 className="w-full h-full" />
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <QrCode className="w-4 h-4 text-cyan-400" />
              <h4 className="font-bold text-sm text-white">Civic QR Stations</h4>
            </div>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              Printable QR codes for bus stops, campus gates, and markets to enable instant GPS citizen reporting.
            </p>
            <button
              onClick={() => onNavigate('qr')}
              className="w-full py-2.5 rounded-xl btn-glass-secondary text-white text-xs font-bold transition-all shadow-md cursor-pointer text-center"
            >
              Generate Civic QR Codes &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Top Priority Queue Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PriorityQueue
            issues={analytics?.priority_queue || []}
            onSelectIssue={onSelectIssue}
          />
        </div>

        <div className="glass-card rounded-2xl border border-white/10 p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-1 -right-1 w-24 h-20 opacity-10 text-cyan-400 pointer-events-none hidden sm:block">
            <Vector9 className="w-full h-full" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-white">
                Community Priority Scoring
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Our priority algorithm normalizes raw severity weights against verified citizen impact and report age, generating actionable scores from 1 to 100 without being dominated by vote brigading.
            </p>
            <div className="space-y-2 bg-white/5 p-3 rounded-xl border border-white/10 text-xs">
              <div className="flex justify-between font-medium">
                <span className="text-slate-400">Severity Weight</span>
                <span className="text-cyan-300 font-mono">1x to 4x</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-slate-400">Community Impact</span>
                <span className="text-violet-300 font-mono">Log dampened</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-slate-400">Aging Urgency</span>
                <span className="text-amber-300 font-mono">+5% / day</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/10">
            <button
              onClick={() => onNavigate('analytics')}
              className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-semibold rounded-xl transition-all text-center cursor-pointer"
            >
              Open Full Authority Analytics &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Recent Citizen Reports */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Recent Incident Reports</h2>
            <p className="text-xs text-slate-400">
              Browse live signals ingested across the municipal grid
            </p>
          </div>
          <button
            onClick={() => onNavigate('reports')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition cursor-pointer"
          >
            View All Reports ({issues.length}) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {recentIssues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} onClick={onSelectIssue} />
          ))}
        </div>
      </div>
    </div>
  );
};
