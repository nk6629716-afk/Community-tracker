import React, { useState, useMemo } from 'react';
import { Search, Filter, Layers, X, ArrowRight, MapPin, Users } from 'lucide-react';
import { Issue, IssueCategory } from '../types';
import { InteractiveMap } from '../components/map/InteractiveMap';
import { UpvoteButton } from '../components/issues/UpvoteButton';
import { CATEGORY_LABELS, SEVERITY_INFO, STATUS_INFO } from '../utils/priority';
import { Vector3 } from '../components/common/DecorativeVectors';

interface MapPageProps {
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
}

export const MapPage: React.FC<MapPageProps> = ({ issues, onSelectIssue }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All Issues' },
    { id: 'road_damage', label: 'Roads' },
    { id: 'garbage', label: 'Garbage' },
    { id: 'water_leakage', label: 'Water' },
    { id: 'streetlight', label: 'Lighting' },
    { id: 'drainage', label: 'Drainage' },
    { id: 'infrastructure', label: 'Infrastructure' },
    { id: 'electricity', label: 'Electricity' },
  ];

  const filteredIssues = useMemo(() => {
    return issues.filter((iss) => {
      const matchCat = selectedCategory === 'all' || iss.category === selectedCategory;
      const matchQuery =
        !searchQuery ||
        iss.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        iss.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        iss.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [issues, selectedCategory, searchQuery]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Controls Bar per Page 25 */}
      <div className="bg-white rounded-2xl border border-[#E4E7EC] p-4 shadow-xs space-y-3 relative overflow-hidden">
        {/* Subtle decorative Vector 3 (geospatial targeting & pin) */}
        <div className="absolute right-3 top-2 w-16 h-16 opacity-15 text-[#123B5D] pointer-events-none hidden md:block">
          <Vector3 className="w-full h-full" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
          {/* Search Location / Keyword */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location, street name, or issue title..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-1 focus:ring-[#123B5D] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 shrink-0">
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200">
              <Layers className="w-3.5 h-3.5 text-[#123B5D]" />
              Showing {filteredIssues.length} of {issues.length} Map Pins
            </span>
          </div>
        </div>

        {/* Category Filter Pills (Roads, Garbage, Water, Lighting, Drainage) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#123B5D] text-white shadow-2xs font-semibold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Full Map Canvas with Slide-out Selected Issue Card */}
      <div className="relative h-[calc(100vh-250px)] min-h-[500px] rounded-2xl overflow-hidden border border-[#E4E7EC] shadow-xs">
        <InteractiveMap
          issues={filteredIssues}
          selectedIssueId={selectedIssue?.id}
          onSelectIssue={(issue) => setSelectedIssue(issue)}
          className="h-full w-full"
        />

        {/* Issue Preview Drawer / Float Card when clicked */}
        {selectedIssue && (
          <div className="absolute top-4 left-4 z-1000 max-w-sm w-full bg-white/95 backdrop-blur-md rounded-2xl border border-[#E4E7EC] shadow-xl p-4 transition-all duration-200 animate-slide-up">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#123B5D] text-white">
                {CATEGORY_LABELS[selectedIssue.category]}
              </span>
              <button
                onClick={() => setSelectedIssue(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="font-bold text-slate-900 text-base leading-snug mb-1">
              {selectedIssue.title}
            </h3>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{selectedIssue.address}</span>
            </div>

            {selectedIssue.photo_url && (
              <div className="h-32 w-full rounded-lg overflow-hidden my-2 bg-slate-100">
                <img
                  src={selectedIssue.photo_url}
                  alt={selectedIssue.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            <p className="text-xs text-slate-600 line-clamp-2 mb-3">
              {selectedIssue.description}
            </p>

            <div className="flex items-center justify-between py-2 border-t border-slate-100 text-xs mb-3">
              <span className={`font-semibold ${SEVERITY_INFO[selectedIssue.severity]?.color}`}>
                ● {SEVERITY_INFO[selectedIssue.severity]?.label} Severity
              </span>
              <span className={`font-semibold ${STATUS_INFO[selectedIssue.status]?.color}`}>
                ● {STATUS_INFO[selectedIssue.status]?.label}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <UpvoteButton
                issueId={selectedIssue.id}
                initialUpvotes={selectedIssue.upvotes}
                className="flex-1 justify-center py-2"
              />
              <button
                onClick={() => onSelectIssue(selectedIssue)}
                className="px-4 py-2 bg-[#123B5D] hover:bg-[#0B263D] text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow-xs transition-colors shrink-0"
              >
                Details <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
