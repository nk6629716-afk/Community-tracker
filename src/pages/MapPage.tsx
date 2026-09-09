import React, { useState, useMemo } from 'react';
import { Search, Filter, Layers, X, ArrowRight, MapPin, Users, Navigation, LocateFixed, Compass } from 'lucide-react';
import { Issue, IssueCategory } from '../types';
import { InteractiveMap } from '../components/map/InteractiveMap';
import { UpvoteButton } from '../components/issues/UpvoteButton';
import { CATEGORY_LABELS, SEVERITY_INFO, STATUS_INFO } from '../utils/priority';
import { Vector3 } from '../components/common/DecorativeVectors';
import { useUserLocation } from '../hooks/useUserLocation';
import { calculateDistanceKm, formatDistance } from '../utils/geo';

interface MapPageProps {
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
}

export const MapPage: React.FC<MapPageProps> = ({ issues, onSelectIssue }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [proximityRadius, setProximityRadius] = useState<number | null>(null);

  // GPS Device Location
  const {
    coords: userCoords,
    status: gpsStatus,
    placeName: userPlaceName,
    isLocating,
    requestLocation,
  } = useUserLocation();

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

      let matchRadius = true;
      if (userCoords && proximityRadius !== null) {
        const distKm = calculateDistanceKm(userCoords.lat, userCoords.lng, iss.latitude, iss.longitude);
        matchRadius = distKm <= proximityRadius;
      }

      return matchCat && matchQuery && matchRadius;
    });
  }, [issues, selectedCategory, searchQuery, userCoords, proximityRadius]);

  // Selected issue distance
  const selectedIssueDistance = useMemo(() => {
    if (!selectedIssue || !userCoords) return null;
    const distKm = calculateDistanceKm(userCoords.lat, userCoords.lng, selectedIssue.latitude, selectedIssue.longitude);
    return formatDistance(distKm);
  }, [selectedIssue, userCoords]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Controls Bar */}
      <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/10 p-4 shadow-xl space-y-3 relative overflow-hidden">
        {/* Subtle decorative Vector 3 */}
        <div className="absolute right-3 top-2 w-16 h-16 opacity-10 text-cyan-400 pointer-events-none hidden md:block">
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
              className="w-full pl-9 pr-4 py-2 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-hidden focus:border-cyan-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* GPS Proximity Filters & Locate Button */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold text-slate-400 px-2 flex items-center gap-1">
                <Compass className="w-3 h-3 text-cyan-400" /> GPS:
              </span>
              {([
                { label: 'All', value: null },
                { label: '< 2 km', value: 2 },
                { label: '< 5 km', value: 5 },
                { label: '< 15 km', value: 15 },
              ] as const).map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setProximityRadius(opt.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    proximityRadius === opt.value
                      ? 'bg-cyan-500 text-slate-950 shadow-xs'
                      : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => requestLocation(true)}
              disabled={isLocating}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              title="Locate my position on map"
            >
              <LocateFixed className={`w-3.5 h-3.5 text-cyan-400 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Acquiring...' : 'My GPS'}</span>
            </button>

            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-300">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              {filteredIssues.length} Pins
            </span>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Full Map Canvas with Slide-out Selected Issue Card */}
      <div className="relative isolate h-[calc(100vh-250px)] min-h-[500px] rounded-2xl overflow-hidden border border-white/10 shadow-xl">
        <InteractiveMap
          issues={filteredIssues}
          selectedIssueId={selectedIssue?.id}
          onSelectIssue={(issue) => setSelectedIssue(issue)}
          className="h-full w-full"
          userLocation={userCoords}
          proximityRadiusKm={proximityRadius}
          onLocateMe={() => requestLocation(true)}
        />

        {/* Issue Preview Drawer / Float Card when clicked */}
        {selectedIssue && (
          <div className="absolute top-4 left-4 z-20 max-w-sm w-full bg-slate-950/95 backdrop-blur-xl rounded-2xl border border-white/15 shadow-2xl p-4 transition-all duration-200 animate-slide-up text-white">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  {CATEGORY_LABELS[selectedIssue.category]}
                </span>
                {selectedIssueDistance && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-400/30 flex items-center gap-1">
                    <Navigation className="w-2.5 h-2.5 text-violet-400" />
                    <span>{selectedIssueDistance}</span>
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedIssue(null)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="font-bold text-white text-base leading-snug mb-1">
              {selectedIssue.title}
            </h3>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">{selectedIssue.address}</span>
            </div>

            {selectedIssue.photo_url && (
              <div className="h-32 w-full rounded-lg overflow-hidden my-2 bg-slate-900 border border-white/10">
                <img
                  src={selectedIssue.photo_url}
                  alt={selectedIssue.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            <p className="text-xs text-slate-300 line-clamp-2 mb-3">
              {selectedIssue.description}
            </p>

            <div className="flex items-center justify-between py-2 border-t border-white/10 text-xs mb-3">
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
                className="btn-glass-primary px-4 py-2 text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow-md transition-all shrink-0 cursor-pointer"
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
