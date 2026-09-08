import React, { useState, useMemo } from 'react';
import { Search, Filter, SlidersHorizontal, CheckCircle2, RotateCcw, Tag } from 'lucide-react';
import { Issue } from '../types';
import { IssueCard } from '../components/issues/IssueCard';
import { Vector7 } from '../components/common/DecorativeVectors';
import { getTicketId } from '../utils/formatters';

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

    if (sortBy === 'most_upvoted') {
      list.sort((a, b) => b.upvotes - a.upvotes);
    } else if (sortBy === 'highest_priority') {
      list.sort((a, b) => b.priority_score - a.priority_score);
    } else {
      list.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return list;
  }, [issues, search, categoryFilter, statusFilter, severityFilter, sortBy]);

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
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Community Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Search, filter, and track verified civic issues reported across the area.
          </p>
        </div>
        <button
          onClick={onNavigateReport}
          className="self-start sm:self-auto px-4 py-2.5 bg-[#123B5D] hover:bg-[#0B263D] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-97"
        >
          + Submit New Report
        </button>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white rounded-2xl border border-[#E4E7EC] p-4 sm:p-5 shadow-xs space-y-4 relative overflow-hidden">
        {/* Subtle decorative Vector 7 (crossroads routing) */}
        <div className="absolute right-4 top-4 w-20 h-16 opacity-10 text-[#123B5D] pointer-events-none hidden lg:block">
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
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-1 focus:ring-[#123B5D] focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-[#123B5D]"
            >
              <option value="most_recent">Most Recent</option>
              <option value="most_upvoted">Most Upvoted</option>
              <option value="highest_priority">Highest Priority</option>
            </select>

            {isFiltered && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 px-2 py-2 rounded-lg hover:bg-slate-100 transition-colors"
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
          <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Category:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  categoryFilter === cat.id
                    ? 'bg-[#123B5D] text-white shadow-2xs font-semibold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status and Severity Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {/* Status pills */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500 mr-1">Status:</span>
              {statuses.map((st) => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === st.id
                      ? 'bg-[#2F6F8F] text-white font-semibold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Severity pills */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500 mr-1">Severity:</span>
              {severities.map((sev) => (
                <button
                  key={sev.id}
                  onClick={() => setSeverityFilter(sev.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    severityFilter === sev.id
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {sev.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs font-medium text-slate-500">
            Showing <span className="font-bold text-slate-900">{filteredIssues.length}</span> issues
          </div>
        </div>
      </div>

      {/* Reports Grid or Empty State */}
      {filteredIssues.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-12 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-base text-slate-900 uppercase tracking-wide">
            All Clear
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
            There are no civic issues matching your selected filters. Be the first person to report an issue in your community.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
            >
              Clear Filters
            </button>
            <button
              onClick={onNavigateReport}
              className="px-4 py-2 bg-[#123B5D] hover:bg-[#0B263D] text-white text-xs font-semibold rounded-xl"
            >
              Report an Issue
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredIssues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} onClick={onSelectIssue} />
          ))}
        </div>
      )}
    </div>
  );
};
