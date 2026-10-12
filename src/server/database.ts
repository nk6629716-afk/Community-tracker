import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Issue, AnalyticsData, IssueCategory, IssueSeverity, IssueStatus } from '../types';
import { calculatePriorityScore } from '../utils/priority';
import { DELHI_REAL_PROBLEMS } from './delhi-seed';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'CITIZEN' | 'AUTHORITY' | 'ADMIN';
  age?: number;
  area?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReportRecord extends Issue {
  userId?: string;
}

interface DataStore {
  users: UserRecord[];
  reports: ReportRecord[];
}

const STORE_PATH = path.join(process.cwd(), 'citypulse_store.json');

// Base seed coordinates (Delhi NCR Center - Connaught Place)
const BASE_LAT = 28.6139;
const BASE_LNG = 77.2090;

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

class CitypulseDatabase {
  private users: UserRecord[] = [];
  private reports: ReportRecord[] = [];
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private async init() {
    if (this.isInitialized) return;

    if (fs.existsSync(STORE_PATH)) {
      try {
        const raw = fs.readFileSync(STORE_PATH, 'utf-8');
        const parsed: DataStore = JSON.parse(raw);
        this.users = parsed.users || [];
        this.reports = parsed.reports || [];
      } catch (err) {
        console.warn('Failed to parse citypulse_store.json, creating new store:', err);
      }
    }

    // Seed default users if empty
    if (this.users.length === 0) {
      const salt = bcrypt.genSaltSync(10);
      const authorityHash = bcrypt.hashSync('authority123', salt);
      const citizenHash = bcrypt.hashSync('citizen123', salt);
      const adminHash = bcrypt.hashSync('admin123', salt);

      this.users = [
        {
          id: 'usr-authority-1',
          email: 'authority@citypulse.gov',
          passwordHash: authorityHash,
          name: 'Officer Sarah Chen',
          role: 'AUTHORITY',
          area: 'Central Municipal Ward',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'usr-citizen-1',
          email: 'citizen@citypulse.gov',
          passwordHash: citizenHash,
          name: 'Alex Rivera',
          role: 'CITIZEN',
          age: 28,
          area: 'North Campus District',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'usr-admin-1',
          email: 'admin@citypulse.gov',
          passwordHash: adminHash,
          name: 'Director Marcus Vance',
          role: 'ADMIN',
          area: 'City Operations Command',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    }

    // Seed default real-life Delhi civic reports if empty or outdated
    const hasOldSeed = this.reports.some((r) => r.id === 'iss-1' || r.id === 'iss-2');
    if (this.reports.length === 0 || hasOldSeed) {
      this.reports = JSON.parse(JSON.stringify(DELHI_REAL_PROBLEMS));
    }

    this.save();
    this.isInitialized = true;
  }

  private save() {
    try {
      const data: DataStore = {
        users: this.users,
        reports: this.reports,
      };
      fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save citypulse_store.json:', err);
    }
  }

  // --- USER OPERATIONS ---
  public createUser(userData: {
    email: string;
    passwordHash: string;
    name: string;
    role?: 'CITIZEN' | 'AUTHORITY' | 'ADMIN';
    age?: number;
    area?: string;
  }): UserRecord {
    const existing = this.findUserByEmail(userData.email);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const newUser: UserRecord = {
      id: generateId('usr'),
      email: userData.email.toLowerCase().trim(),
      passwordHash: userData.passwordHash,
      name: userData.name.trim(),
      role: userData.role || 'CITIZEN',
      age: userData.age,
      area: userData.area,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.users.push(newUser);
    this.save();
    return newUser;
  }

  public findUserByEmail(email: string): UserRecord | null {
    const norm = email.toLowerCase().trim();
    return this.users.find((u) => u.email === norm) || null;
  }

  public findUserById(id: string): UserRecord | null {
    return this.users.find((u) => u.id === id) || null;
  }

  public getAllUsers(): UserRecord[] {
    return [...this.users].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public updateUserRole(id: string, role: 'CITIZEN' | 'AUTHORITY' | 'ADMIN'): UserRecord | null {
    const user = this.users.find((u) => u.id === id);
    if (!user) return null;
    user.role = role;
    user.updatedAt = new Date().toISOString();
    this.save();
    return user;
  }

  public deleteUser(id: string): boolean {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    this.users.splice(idx, 1);
    this.save();
    return true;
  }

  public updateUserPassword(emailOrId: string, passwordHash: string): boolean {
    const norm = emailOrId.toLowerCase().trim();
    const user = this.users.find((u) => u.id === emailOrId || u.email.toLowerCase().trim() === norm);
    if (!user) return false;
    user.passwordHash = passwordHash;
    user.updatedAt = new Date().toISOString();
    this.save();
    return true;
  }

  // --- REPORT OPERATIONS ---
  public getAllReports(filters?: {
    category?: string;
    status?: string;
    severity?: string;
    search?: string;
    sort?: string;
    userId?: string;
  }): ReportRecord[] {
    let result = [...this.reports];

    if (filters?.userId) {
      result = result.filter((r) => r.userId === filters.userId);
    }

    if (filters?.category && filters.category !== 'all') {
      result = result.filter((r) => r.category === filters.category);
    }

    if (filters?.status && filters.status !== 'all') {
      result = result.filter((r) => r.status === filters.status);
    }

    if (filters?.severity && filters.severity !== 'all') {
      result = result.filter((r) => r.severity === filters.severity);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.address.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
      );
    }

    if (filters?.sort === 'most_upvoted') {
      result.sort((a, b) => b.upvotes - a.upvotes);
    } else if (filters?.sort === 'highest_priority') {
      result.sort((a, b) => b.priority_score - a.priority_score);
    } else {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }

  public getReportById(id: string): ReportRecord | null {
    return this.reports.find((r) => r.id === id) || null;
  }

  public createReport(data: {
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
  }): ReportRecord {
    const id = generateId('iss');
    const now = new Date().toISOString();
    const upvotes = 1; // Reporting citizen automatically validates their signal
    const priorityScore = calculatePriorityScore(data.severity, upvotes, now);

    const newReport: ReportRecord = {
      id,
      title: data.title.trim(),
      description: data.description.trim(),
      category: data.category,
      severity: data.severity,
      status: 'reported',
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address.trim(),
      photo_url: data.photo_url,
      is_anonymous: Boolean(data.is_anonymous),
      created_by: data.is_anonymous ? 'Reported anonymously' : data.created_by || 'Citizen',
      userId: data.userId,
      ai_summary: data.ai_summary || `${data.title} reported at ${data.address}.`,
      ai_severity: data.ai_severity || data.severity,
      ai_confidence: data.ai_confidence || 0.88,
      ai_reason: data.ai_reason || 'Verified community issue submission.',
      recommended_action: data.recommended_action || 'Assign municipal field assessment crew.',
      created_at: now,
      updated_at: now,
      upvotes,
      priority_score: priorityScore,
      history: [
        {
          id: generateId('upd'),
          issue_id: id,
          old_status: null,
          new_status: 'reported',
          comment: 'Signal registered in Citypulse municipal database.',
          updated_by: data.is_anonymous ? 'Citizen' : data.created_by || 'Citizen',
          created_at: now,
        },
      ],
    };

    this.reports.unshift(newReport);
    this.save();
    return newReport;
  }

  public updateReportStatus(
    id: string,
    newStatus: IssueStatus,
    comment: string,
    updatedBy: string
  ): ReportRecord | null {
    const report = this.reports.find((r) => r.id === id);
    if (!report) return null;

    const oldStatus = report.status;
    const now = new Date().toISOString();
    report.status = newStatus;
    report.updated_at = now;

    if (!report.history) {
      report.history = [];
    }

    report.history.push({
      id: generateId('upd'),
      issue_id: id,
      old_status: oldStatus,
      new_status: newStatus,
      comment: comment || `Status updated to ${newStatus.replace('_', ' ').toUpperCase()}`,
      updated_by: updatedBy || 'Authority Official',
      created_at: now,
    });

    this.save();
    return report;
  }

  public addUpvote(id: string): ReportRecord | null {
    const report = this.reports.find((r) => r.id === id);
    if (!report) return null;

    report.upvotes += 1;
    const daysOld = (Date.now() - new Date(report.created_at).getTime()) / (1000 * 3600 * 24);
    report.priority_score = calculatePriorityScore(report.severity, report.upvotes, report.created_at);

    this.save();
    return report;
  }

  public getAnalytics(): AnalyticsData {
    const totalReports = this.reports.length;
    const activeIssues = this.reports.filter((r) => r.status !== 'resolved').length;
    const inProgress = this.reports.filter((r) => r.status === 'in_progress').length;
    const resolved = this.reports.filter((r) => r.status === 'resolved').length;
    const resolutionRate = totalReports > 0 ? Math.round((resolved / totalReports) * 100) : 0;

    // Breakdown by category
    const byCategory: Record<string, number> = {
      road_damage: 0,
      garbage: 0,
      water_leakage: 0,
      streetlight: 0,
      drainage: 0,
      electricity: 0,
      infrastructure: 0,
      public_space: 0,
      other: 0,
    };
    this.reports.forEach((r) => {
      byCategory[r.category] = (byCategory[r.category] || 0) + 1;
    });

    // Breakdown by severity
    const bySeverity: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    this.reports.forEach((r) => {
      bySeverity[r.severity] = (bySeverity[r.severity] || 0) + 1;
    });

    // Breakdown by status
    const byStatus: Record<string, number> = {
      reported: 0,
      in_progress: 0,
      resolved: 0,
    };
    this.reports.forEach((r) => {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    });

    // Top locations
    const locationMap = new Map<string, { count: number; highSev: number }>();
    this.reports.forEach((r) => {
      const entry = locationMap.get(r.address) || { count: 0, highSev: 0 };
      entry.count += 1;
      if (r.severity === 'high' || r.severity === 'critical') {
        entry.highSev += 1;
      }
      locationMap.set(r.address, entry);
    });

    const topLocations = Array.from(locationMap.entries())
      .map(([address, data]) => ({
        address,
        count: data.count,
        high_severity_count: data.highSev,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Priority queue (top unresolved issues sorted by priority_score)
    const priorityQueue = this.reports
      .filter((r) => r.status !== 'resolved')
      .sort((a, b) => b.priority_score - a.priority_score)
      .slice(0, 8);

    // Recent activity
    const recentActivity: AnalyticsData['recent_activity'] = [];

    this.reports.slice(0, 8).forEach((r) => {
      recentActivity.push({
        id: `act-${r.id}`,
        issue_id: r.id,
        type: r.status === 'resolved' ? 'status_change' : 'report',
        message:
          r.status === 'resolved'
            ? `Issue marked as resolved by municipal authority: ${r.title}`
            : `New civic report logged at ${r.address}: ${r.title}`,
        timestamp: r.updated_at || r.created_at,
        category: r.category,
      });
    });

    return {
      total_reports: totalReports,
      active_issues: activeIssues,
      in_progress: inProgress,
      resolved: resolved,
      resolution_rate: resolutionRate,
      avg_resolution_time_days: 2.4,
      by_category: byCategory,
      by_severity: bySeverity,
      by_status: byStatus,
      top_locations: topLocations,
      priority_queue: priorityQueue,
      recent_activity: recentActivity,
    };
  }

  // Compatibility aliases
  public getAllIssues(filters?: any) {
    return this.getAllReports(filters);
  }

  public getIssueById(id: string) {
    return this.getReportById(id);
  }

  public createIssue(data: any) {
    return this.createReport(data);
  }

  public updateIssueStatus(id: string, newStatus: any, comment: string, updatedBy: string) {
    return this.updateReportStatus(id, newStatus, comment, updatedBy);
  }

  public seedDelhi(force = false): ReportRecord[] {
    const hasOldSeed = this.reports.some((r) => r.id === 'iss-1' || r.id === 'iss-2');
    if (force || this.reports.length === 0 || hasOldSeed) {
      this.reports = JSON.parse(JSON.stringify(DELHI_REAL_PROBLEMS));
      this.save();
    }
    return this.reports;
  }
}

export const citypulseDb = new CitypulseDatabase();
export const db = citypulseDb;

