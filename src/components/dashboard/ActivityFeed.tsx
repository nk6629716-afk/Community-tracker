import React from 'react';
import { Activity, ThumbsUp, PlusCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatters';

interface ActivityItem {
  id: string;
  type: 'report' | 'upvote' | 'status_change';
  message: string;
  timestamp: string;
  issue_id: string;
  category?: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  onSelectIssueId?: (id: string) => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, onSelectIssueId }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'report':
        return <PlusCircle className="w-3.5 h-3.5 text-sky-600" />;
      case 'upvote':
        return <ThumbsUp className="w-3.5 h-3.5 text-amber-600" />;
      case 'status_change':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#E4E7EC] shadow-xs overflow-hidden">
      <div className="p-4 border-b border-[#E4E7EC] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
            Live Community Activity
          </h3>
        </div>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
          Realtime Stream
        </span>
      </div>

      <div className="p-4 space-y-3.5 max-h-[380px] overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            No recent activity recorded yet.
          </div>
        ) : (
          activities.map((act) => (
            <div
              key={act.id}
              onClick={() => onSelectIssueId && onSelectIssueId(act.issue_id)}
              className="flex items-start gap-3 text-xs group cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors"
            >
              <div className="mt-0.5 p-1 rounded-md bg-slate-100 shrink-0 group-hover:bg-white transition-colors">
                {getIcon(act.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-800 font-medium leading-snug group-hover:text-[#123B5D] transition-colors">
                  {act.message}
                </p>
                <span className="text-[10px] text-slate-400 font-normal">
                  {formatRelativeTime(act.timestamp)}
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:text-[#123B5D] transition-all self-center" />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
