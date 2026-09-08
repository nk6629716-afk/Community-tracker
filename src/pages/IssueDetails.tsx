import React, { useState } from 'react';
import { ArrowLeft, MapPin, Sparkles, AlertTriangle, ShieldCheck, Share2, Check, ExternalLink, Tag, Copy } from 'lucide-react';
import { Issue, IssueStatus } from '../types';
import { CATEGORY_LABELS, SEVERITY_INFO, getPriorityBadge } from '../utils/priority';
import { formatDateTime, getTicketId } from '../utils/formatters';
import { UpvoteButton } from '../components/issues/UpvoteButton';
import { StatusTimeline } from '../components/issues/StatusTimeline';
import { InteractiveMap } from '../components/map/InteractiveMap';
import { api } from '../services/api';
import { Vector11 } from '../components/common/DecorativeVectors';

interface IssueDetailsProps {
  issue: Issue;
  onBack: () => void;
  isAuthorityMode: boolean;
  onIssueUpdated: (updatedIssue: Issue) => void;
}

export const IssueDetails: React.FC<IssueDetailsProps> = ({
  issue,
  onBack,
  isAuthorityMode,
  onIssueUpdated,
}) => {
  const [currentIssue, setCurrentIssue] = useState<Issue>(issue);
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedTicket, setCopiedTicket] = useState(false);

  const catLabel = CATEGORY_LABELS[currentIssue.category] || currentIssue.category;
  const sevInfo = SEVERITY_INFO[currentIssue.severity];
  const priorityBadge = getPriorityBadge(currentIssue.priority_score);
  const ticketId = getTicketId(currentIssue);

  const handleUpdateStatus = async (newStatus: IssueStatus, comment: string) => {
    try {
      const res = await api.updateStatus(currentIssue.id, newStatus, comment, 'Civic Official');
      if (res && res.issue) {
        setCurrentIssue(res.issue);
        onIssueUpdated(res.issue);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleCopyTicket = () => {
    navigator.clipboard.writeText(ticketId);
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Back Button and Action Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>&larr; Back to Reports</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyTicket}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 border border-cyan-200 hover:bg-cyan-100 text-cyan-800 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
          >
            {copiedTicket ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ticket Copied!</span>
              </>
            ) : (
              <>
                <Tag className="w-3.5 h-3.5 text-cyan-600" />
                <span>Ticket: {ticketId}</span>
              </>
            )}
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E4E7EC] hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            {copiedShare ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Link Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Share Issue</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Issue Header Card */}
      <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6 sm:p-8 shadow-xs space-y-6">
        {/* Category & Status Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-md bg-[#123B5D] text-white">
              {catLabel}
            </span>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-slate-900 text-cyan-300 border border-slate-700">
              {ticketId}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${sevInfo.border} ${sevInfo.bg} ${sevInfo.color}`}>
              ● {sevInfo.label} Severity
            </span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${priorityBadge.badgeClass}`}>
              Priority {currentIssue.priority_score}/100
            </span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17202A] leading-tight">
          {currentIssue.title}
        </h1>

        {/* Location & Reporter Info */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 border-y border-slate-100 py-3">
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <MapPin className="w-4 h-4 text-[#2F6F8F]" />
            <span>{currentIssue.address}</span>
          </div>
          <span>•</span>
          <div>
            Reported by:{' '}
            <span className="font-semibold text-slate-700">
              {currentIssue.is_anonymous ? 'Reported anonymously' : currentIssue.created_by}
            </span>
          </div>
          <span>•</span>
          <div>{formatDateTime(currentIssue.created_at)}</div>
        </div>

        {/* Photo Upload Preview */}
        {currentIssue.photo_url && (
          <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-h-96">
            <img
              src={currentIssue.photo_url}
              alt={currentIssue.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* Detailed Description */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Citizen Description
          </h3>
          <p className="text-sm sm:text-base text-slate-800 leading-relaxed">
            {currentIssue.description}
          </p>
        </div>

        {/* Community Impact Upvote Bar (Page 20 & 23) */}
        <div className="bg-[#F7F8FA] border border-[#E4E7EC] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
          {/* Subtle decorative Vector 11 connector */}
          <div className="absolute right-32 top-1 w-20 h-14 opacity-15 text-[#2F6F8F] pointer-events-none hidden md:block">
            <Vector11 className="w-full h-full" />
          </div>
          <div className="relative z-10">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">
              Community Impact
            </div>
            <div className="text-lg font-extrabold text-slate-900">
              ▲ {currentIssue.upvotes} citizens marked as affected
            </div>
            <p className="text-xs text-slate-500">
              Higher community impact elevates this issue on municipal priority dashboards.
            </p>
          </div>

          <UpvoteButton
            issueId={currentIssue.id}
            initialUpvotes={currentIssue.upvotes}
            onVoteSuccess={(count) => {
              setCurrentIssue((prev) => ({ ...prev, upvotes: count }));
            }}
          />
        </div>

        {/* AI Analysis & Summary Section (Page 16 & 23 of PDF) */}
        <div className="bg-sky-50/50 border border-sky-200/80 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#2F6F8F]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#123B5D]">
                AI Summary & Intelligence
              </span>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-white border border-sky-200 text-sky-800">
              AI-predicted severity: {sevInfo.label} ({(currentIssue.ai_confidence * 100).toFixed(0)}% confidence)
            </span>
          </div>

          <p className="text-sm font-medium text-slate-800 leading-relaxed">
            {currentIssue.ai_summary || currentIssue.description}
          </p>

          {currentIssue.ai_reason && (
            <p className="text-xs text-slate-600 italic">
              AI Rationale: "{currentIssue.ai_reason}"
            </p>
          )}

          {/* AI Responsible UX Disclaimer (Page 16, #20) */}
          <div className="pt-2 border-t border-sky-200/60 text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span>
              AI-generated recommendation. Community/authority verification is required.
            </span>
          </div>
        </div>

        {/* Recommended Action (Page 24, #30) */}
        {currentIssue.recommended_action && (
          <div className="bg-amber-50/50 border border-amber-200/70 rounded-xl p-4 space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
              Recommended Public Works Action
            </div>
            <p className="text-xs sm:text-sm text-amber-950 font-medium leading-relaxed">
              {currentIssue.recommended_action}
            </p>
          </div>
        )}
      </div>

      {/* Grid: Status Timeline & Location Mini-Map */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Timeline */}
        <StatusTimeline
          currentStatus={currentIssue.status}
          history={currentIssue.history}
          isAuthorityMode={isAuthorityMode}
          onUpdateStatus={handleUpdateStatus}
        />

        {/* Mini Location Map */}
        <div className="bg-white rounded-xl border border-[#E4E7EC] p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Reported Location
            </h3>
            <span className="text-[11px] font-mono text-slate-500">
              {currentIssue.latitude.toFixed(4)}, {currentIssue.longitude.toFixed(4)}
            </span>
          </div>

          <InteractiveMap
            issues={[currentIssue]}
            center={[currentIssue.latitude, currentIssue.longitude]}
            zoom={15}
            className="h-[240px] w-full"
          />

          <div className="text-xs text-slate-600 pt-1">
            <span className="font-semibold text-slate-800">Address / Vicinity: </span>
            {currentIssue.address}
          </div>
        </div>
      </div>
    </div>
  );
};
