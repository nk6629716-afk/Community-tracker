import React from 'react';
import { MapPin, Users, Sparkles, ImageOff } from 'lucide-react';
import { Issue } from '../../types';
import { CATEGORY_LABELS, SEVERITY_INFO, STATUS_INFO } from '../../utils/priority';

interface IssueCardProps {
  issue: Issue;
  onClick: (issue: Issue) => void;
}

export const IssueCard: React.FC<IssueCardProps> = ({ issue, onClick }) => {
  const catLabel = CATEGORY_LABELS[issue.category] || issue.category.replace('_', ' ');
  const sev = SEVERITY_INFO[issue.severity];
  const status = STATUS_INFO[issue.status];

  return (
    <div
      onClick={() => onClick(issue)}
      className="bg-white rounded-xl border border-[#E4E7EC] hover:border-[#2F6F8F] shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col overflow-hidden group"
    >
      {/* Photo header */}
      <div className="relative h-44 w-full bg-slate-100 overflow-hidden shrink-0">
        {issue.photo_url ? (
          <img
            src={issue.photo_url}
            alt={issue.title}
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={(e) => {
              // fallback if broken external link
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100">
            <ImageOff className="w-8 h-8 stroke-1" />
            <span className="text-[11px] mt-1 font-medium">No photo attached</span>
          </div>
        )}

        {/* Category Pill on top left */}
        <div className="absolute top-2.5 left-2.5">
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-[#123B5D]/90 text-white backdrop-blur-xs shadow-xs">
            {catLabel}
          </span>
        </div>

        {/* Status Pill on top right */}
        <div className="absolute top-2.5 right-2.5">
          <span className={`px-2 py-1 rounded-md text-[11px] font-semibold backdrop-blur-xs shadow-xs border ${status.border} ${status.bg} ${status.color} bg-white/95`}>
            ● {status.label}
          </span>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-[#123B5D] transition-colors mb-2 line-clamp-2">
            {issue.title}
          </h3>

          {/* Location & Metadata */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{issue.address}</span>
          </div>

          {/* Severity & Community Impact */}
          <div className="flex items-center justify-between gap-2 py-2 border-y border-slate-100 text-xs mb-3">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: sev.dotColor }}
              />
              <span className={`font-semibold ${sev.color}`}>{sev.label} Severity</span>
            </div>

            <div className="flex items-center gap-1 text-slate-700 font-semibold">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>▲ {issue.upvotes} affected</span>
            </div>
          </div>

          {/* AI Summary snippet */}
          {issue.ai_summary && (
            <div className="bg-[#F7F8FA] border border-[#E4E7EC] rounded-lg p-2.5 text-xs text-slate-600">
              <div className="flex items-center gap-1 text-[10px] font-bold text-[#123B5D] uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3 text-[#2F6F8F]" />
                <span>AI Summary</span>
              </div>
              <p className="line-clamp-2 text-slate-700 text-[11px] leading-relaxed">
                {issue.ai_summary}
              </p>
            </div>
          )}
        </div>

        <div className="pt-3 mt-2 flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium text-[#123B5D]">
            Priority: {issue.priority_score}/100
          </span>
          <span className="font-medium text-slate-500 group-hover:text-[#123B5D] transition-colors">
            View Issue &rarr;
          </span>
        </div>
      </div>
    </div>
  );
};
