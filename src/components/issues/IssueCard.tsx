import React from 'react';
import { MapPin, Users, Sparkles, ImageOff, Tag, Navigation } from 'lucide-react';
import { Issue } from '../../types';
import { CATEGORY_LABELS, SEVERITY_INFO, STATUS_INFO } from '../../utils/priority';
import { getTicketId } from '../../utils/formatters';
import { calculateDistanceKm, formatDistance, GeoCoordinates } from '../../utils/geo';

interface IssueCardProps {
  issue: Issue;
  onClick: (issue: Issue) => void;
  userLocation?: GeoCoordinates | null;
}

export const IssueCard: React.FC<IssueCardProps> = ({ issue, onClick, userLocation }) => {
  const catLabel = CATEGORY_LABELS[issue.category] || issue.category.replace('_', ' ');
  const sev = SEVERITY_INFO[issue.severity];
  const status = STATUS_INFO[issue.status];
  const ticketId = getTicketId(issue);

  // Distance calculation if userLocation is supplied
  const distanceKm =
    userLocation && typeof userLocation.lat === 'number'
      ? calculateDistanceKm(userLocation.lat, userLocation.lng, issue.latitude, issue.longitude)
      : null;
  const distanceText = distanceKm !== null ? formatDistance(distanceKm) : null;

  return (
    <div
      onClick={() => onClick(issue)}
      className="glass-card glass-card-hover rounded-2xl border border-white/10 hover:border-cyan-400/40 shadow-xl cursor-pointer flex flex-col overflow-hidden group transition-all duration-300"
    >
      {/* Photo header */}
      <div className="relative h-44 w-full bg-slate-900/60 overflow-hidden shrink-0">
        {issue.photo_url ? (
          <img
            src={issue.photo_url}
            alt={issue.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-white/5">
            <ImageOff className="w-8 h-8 stroke-1" />
            <span className="text-[11px] mt-1 font-medium">No photo attached</span>
          </div>
        )}

        {/* Category Pill & Ticket ID on top left */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase bg-[#0a0d1f]/85 text-cyan-300 border border-cyan-500/30 backdrop-blur-md shadow-md">
            {catLabel}
          </span>
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-black/80 text-white backdrop-blur-md shadow-md border border-white/15">
            {ticketId}
          </span>
        </div>

        {/* Status Pill on top right */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold backdrop-blur-md shadow-md border ${status.border} ${status.bg} ${status.color}`}>
            ● {status.label}
          </span>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 font-bold">
              <Tag className="w-3 h-3 text-cyan-400" />
              <span>Ticket: {ticketId}</span>
            </div>

            {distanceText && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-400/30 text-cyan-300 text-[10px] font-bold">
                <Navigation className="w-2.5 h-2.5 text-cyan-400" />
                <span>{distanceText}</span>
              </span>
            )}
          </div>

          <h3 className="font-bold text-white text-base leading-snug group-hover:text-cyan-300 transition-colors mb-2 line-clamp-2">
            {issue.title}
          </h3>

          {/* Location & Metadata */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">{issue.address}</span>
          </div>

          {/* Severity & Community Impact */}
          <div className="flex items-center justify-between gap-2 py-2.5 border-y border-white/10 text-xs mb-3">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: sev.dotColor }}
              />
              <span className={`font-semibold ${sev.color}`}>{sev.label} Severity</span>
            </div>

            <div className="flex items-center gap-1 text-slate-300 font-semibold">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>▲ {issue.upvotes} affected</span>
            </div>
          </div>

          {/* AI Summary snippet */}
          {issue.ai_summary && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-slate-300">
              <div className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>AI Intelligence Summary</span>
              </div>
              <p className="line-clamp-2 text-slate-300 text-[11px] leading-relaxed">
                {issue.ai_summary}
              </p>
            </div>
          )}
        </div>

        <div className="pt-3 mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-white/5">
          <span className="font-semibold text-cyan-400">
            Priority: {issue.priority_score}/100
          </span>
          <span className="font-semibold text-slate-400 group-hover:text-cyan-300 transition-colors flex items-center gap-1">
            <span>View Issue</span>
            <span>&rarr;</span>
          </span>
        </div>
      </div>
    </div>
  );
};
