import React from 'react';
import { Flame, ArrowUpRight } from 'lucide-react';
import { Issue } from '../../types';
import { SEVERITY_INFO, getPriorityBadge } from '../../utils/priority';
import { Vector6 } from '../common/DecorativeVectors';

interface PriorityQueueProps {
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
}

export const PriorityQueue: React.FC<PriorityQueueProps> = ({ issues, onSelectIssue }) => {
  return (
    <div className="bg-white rounded-xl border border-[#E4E7EC] shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-[#E4E7EC] flex items-center justify-between relative overflow-hidden">
        {/* Decorative Vector 6 urgency wave */}
        <div className="absolute right-28 top-2 w-20 h-10 opacity-15 text-[#123B5D] pointer-events-none hidden md:block">
          <Vector6 className="w-full h-full" />
        </div>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-50 border border-rose-200">
            <Flame className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#17202A] uppercase tracking-wider">
              Top Community Priorities
            </h3>
            <p className="text-[11px] text-[#667085]">
              Algorithmic ranking weighted by citizen upvotes and safety severity
            </p>
          </div>
        </div>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
          Live Score Engine
        </span>
      </div>

      <div className="divide-y divide-[#E4E7EC]">
        {issues.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No active priority items found.
          </div>
        ) : (
          issues.map((issue, index) => {
            const rankStr = String(index + 1).padStart(2, '0');
            const sevInfo = SEVERITY_INFO[issue.severity];
            const badge = getPriorityBadge(issue.priority_score);

            return (
              <div
                key={issue.id}
                onClick={() => onSelectIssue(issue)}
                className="p-3.5 sm:p-4 hover:bg-slate-50/80 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                  {/* Rank number */}
                  <span className="text-base sm:text-lg font-mono font-bold text-slate-400 group-hover:text-[#123B5D] transition-colors pt-0.5">
                    {rankStr}
                  </span>

                  {/* Details */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-slate-900 truncate group-hover:text-[#123B5D] transition-colors">
                        {issue.title}
                      </h4>
                      {badge.isHigh && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.2 rounded border bg-rose-50 text-rose-700 border-rose-200">
                          <Flame className="w-2.5 h-2.5" /> High priority
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="font-medium text-[#123B5D]">
                        Priority {issue.priority_score}/100
                      </span>
                      <span>•</span>
                      <span className="font-medium text-slate-700">
                        ▲ {issue.upvotes} votes
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${sevInfo.bg}`} style={{ backgroundColor: sevInfo.dotColor }} />
                        <span className={sevInfo.color}>{sevInfo.label}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="shrink-0 flex items-center pl-2">
                  <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-[#123B5D] group-hover:text-white transition-all">
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
