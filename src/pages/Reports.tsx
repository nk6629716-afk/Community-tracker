import React, { useState, useMemo } from 'react';
import { Search, Filter, SlidersHorizontal, CheckCircle2, RotateCcw, Tag, Navigation, LocateFixed } from 'lucide-react';
import { Issue } from '../types';
import { IssueCard } from '../components/issues/IssueCard';
import { Vector7 } from '../components/common/DecorativeVectors';
import { getTicketId } from '../utils/formatters';
import { useUserLocation } from '../hooks/useUserLocation';
import { calculateDistanceKm } from '../utils/geo';

interface ReportsProps {
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
  onNavigateReport: () => void;
}

export const Reports: React.FC<ReportsProps> = ({
  issues,
  onSelectIssue,
  onNavigateReport,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('most_recent');

  // GPS Device Location
  const { coords: userCoords, placeName: userPlaceName, isLocating, requestLocation } = useUserLocation();

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'road_damage', label: 'Roads' },
    { id: 'garbage', label: 'Garbage' },
    { id: 'water_leakage', label: 'Water' },
    { id: 'streetlight', label: 'Streetlights' },
    { id: 'drainage', label: 'Drainage' },
    { id: 'electricity', label: 'Electricity' },
    { id: 'infrastructure', label: 'Infrastructure' },
    { id: 'public_space', label: 'Public Space' },
  ];

  const statuses = [
    { id: 'all', label: 'All Statuses' },
    { id: 'reported', label: 'Reported' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'resolved', label: 'Resolved' },
  ];

  const severities = [
    { id: 'all', label: 'All Severities' },
    { id: 'low', label: 'Low' },
    { id: 'medium', label: 'Medium' },
    { id: 'high', label: 'High' },
    { id: 'critical', label: 'Critical' },
  ];

  const filteredIssues = useMemo(() => {
    let list = issues.filter((iss) => {
      const matchCat = categoryFilter === 'all' || iss.category === categoryFilter;
      const matchStatus = statusFilter === 'all' || iss.status === statusFilter;
      const matchSev = severityFilter === 'all' || iss.severity === severityFilter;
      const ticketId = getTicketId(iss).toLowerCase();
      const query = search.trim().toLowerCase();
      const matchQuery =
        !query ||
        ticketId.includes(query) ||
        iss.id.toLowerCase().includes(query) ||
        iss.title.toLowerCase().includes(query) ||
        iss.description.toLowerCase().includes(query) ||
        iss.address.toLowerCase().includes(query) ||
        iss.category.toLowerCase().includes(query);

      return matchCat && matchStatus && matchSev && matchQuery;
    });

    if (sortBy === 'closest_gps' && userCoords) {
      list.sort((a, b) => {
        const distA = calculateDistanceKm(userCoords.lat, userCoords.lng, a.latitude, a.longitude);
        const distB = calculateDistanceKm(userCoords.lat, userCoords.lng, b.latitude, b.longitude);
        return distA - distB;
      });
    } else if (sortBy === 'most_upvoted') {
      list.sort((a, b) => b.upvotes - a.upvotes);
    } else if (sortBy === 'highest_priority') {
      list.sort((a, b) => b.priority_score - a.priority_score);
    } else {
      list.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return list;
  }, [issues, search, categoryFilter, statusFilter, severityFilter, sortBy, userCoords]);

  const resetFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setSeverityFilter('all');
    setSortBy('most_recent');
  };

  const isFiltered =
    search ||
    categoryFilter !== 'all' ||
    statusFilter !== 'all' ||
    severityFilter !== 'all' ||
    sortBy !== 'most_recent';

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Community Reports
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Search, filter, and track verified civic issues reported across the area.
          </p>
        </div>
        <button
          onClick={onNavigateReport}
          className="self-start sm:self-auto btn-glass-primary px-4 py-2.5 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition-all cursor-pointer"
        >
          + Submit New Report
        </button>
      </div>

      {/* Filter and Search Panel */}
      <div className="glass-card rounded-2xl border border-white/10 p-4 sm:p-5 shadow-xl space-y-4 relative overflow-hidden">
        {/* Subtle decorative Vector 7 */}
        <div className="absolute right-4 top-4 w-20 h-16 opacity-10 text-cyan-400 pointer-events-none hidden lg:block">
          <Vector7 className="w-full h-full" />
        </div>
        
        {/* Search Bar & Sort Dropdown */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, description, address, or category..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-hidden focus:border-cyan-400 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs sm:text-sm bg-slate-900 border border-white/15 rounded-xl px-3 py-2 font-medium text-slate-200 focus:outline-hidden focus:border-cyan-400 cursor-pointer"
            >
              <option value="most_recent">Most Recent</option>
              <option value="closest_gps">📍 Closest to Me (GPS)</option>
              <option value="most_upvoted">Most Upvoted</option>
              <option value="highest_priority">Highest Priority</option>
            </select>

            {isFiltered && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Reset Filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div>
          <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Category:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  categoryFilter === cat.id
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status and Severity Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {/* Status pills */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-400 mr-1">Status:</span>
              {statuses.map((st) => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    statusFilter === st.id
                      ? 'bg-cyan-600 text-white font-semibold shadow-xs'
                      : 'bg-white/5 hover:bg-white/10 text-slate-400 border border-white/10'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Severity pills */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-400 mr-1">Severity:</span>
              {severities.map((sev) => (
                <button
                  key={sev.id}
                  onClick={() => setSeverityFilter(sev.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    severityFilter === sev.id
                      ? 'bg-violet-600 text-white font-semibold shadow-xs'
                      : 'bg-white/5 hover:bg-white/10 text-slate-400 border border-white/10'
                  }`}
                >
                  {sev.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-400">
            Showing <strong className="text-white">{filteredIssues.length}</strong> of{' '}
            <strong className="text-white">{issues.length}</strong> reports
          </div>
        </div>
      </div>

      {/* Grid of Issue Cards */}
      {filteredIssues.length === 0 ? (
        <div className="glass-card rounded-2xl border border-white/10 p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-white text-base">No Matching Reports Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search terms, changing the category or severity filter, or clearing all filters.
          </p>
          {isFiltered && (
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
            >
              Reset all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredIssues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onClick={onSelectIssue}
              userLocation={userCoords}
            />
          ))}
        </div>
      )}
    </div>
  );
};
