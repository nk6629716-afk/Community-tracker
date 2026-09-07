import { Pool } from 'pg';
import type { AnalyticsData, Issue, IssueCategory, IssueSeverity, IssueStatus } from '../types';
import { calculatePriorityScore } from '../utils/priority';
import type { ReportRecord, UserRecord } from './database';

type ReportFilters = {
  category?: string;
  status?: string;
  severity?: string;
  search?: string;
  sort?: string;
  userId?: string;
};

type CreateReportInput = {
  title: string;
  description: string;
  category: IssueCategory;
  severity: IssueSeverity;
  latitude: number;
  longitude: number;
  address: string;
  photo_url?: string;
  is_anonymous?: boolean;
  created_by?: string;
  userId?: string;
  ai_summary?: string;
  ai_severity?: IssueSeverity;
  ai_confidence?: number;
  ai_reason?: string;
  recommended_action?: string;
};

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

function mapUser(row: any): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    name: row.name,
    role: row.role,
    age: row.age ?? undefined,
    area: row.area ?? undefined,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function mapHistory(row: any) {
  return {
    id: row.id,
    issue_id: row.report_id,
    old_status: row.old_status,
    new_status: row.new_status,
    comment: row.comment,
    updated_by: row.updated_by,
    created_at: new Date(row.created_at).toISOString(),
  };
}

function mapReport(row: any, history: any[] = []): ReportRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    severity: row.severity,
    status: row.status,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    address: row.address,
    photo_url: row.photo_url ?? undefined,
    is_anonymous: row.is_anonymous,
    created_by: row.created_by,
    userId: row.user_id ?? undefined,
    ai_summary: row.ai_summary ?? undefined,
    ai_severity: row.ai_severity ?? undefined,
    ai_confidence: row.ai_confidence == null ? undefined : Number(row.ai_confidence),
    ai_reason: row.ai_reason ?? undefined,
    recommended_action: row.recommended_action ?? undefined,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString(),
    upvotes: row.upvotes,
    priority_score: row.priority_score,
    history: history.map(mapHistory),
  };
}

export class PostgresCitypulseDatabase {
  async healthcheck() {
    await pool.query('SELECT 1');
  }

  async createUser(user: { email: string; passwordHash: string; name: string; role?: UserRecord['role']; age?: number; area?: string }) {
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, role, age, area)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [user.email.toLowerCase().trim(), user.passwordHash, user.name.trim(), user.role || 'CITIZEN', user.age ?? null, user.area ?? null],
    );
    return mapUser(result.rows[0]);
  }

  async findUserByEmail(email: string) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  async findUserById(id: string) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  async getAllReports(filters: ReportFilters = {}) {
    const conditions: string[] = [];
    const values: unknown[] = [];
    const add = (expression: string, value: unknown) => {
      values.push(value);
      conditions.push(expression.replace('?', `$${values.length}`));
    };
    if (filters.userId) add('user_id = ?', filters.userId);
    if (filters.category && filters.category !== 'all') add('category = ?', filters.category);
    if (filters.status && filters.status !== 'all') add('status = ?', filters.status);
    if (filters.severity && filters.severity !== 'all') add('severity = ?', filters.severity);
    if (filters.search) add("(title ILIKE ? OR description ILIKE ? OR address ILIKE ? OR category ILIKE ?)", `%${filters.search.trim()}%`);
    // The search condition uses the same parameter four times.
    if (filters.search) {
      const value = values.pop();
      conditions.pop();
      values.push(value, value, value, value);
      const n = values.length;
      conditions.push(`(title ILIKE $${n - 3} OR description ILIKE $${n - 2} OR address ILIKE $${n - 1} OR category ILIKE $${n})`);
    }
    const orderBy = filters.sort === 'most_upvoted'
      ? 'upvotes DESC, created_at DESC'
      : filters.sort === 'highest_priority'
        ? 'priority_score DESC, created_at DESC'
        : 'created_at DESC';
    const result = await pool.query(`SELECT * FROM reports ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''} ORDER BY ${orderBy}`, values);
    return Promise.all(result.rows.map((row) => this.getReportById(row.id) as Promise<ReportRecord>));
  }

  async getReportById(id: string): Promise<ReportRecord | null> {
    const report = await pool.query('SELECT * FROM reports WHERE id = $1', [id]);
    if (!report.rows[0]) return null;
    const history = await pool.query('SELECT * FROM report_history WHERE report_id = $1 ORDER BY created_at ASC', [id]);
    return mapReport(report.rows[0], history.rows);
  }

  async createReport(data: CreateReportInput): Promise<ReportRecord> {
    const now = new Date();
    const upvotes = 1;
    const priorityScore = calculatePriorityScore(data.severity, upvotes, now.toISOString());
    const result = await pool.query(
      `INSERT INTO reports (title, description, category, severity, latitude, longitude, address, photo_url,
        is_anonymous, created_by, user_id, ai_summary, ai_severity, ai_confidence, ai_reason,
        recommended_action, upvotes, priority_score)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [data.title.trim(), data.description.trim(), data.category, data.severity, data.latitude, data.longitude,
        data.address.trim(), data.photo_url ?? null, Boolean(data.is_anonymous),
        data.is_anonymous ? 'Reported anonymously' : (data.created_by || 'Citizen'), data.userId ?? null,
        data.ai_summary || `${data.title} reported at ${data.address}.`, data.ai_severity || data.severity,
        data.ai_confidence ?? 0.88, data.ai_reason || 'Verified community issue submission.',
        data.recommended_action || 'Assign municipal field assessment crew.', upvotes, priorityScore],
    );
    const report = result.rows[0];
    await pool.query(
      `INSERT INTO report_history (report_id, old_status, new_status, comment, updated_by)
       VALUES ($1, NULL, 'reported', $2, $3)`,
      [report.id, 'Signal registered in Citypulse municipal database.', data.is_anonymous ? 'Citizen' : (data.created_by || 'Citizen')],
    );
    return (await this.getReportById(report.id))!;
  }

  async updateReportStatus(id: string, status: IssueStatus, comment: string, updatedBy: string) {
    const existing = await this.getReportById(id);
    if (!existing) return null;
    await pool.query('UPDATE reports SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);
    await pool.query(
      'INSERT INTO report_history (report_id, old_status, new_status, comment, updated_by) VALUES ($1,$2,$3,$4,$5)',
      [id, existing.status, status, comment || `Status updated to ${status.replace('_', ' ').toUpperCase()}`, updatedBy || 'Authority Official'],
    );
    return this.getReportById(id);
  }

  async addUpvote(id: string) {
    const existing = await this.getReportById(id);
    if (!existing) return null;
    const upvotes = existing.upvotes + 1;
    const priorityScore = calculatePriorityScore(existing.severity, upvotes, existing.created_at);
    await pool.query('UPDATE reports SET upvotes = $1, priority_score = $2, updated_at = NOW() WHERE id = $3', [upvotes, priorityScore, id]);
    return this.getReportById(id);
  }

  async getAnalytics(): Promise<AnalyticsData> {
    const reports = await this.getAllReports();
    const count = (predicate: (report: Issue) => boolean) => reports.filter(predicate).length;
    const total = reports.length;
    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const locationMap = new Map<string, { count: number; high: number }>();
    reports.forEach((report) => {
      byCategory[report.category] = (byCategory[report.category] || 0) + 1;
      bySeverity[report.severity] = (bySeverity[report.severity] || 0) + 1;
      byStatus[report.status] = (byStatus[report.status] || 0) + 1;
      const item = locationMap.get(report.address) || { count: 0, high: 0 };
      item.count += 1;
      if (report.severity === 'high' || report.severity === 'critical') item.high += 1;
      locationMap.set(report.address, item);
    });
    return {
      total_reports: total,
      active_issues: count((report) => report.status !== 'resolved'),
      in_progress: count((report) => report.status === 'in_progress'),
      resolved: count((report) => report.status === 'resolved'),
      resolution_rate: total ? Math.round((count((report) => report.status === 'resolved') / total) * 100) : 0,
      avg_resolution_time_days: 0,
      by_category: byCategory,
      by_severity: bySeverity,
      by_status: byStatus,
      top_locations: [...locationMap.entries()].map(([address, item]) => ({ address, count: item.count, high_severity_count: item.high })).sort((a, b) => b.count - a.count).slice(0, 5),
      priority_queue: reports.filter((report) => report.status !== 'resolved').sort((a, b) => b.priority_score - a.priority_score).slice(0, 8),
      recent_activity: reports.slice(0, 8).map((report) => ({ id: `act-${report.id}`, issue_id: report.id, type: report.status === 'resolved' ? 'status_change' : 'report', message: report.status === 'resolved' ? `Issue marked as resolved by municipal authority: ${report.title}` : `New civic report logged at ${report.address}: ${report.title}`, timestamp: report.updated_at || report.created_at, category: report.category })),
    };
  }
}
