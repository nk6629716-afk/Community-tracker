export type IssueCategory =
  | 'road_damage'
  | 'streetlight'
  | 'garbage'
  | 'water_leakage'
  | 'drainage'
  | 'electricity'
  | 'public_space'
  | 'infrastructure'
  | 'other';

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IssueStatus = 'reported' | 'in_progress' | 'resolved';

export interface AIAnalysis {
  summary: string;
  category: IssueCategory;
  severity: IssueSeverity;
  confidence: number;
  reason: string;
  recommended_action: string;
}

export interface IssueUpdate {
  id: string;
  issue_id: string;
  old_status: IssueStatus | null;
  new_status: IssueStatus;
  comment: string;
  updated_by: string;
  created_at: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  severity: IssueSeverity;
  ai_summary: string;
  ai_severity: IssueSeverity;
  ai_confidence: number;
  ai_reason: string;
  recommended_action: string;
  latitude: number;
  longitude: number;
  address: string;
  photo_url?: string;
  status: IssueStatus;
  is_anonymous: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  upvotes: number;
  priority_score: number;
  history?: IssueUpdate[];
}

export interface AnalyticsData {
  total_reports: number;
  active_issues: number;
  in_progress: number;
  resolved: number;
  resolution_rate: number; // percentage
  avg_resolution_time_days: number;
  by_category: Record<string, number>;
  by_severity: Record<string, number>;
  by_status: Record<string, number>;
  top_locations: { address: string; count: number; high_severity_count: number }[];
  recent_activity: {
    id: string;
    type: 'report' | 'upvote' | 'status_change';
    message: string;
    timestamp: string;
    issue_id: string;
    category?: IssueCategory;
  }[];
  priority_queue: Issue[];
}
