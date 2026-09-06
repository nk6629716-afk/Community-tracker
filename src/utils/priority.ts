import { IssueSeverity, IssueCategory } from '../types';

export const SEVERITY_WEIGHTS: Record<IssueSeverity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export function calculatePriorityScore(
  severity: IssueSeverity,
  upvotes: number,
  createdAt: string
): number {
  const sevWeight = SEVERITY_WEIGHTS[severity] || 2;
  
  // Community impact with logarithmic dampening to prevent spam upvote explosion
  // 0 votes -> 1.0, 10 votes -> ~2.0, 50 votes -> ~2.7, 100 votes -> ~3.0
  const communityImpact = 1 + Math.log10(1 + Math.max(0, upvotes)) * 0.85;

  // Age factor: slightly increases urgency if an issue has been open without resolution
  const now = new Date().getTime();
  const created = new Date(createdAt).getTime();
  const daysOld = Math.max(0, (now - created) / (1000 * 60 * 60 * 24));
  const ageFactor = 1 + Math.min(0.5, daysOld * 0.05); // up to +50% after 10 days

  // Base raw score: (1..4) * (1..3.5) * (1..1.5) => roughly 1 to 21
  const rawScore = sevWeight * communityImpact * ageFactor;
  
  // Scale to 1..100
  const normalized = Math.min(100, Math.max(1, Math.round((rawScore / 18) * 100)));
  return normalized;
}

export function getPriorityBadge(score: number): {
  label: string;
  badgeClass: string;
  isHigh: boolean;
} {
  if (score >= 75) {
    return {
      label: 'High Community Priority',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      isHigh: true,
    };
  }
  if (score >= 50) {
    return {
      label: 'Elevated Community Attention',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      isHigh: false,
    };
  }
  return {
    label: 'Standard Community Review',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    isHigh: false,
  };
}

export const CATEGORY_LABELS: Record<IssueCategory, string> = {
  road_damage: 'Road Damage',
  streetlight: 'Streetlight',
  garbage: 'Garbage',
  water_leakage: 'Water Leakage',
  drainage: 'Drainage',
  electricity: 'Electricity',
  public_space: 'Public Space',
  infrastructure: 'Infrastructure',
  other: 'Other Issue',
};

export const SEVERITY_INFO: Record<
  IssueSeverity,
  { label: string; color: string; bg: string; border: string; dotColor: string }
> = {
  low: {
    label: 'Low',
    color: 'text-[#2E8B57]',
    bg: 'bg-[#2E8B57]/10',
    border: 'border-[#2E8B57]/30',
    dotColor: '#2E8B57',
  },
  medium: {
    label: 'Medium',
    color: 'text-[#D69E2E]',
    bg: 'bg-[#D69E2E]/10',
    border: 'border-[#D69E2E]/30',
    dotColor: '#D69E2E',
  },
  high: {
    label: 'High',
    color: 'text-[#DD6B20]',
    bg: 'bg-[#DD6B20]/10',
    border: 'border-[#DD6B20]/30',
    dotColor: '#DD6B20',
  },
  critical: {
    label: 'Critical',
    color: 'text-[#D64545]',
    bg: 'bg-[#D64545]/10',
    border: 'border-[#D64545]/30',
    dotColor: '#D64545',
  },
};

export const STATUS_INFO: Record<
  string,
  { label: string; color: string; bg: string; border: string; step: number }
> = {
  reported: {
    label: 'Reported',
    color: 'text-[#667085]',
    bg: 'bg-[#667085]/10',
    border: 'border-[#667085]/30',
    step: 1,
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-[#2F6F8F]',
    bg: 'bg-[#2F6F8F]/10',
    border: 'border-[#2F6F8F]/30',
    step: 2,
  },
  resolved: {
    label: 'Resolved',
    color: 'text-[#2E8B57]',
    bg: 'bg-[#2E8B57]/10',
    border: 'border-[#2E8B57]/30',
    step: 3,
  },
};
