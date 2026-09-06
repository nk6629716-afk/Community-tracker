import React, { useState } from 'react';
import { CheckCircle2, Clock, AlertCircle, Shield, ChevronDown } from 'lucide-react';
import { IssueStatus, IssueUpdate } from '../../types';
import { formatDateTime } from '../../utils/formatters';

interface StatusTimelineProps {
  currentStatus: IssueStatus;
  history?: IssueUpdate[];
  isAuthorityMode?: boolean;
  onUpdateStatus?: (newStatus: IssueStatus, comment: string) => Promise<void>;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({
  currentStatus,
  history = [],
  isAuthorityMode = false,
  onUpdateStatus,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedNextStatus, setSelectedNextStatus] = useState<IssueStatus>(
    currentStatus === 'reported' ? 'in_progress' : 'resolved'
  );
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps: { key: IssueStatus; label: string; icon: any }[] = [
    { key: 'reported', label: 'Reported', icon: AlertCircle },
    { key: 'in_progress', label: 'In Progress', icon: Clock },
    { key: 'resolved', label: 'Resolved', icon: CheckCircle2 },
  ];

  const getStepIndex = (status: IssueStatus) => {
    switch (status) {
      case 'reported':
        return 0;
      case 'in_progress':
        return 1;
      case 'resolved':
        return 2;
    }
  };

  const currentIndex = getStepIndex(currentStatus);

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateStatus) return;
    setIsSubmitting(true);
    try {
      await onUpdateStatus(
        selectedNextStatus,
        comment.trim() || `Status updated to ${selectedNextStatus.replace('_', ' ')}`
      );
      setComment('');
      setIsUpdating(false);
    } catch (err) {
      console.error('Failed to submit status update:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#E4E7EC] p-5 shadow-xs space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Lifecycle & Status Timeline
        </h3>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
          Status: {currentStatus.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {/* Visual Vertical Timeline adhering to specs */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
        {steps.map((step, idx) => {
          const isPassed = idx <= currentIndex;
          const isCurrent = idx === currentIndex;

          // Look for matching historical record
          const matchingHistory = history.find((h) => h.new_status === step.key);

          return (
            <div key={step.key} className="relative group">
              {/* Timeline Bullet Indicator */}
              <div
                className={`absolute -left-[23px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                  isPassed
                    ? step.key === 'resolved'
                      ? 'bg-[#2E8B57] border-white text-white shadow-xs'
                      : step.key === 'in_progress'
                      ? 'bg-[#2F6F8F] border-white text-white shadow-xs'
                      : 'bg-[#123B5D] border-white text-white shadow-xs'
                    : 'bg-white border-slate-300 text-slate-300'
                }`}
              >
                <span className="text-[10px] font-bold">●</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-bold ${
                      isCurrent
                        ? 'text-slate-900'
                        : isPassed
                        ? 'text-slate-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800">
                      Current
                    </span>
                  )}
                </div>

                {matchingHistory ? (
                  <div className="text-xs text-slate-500 space-y-0.5">
                    <p className="font-mono text-[11px] text-slate-400">
                      {formatDateTime(matchingHistory.created_at)}
                    </p>
                    {matchingHistory.comment && (
                      <p className="text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                        "{matchingHistory.comment}"
                        <span className="block text-[10px] text-slate-400 mt-0.5">
                          — {matchingHistory.updated_by}
                        </span>
                      </p>
                    )}
                  </div>
                ) : isPassed ? (
                  <p className="text-xs text-slate-400 italic">Logged by system</p>
                ) : (
                  <p className="text-xs text-slate-400 italic">Pending inspection</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Authority Mode Action Controls */}
      {isAuthorityMode && onUpdateStatus && (
        <div className="pt-4 border-t border-slate-100">
          {!isUpdating ? (
            <button
              onClick={() => setIsUpdating(true)}
              className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg text-xs font-semibold text-amber-900 flex items-center justify-center gap-2 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-amber-700" />
              <span>Update Progress as Authority / Public Works</span>
            </button>
          ) : (
            <form onSubmit={handleSubmitUpdate} className="bg-amber-50/50 p-3.5 rounded-lg border border-amber-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-700" />
                  Official Status Transition
                </span>
                <button
                  type="button"
                  onClick={() => setIsUpdating(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-normal"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Change Status To:
                </label>
                <select
                  value={selectedNextStatus}
                  onChange={(e) => setSelectedNextStatus(e.target.value as IssueStatus)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium focus:ring-1 focus:ring-[#123B5D]"
                >
                  <option value="reported">Reported</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Official Verification / Dispatch Note:
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="e.g., Road repair unit dispatched with hot mix asphalt..."
                  rows={2}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-normal focus:ring-1 focus:ring-[#123B5D]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 bg-[#123B5D] hover:bg-[#0B263D] text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Recording Official Update...' : 'Commit Status Update'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
