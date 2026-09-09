import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Search, 
  Navigation, 
  X, 
  AlertTriangle, 
  LocateFixed, 
  Compass, 
  Building, 
  Check, 
  Loader2 
} from 'lucide-react';
import { GeoCoordinates, searchLocationAddress, COMMUNITY_LOCATION_PRESETS, LocationSearchResult } from '../../utils/geo';

interface ManualLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (coords: GeoCoordinates, placeName: string) => void;
  onRetryGps: () => void;
  isLocating: boolean;
  currentPlaceName?: string | null;
}

export const ManualLocationModal: React.FC<ManualLocationModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  onRetryGps,
  isLocating,
  currentPlaceName,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);

  // Debounced search for locations
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocationAddress(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.warn('Location search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-950/95 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/50 space-y-6 text-white overflow-hidden">
        {/* Glow ambient background vector */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-violet-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-lg shadow-cyan-500/20">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-1">
                <AlertTriangle className="w-3 h-3" />
                <span>GPS Denied / Unavailable</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                Set Your Community Location
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 relative z-10 leading-relaxed">
          Device GPS was denied or unavailable. Enter your neighborhood, ward, or street below so we can configure your live map and show civic problems around you.
        </p>

        {/* Current Active Location Pill */}
        {currentPlaceName && (
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300 truncate mr-2">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">Current: <strong>{currentPlaceName}</strong></span>
            </div>
            <span className="text-[10px] font-bold text-cyan-300 shrink-0 uppercase tracking-wider">Active</span>
          </div>
        )}

        {/* Search input box */}
        <div className="relative z-10 space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Search Neighborhood, Street, or Ward
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. Market St, University, Downtown, North Ward..."
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-cyan-400/40 focus:border-cyan-400 text-white placeholder-slate-400 text-sm outline-none transition-all"
              autoFocus
            />
            {isSearching && (
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
            )}
            {searchQuery && !isSearching && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {searchResults.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded-2xl bg-slate-900 border border-cyan-500/30 p-2 space-y-1 shadow-2xl">
              {searchResults.map((res, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSelectLocation({ lat: res.lat, lng: res.lng }, res.name);
                    setSearchQuery('');
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-cyan-500/15 border border-transparent hover:border-cyan-400/30 flex items-start gap-2.5 transition-all text-xs cursor-pointer group"
                >
                  <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate">{res.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {res.lat.toFixed(4)}°, {res.lng.toFixed(4)}°
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Popular Districts / Wards Presets */}
        <div className="space-y-2 relative z-10">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Or Quick Select District</span>
            <span className="text-[10px] text-cyan-400">1-Click Configure</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {COMMUNITY_LOCATION_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => onSelectLocation({ lat: preset.lat, lng: preset.lng }, preset.name)}
                className="p-3 rounded-2xl bg-white/5 hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-400/40 text-left transition-all text-xs cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 uppercase tracking-wider">
                    {preset.type}
                  </span>
                  <Navigation className="w-3 h-3 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                </div>
                <span className="font-bold text-white group-hover:text-cyan-200 transition-colors leading-snug line-clamp-1">
                  {preset.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
          <button
            onClick={onRetryGps}
            disabled={isLocating}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <LocateFixed className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Acquiring GPS...' : 'Retry Device GPS'}</span>
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all text-center cursor-pointer"
          >
            Continue with Current
          </button>
        </div>
      </div>
    </div>
  );
};
