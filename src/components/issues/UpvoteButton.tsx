import React, { useState } from 'react';
import { ChevronUp, Check } from 'lucide-react';
import { api, getVotedIssues } from '../../services/api';

interface UpvoteButtonProps {
  issueId: string;
  initialUpvotes: number;
  onVoteSuccess?: (newCount: number) => void;
  className?: string;
}

export const UpvoteButton: React.FC<UpvoteButtonProps> = ({
  issueId,
  initialUpvotes,
  onVoteSuccess,
  className = '',
}) => {
  const isInitiallyVoted = getVotedIssues().includes(issueId);
  const [hasVoted, setHasVoted] = useState<boolean>(isInitiallyVoted);
  const [upvotes, setUpvotes] = useState<number>(initialUpvotes);
  const [isVoting, setIsVoting] = useState<boolean>(false);
  const [justVotedAnimation, setJustVotedAnimation] = useState<boolean>(false);

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasVoted || isVoting) return;

    setIsVoting(true);
    // Optimistic UI update
    const nextVotes = upvotes + 1;
    setUpvotes(nextVotes);
    setHasVoted(true);
    setJustVotedAnimation(true);

    try {
      const res = await api.voteIssue(issueId);
      if (res.success && res.issue) {
        setUpvotes(res.issue.upvotes);
        if (onVoteSuccess) onVoteSuccess(res.issue.upvotes);
      }
    } catch (err) {
      console.error('Failed to register upvote on server:', err);
    } finally {
      setIsVoting(false);
      setTimeout(() => setJustVotedAnimation(false), 800);
    }
  };

  return (
    <button
      id={`upvote-btn-${issueId}`}
      onClick={handleVote}
      disabled={hasVoted || isVoting}
      className={`relative inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border font-medium text-sm transition-all duration-200 ${
        hasVoted
          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 cursor-default'
          : 'bg-white text-slate-700 border-[#E4E7EC] hover:border-[#123B5D] hover:bg-slate-50 cursor-pointer shadow-2xs hover:shadow-xs active:scale-97'
      } ${className}`}
    >
      <div
        className={`flex items-center gap-1 font-bold text-base ${
          justVotedAnimation ? 'scale-125 transition-transform duration-200 text-emerald-600' : ''
        }`}
      >
        {hasVoted ? (
          <Check className="w-4 h-4 text-emerald-600" />
        ) : (
          <ChevronUp className="w-4 h-4 text-[#123B5D]" />
        )}
        <span>{upvotes}</span>
      </div>

      <div className="h-4 w-px bg-slate-200" />

      <span className="text-xs">
        {hasVoted ? 'You marked this as affecting you.' : 'This affects me too'}
      </span>
    </button>
  );
};
