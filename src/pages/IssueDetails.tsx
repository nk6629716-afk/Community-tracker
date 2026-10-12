import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Sparkles, AlertTriangle, ShieldCheck, Share2, Check, ExternalLink, Tag, Copy, Trash2, X, ShieldAlert, QrCode, Download, Printer } from 'lucide-react';
import QRCode from 'qrcode';
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
  onIssueDeleted?: (deletedIssueId: string) => void;
}

export const IssueDetails: React.FC<IssueDetailsProps> = ({
  issue,
  onBack,
  isAuthorityMode,
  onIssueUpdated,
  onIssueDeleted,
}) => {
  const [currentIssue, setCurrentIssue] = useState<Issue>(issue);
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedTicket, setCopiedTicket] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('Ground physical inspection completed: False report / No hazard detected on site.');
  const [isDeleting, setIsDeleting] = useState(false);

  // Ticket QR Code State
  const [showQrModal, setShowQrModal] = useState(false);
  const [ticketQrDataUrl, setTicketQrDataUrl] = useState<string>('');
  const [copiedQrLink, setCopiedQrLink] = useState(false);

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

  // Generate real Ticket QR Code on demand
  useEffect(() => {
    if (showQrModal && !ticketQrDataUrl) {
      const ticketUrl = `${window.location.origin}${window.location.pathname}?issue=${currentIssue.id}&ticket=${ticketId}`;
      QRCode.toDataURL(ticketUrl, {
        width: 350,
        margin: 2,
        color: { dark: '#0a0f1d', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      })
        .then(setTicketQrDataUrl)
        .catch((err) => console.error('Failed to generate ticket QR:', err));
    }
  }, [showQrModal, currentIssue.id, ticketId, ticketQrDataUrl]);

  const handleDownloadTicketQr = () => {
    if (!ticketQrDataUrl) return;
    const a = document.createElement('a');
    a.href = ticketQrDataUrl;
    a.download = `Citypulse_Ticket_QR_${ticketId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDeleteReport = async () => {
    try {
      setIsDeleting(true);
      await api.deleteReport(currentIssue.id, deleteReason.trim() || undefined);
      setShowDeleteModal(false);
      if (onIssueDeleted) {
        onIssueDeleted(currentIssue.id);
      } else {
        onBack();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete false report');
      setIsDeleting(false);
    }
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
          {/* Delete False Report Button - Exclusive to Officials & Master Admin */}
          {isAuthorityMode && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              title="Delete false report after manual inspection (Officials & Master Admin only)"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Delete False Report</span>
            </button>
          )}

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
                <span>Share</span>
              </>
            )}
          </button>

          {/* Ticket QR Code Button */}
          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            title="Generate & print physical QR code for this ticket"
          >
            <QrCode className="w-3.5 h-3.5 text-[#123B5D]" />
            <span>Ticket QR</span>
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

      {/* False Report Deletion Modal (Officials & Master Admin Only) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md animate-fade-in" onClick={() => !isDeleting && setShowDeleteModal(false)} />
          <div className="relative glass-card bg-slate-950 border border-rose-500/50 p-6 sm:p-7 rounded-3xl max-w-lg w-full text-white space-y-5 animate-scale-up shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-400/30">
                    AUTHORITY ONLY
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">Delete False Report</h3>
                </div>
              </div>

              <button
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You are about to permanently purge this report from the municipal registry after manual field inspection:
            </p>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1">
              <div className="font-bold text-white truncate">{currentIssue.title}</div>
              <div className="text-slate-400 font-mono text-[11px]">Ticket: {ticketId} • Category: {catLabel}</div>
              <div className="text-slate-400 truncate text-[11px]">📍 {currentIssue.address}</div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                Manual Inspection Finding / Reason *
              </label>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Ground physical inspection: No defect or hazard on site',
                  'Fabricated / spurious citizen submission',
                  'Inauthentic / irrelevant photograph attachment',
                  'Duplicate report / resolved earlier',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDeleteReason(preset)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] transition cursor-pointer border ${
                      deleteReason === preset
                        ? 'bg-rose-500/30 border-rose-400/60 text-rose-200 font-bold'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <textarea
                rows={2}
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Enter manual inspection findings..."
                className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-rose-400/50 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteReport}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-rose-600/30 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Confirm & Delete False Report'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Ticket QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 border border-slate-300 shadow-2xl text-center">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-[#123B5D]">
                <QrCode className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">
                  Incident Ticket QR Code
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-[#123B5D] border border-slate-200">
                {ticketId}
              </span>
              <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{currentIssue.title}</h4>
              <p className="text-slate-500 text-xs">📍 {currentIssue.address}</p>
            </div>

            {/* Scannable QR Code Image */}
            <div className="p-3 bg-white border-2 border-slate-900 rounded-2xl shadow-md inline-block relative mx-auto">
              {ticketQrDataUrl ? (
                <img
                  src={ticketQrDataUrl}
                  alt={`Ticket QR for ${ticketId}`}
                  className="w-48 h-48 object-contain"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
                  Generating QR...
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-8 h-8 bg-white rounded-md border border-slate-900 flex items-center justify-center shadow-xs">
                  <span className="font-black text-[10px] text-[#123B5D]">CP</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-snug">
              Point any smartphone camera to check this report's real-time civic status, priority score, and resolution timeline.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleDownloadTicketQr}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save PNG</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 px-3 bg-[#123B5D] hover:bg-[#0B263D] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Placard</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
