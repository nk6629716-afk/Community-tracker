import { Pool, PoolConfig } from 'pg';
import type { AnalyticsData, Issue, IssueCategory, IssueSeverity, IssueStatus } from '../types';
import { calculatePriorityScore } from '../utils/priority';
import type { ReportRecord, UserRecord } from './database';
import { DELHI_REAL_PROBLEMS } from './delhi-seed';

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

// UUID validation helper to prevent PostgreSQL syntax errors on custom identifiers (e.g. Master Admin)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isUuid(id?: string | null): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id.trim());
}

// Check whether SSL should be enabled (disabled for localhost, enabled for managed services like Aiven and Render)
const isLocalhost = Boolean(
  process.env.DATABASE_URL?.includes('localhost') || 
  process.env.DATABASE_URL?.includes('127.0.0.1')
);

// If running in cloud production with managed PostgreSQL (e.g. Aiven), prevent Node TLS rejection of provider CA chains
if (process.env.DATABASE_URL && !isLocalhost) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

/**
 * Strips any '?sslmode=...' query parameter from the URL.
 * When 'sslmode=require' is left in the connection string, node-postgres's internal parser
 * treats it as 'verify-full' and overwrites 'rejectUnauthorized: false', causing self-signed
 * certificate errors on managed services like Aiven.
 */
function getNormalizedDatabaseUrl(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;
  try {
    const parsed = new URL(rawUrl);
    parsed.searchParams.delete('sslmode');
    return parsed.toString();
  } catch {
    return rawUrl.replace(/([?&])sslmode=[^&]+(&|$)/, '$1').replace(/[?&]$/, '');
  }
}

// Standard PostgreSQL Pool configuration strictly driven by process.env.DATABASE_URL
const poolConfig: PoolConfig = {
  connectionString: getNormalizedDatabaseUrl(process.env.DATABASE_URL),
  ssl: isLocalhost ? false : { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

export const pool = new Pool(poolConfig);

// Catch unexpected idle client errors so the server process does not terminate
pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Unexpected Error]:', err.message);
});

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
  private schemaReady = false;

  /**
   * Automatically initializes necessary tables and indexes if they do not exist.
   * Ensures seamless onboarding to clean managed databases like Aiven.
   */
  async ensureSchema() {
    if (this.schemaReady) return;
    try {
      await pool.query(`
        CREATE EXTENSION IF NOT EXISTS pgcrypto;

        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'CITIZEN' CHECK (role IN ('CITIZEN', 'AUTHORITY', 'ADMIN')),
          age INTEGER,
          area TEXT,
          latitude DOUBLE PRECISION,
          longitude DOUBLE PRECISION,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS reports (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          category TEXT NOT NULL,
          severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
          status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'in_progress', 'resolved')),
          latitude DOUBLE PRECISION NOT NULL,
          longitude DOUBLE PRECISION NOT NULL,
          address TEXT NOT NULL,
          photo_url TEXT,
          is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
          created_by TEXT NOT NULL DEFAULT 'Citizen',
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          ai_summary TEXT,
          ai_severity TEXT,
          ai_confidence DOUBLE PRECISION,
          ai_reason TEXT,
          recommended_action TEXT,
          upvotes INTEGER NOT NULL DEFAULT 0,
          priority_score INTEGER NOT NULL DEFAULT 50,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS report_history (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
          old_status TEXT,
          new_status TEXT NOT NULL CHECK (new_status IN ('reported', 'in_progress', 'resolved')),
          comment TEXT NOT NULL,
          updated_by TEXT NOT NULL DEFAULT 'System',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS reports_status_idx ON reports(status);
        CREATE INDEX IF NOT EXISTS reports_created_at_idx ON reports(created_at DESC);
        CREATE INDEX IF NOT EXISTS reports_priority_idx ON reports(priority_score DESC);
        CREATE INDEX IF NOT EXISTS report_history_report_id_idx ON report_history(report_id);
      `);

      // Auto-seed real-life Delhi civic problems if table is empty
      const countRes = await pool.query('SELECT COUNT(*) FROM reports');
      const count = parseInt(countRes.rows[0].count, 10);
      if (count === 0) {
        await this.seedDelhiIssues(false);
      }

      this.schemaReady = true;
    } catch (err) {
      console.warn('[PostgreSQL Schema Init Warning]:', err);
    }
  }

  async seedDelhiIssues(force = false) {
    if (force) {
      await pool.query('DELETE FROM report_history');
      await pool.query('DELETE FROM reports');
    }

    for (const item of DELHI_REAL_PROBLEMS) {
      await pool.query(
        `INSERT INTO reports (id, title, description, category, severity, status, latitude, longitude, address, photo_url, is_anonymous, created_by, ai_summary, ai_severity, ai_confidence, ai_reason, recommended_action, upvotes, priority_score, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           address = EXCLUDED.address,
           photo_url = EXCLUDED.photo_url,
           latitude = EXCLUDED.latitude,
           longitude = EXCLUDED.longitude,
           category = EXCLUDED.category,
           severity = EXCLUDED.severity`,
        [
          item.id,
          item.title,
          item.description,
          item.category,
          item.severity,
          item.status,
          item.latitude,
          item.longitude,
          item.address,
          item.photo_url,
          Boolean(item.is_anonymous),
          item.created_by,
          item.ai_summary,
          item.ai_severity,
          item.ai_confidence,
          item.ai_reason,
          item.recommended_action,
          item.upvotes,
          item.priority_score,
          item.created_at,
          item.updated_at,
        ]
      );

      if (item.history && item.history.length > 0) {
        for (const h of item.history) {
          await pool.query(
            `INSERT INTO report_history (report_id, old_status, new_status, comment, updated_by, created_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT DO NOTHING`,
            [item.id, h.old_status, h.new_status, h.comment, h.updated_by, h.created_at]
          );
        }
      }
    }
    console.log('[PostgreSQL] Seeded authentic Delhi civic issues into database.');
  }

  async healthcheck() {
    await pool.query('SELECT 1');
    await this.ensureSchema();
  }

  async createUser(user: { email: string; passwordHash: string; name: string; role?: UserRecord['role']; age?: number; area?: string }) {
    await this.ensureSchema();
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, role, age, area)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [user.email.toLowerCase().trim(), user.passwordHash, user.name.trim(), user.role || 'CITIZEN', user.age ?? null, user.area ?? null],
    );
    return mapUser(result.rows[0]);
  }

  async findUserByEmail(email: string) {
    await this.ensureSchema();
    const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [email.toLowerCase().trim()]);
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  async findUserById(id: string) {
    if (!isUuid(id)) return null;
    await this.ensureSchema();
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  async getAllUsers() {
    await this.ensureSchema();
    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    return result.rows.map(mapUser);
  }

  async updateUserRole(id: string, role: UserRecord['role']) {
    if (!isUuid(id)) return null;
    await this.ensureSchema();
    const result = await pool.query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [role, id]
    );
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  async deleteUser(id: string) {
    if (!isUuid(id)) return false;
    await this.ensureSchema();
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return true;
  }

  async updateUserPassword(email: string, passwordHash: string) {
    await this.ensureSchema();
    const result = await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE LOWER(email) = $2 RETURNING *',
      [passwordHash, email.toLowerCase().trim()]
    );
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  async getAllReports(filters: ReportFilters = {}) {
    await this.ensureSchema();
    const conditions: string[] = [];
    const values: unknown[] = [];
    const add = (expression: string, value: unknown) => {
      values.push(value);
      conditions.push(expression.replace('?', `$${values.length}`));
    };

    if (filters.userId && isUuid(filters.userId)) add('user_id = ?', filters.userId);
    if (filters.category && filters.category !== 'all') add('category = ?', filters.category);
    if (filters.status && filters.status !== 'all') add('status = ?', filters.status);
    if (filters.severity && filters.severity !== 'all') add('severity = ?', filters.severity);
    if (filters.search) {
      values.push(`%${filters.search.trim()}%`);
      const p = `$${values.length}`;
      conditions.push(`(title ILIKE ${p} OR description ILIKE ${p} OR address ILIKE ${p} OR category ILIKE ${p})`);
    }

    const orderBy = filters.sort === 'most_upvoted'
      ? 'upvotes DESC, created_at DESC'
      : filters.sort === 'highest_priority'
        ? 'priority_score DESC, created_at DESC'
        : 'created_at DESC';

    const result = await pool.query(
      `SELECT * FROM reports ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''} ORDER BY ${orderBy}`,
      values
    );

    if (result.rows.length === 0) return [];

    // Batch query history for all fetched reports in a single query (avoids N+1 query latency)
    const reportIds = result.rows.map((row) => row.id);
    const historyResult = await pool.query(
      'SELECT * FROM report_history WHERE report_id = ANY($1) ORDER BY created_at ASC',
      [reportIds]
    );

    const historyMap = new Map<string, any[]>();
    for (const h of historyResult.rows) {
      if (!historyMap.has(h.report_id)) {
        historyMap.set(h.report_id, []);
      }
      historyMap.get(h.report_id)!.push(h);
    }

    return result.rows.map((row) => mapReport(row, historyMap.get(row.id) || []));
  }

  async getReportById(id: string): Promise<ReportRecord | null> {
    if (!isUuid(id)) return null;
    await this.ensureSchema();
    const report = await pool.query('SELECT * FROM reports WHERE id = $1', [id]);
    if (!report.rows[0]) return null;
    const history = await pool.query('SELECT * FROM report_history WHERE report_id = $1 ORDER BY created_at ASC', [id]);
    return mapReport(report.rows[0], history.rows);
  }

  async createReport(data: CreateReportInput): Promise<ReportRecord> {
    await this.ensureSchema();
    const now = new Date();
    const upvotes = 1;
    const priorityScore = calculatePriorityScore(data.severity, upvotes, now.toISOString());
    const validUserId = data.userId && isUuid(data.userId) ? data.userId : null;

    const result = await pool.query(
      `INSERT INTO reports (title, description, category, severity, latitude, longitude, address, photo_url,
        is_anonymous, created_by, user_id, ai_summary, ai_severity, ai_confidence, ai_reason,
        recommended_action, upvotes, priority_score)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [
        data.title.trim(),
        data.description.trim(),
        data.category,
        data.severity,
        data.latitude,
        data.longitude,
        data.address.trim(),
        data.photo_url ?? null,
        Boolean(data.is_anonymous),
        data.is_anonymous ? 'Reported anonymously' : (data.created_by || 'Citizen'),
        validUserId,
        data.ai_summary || `${data.title} reported at ${data.address}.`,
        data.ai_severity || data.severity,
        data.ai_confidence ?? 0.88,
        data.ai_reason || 'Verified community issue submission.',
        data.recommended_action || 'Assign municipal field assessment crew.',
        upvotes,
        priorityScore,
      ],
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
    if (!isUuid(id)) return null;
    await this.ensureSchema();
    const existing = await this.getReportById(id);
    if (!existing) return null;
    await pool.query('UPDATE reports SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);
    await pool.query(
      'INSERT INTO report_history (report_id, old_status, new_status, comment, updated_by) VALUES ($1,$2,$3,$4,$5)',
      [id, existing.status, status, comment || `Status updated to ${status.replace('_', ' ').toUpperCase()}`, updatedBy || 'Authority Official'],
    );
    return this.getReportById(id);
  }

  async deleteReport(id: string): Promise<boolean> {
    if (!isUuid(id)) return false;
    await this.ensureSchema();
    const res = await pool.query('DELETE FROM reports WHERE id = $1 RETURNING id', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async addUpvote(id: string) {
    if (!isUuid(id)) return null;
    await this.ensureSchema();
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
