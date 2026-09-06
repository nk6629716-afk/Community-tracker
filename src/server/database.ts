import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Issue, AnalyticsData, IssueCategory, IssueSeverity, IssueStatus } from '../types';
import { calculatePriorityScore } from '../utils/priority';

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

// Base seed coordinates
const BASE_LAT = 37.7749;
const BASE_LNG = -122.4194;

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

    // Seed default reports if empty
    if (this.reports.length === 0) {
      this.reports = [
        {
          id: 'iss-1',
          title: 'Large pothole near College Gate',
          description: 'There is a large, deep pothole near the college main entrance that is causing severe hazard for two-wheelers and cyclists during rush hour.',
          category: 'road_damage',
          severity: 'high',
          ai_summary: 'Large pothole reported near College Gate creating a potential safety hazard for two-wheelers.',
          ai_severity: 'high',
          ai_confidence: 0.94,
          ai_reason: 'The report describes a significant road defect located in a high-traffic pedestrian and student vehicular corridor.',
          recommended_action: 'Dispatch road maintenance crew to inspect sub-base, mill edges, and apply hot-mix asphalt patch.',
          latitude: BASE_LAT + 0.0035,
          longitude: BASE_LNG - 0.0042,
          address: 'College Gate & University Ave',
          photo_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
          status: 'in_progress',
          is_anonymous: false,
          created_by: 'Rahul S. (Student Council)',
          created_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
          upvotes: 83,
          priority_score: 91,
          history: [
            {
              id: 'upd-1a',
              issue_id: 'iss-1',
              old_status: null,
              new_status: 'reported',
              comment: 'Issue reported by Rahul S. with verified photographic evidence.',
              updated_by: 'System',
              created_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
            },
            {
              id: 'upd-1b',
              issue_id: 'iss-1',
              old_status: 'reported',
              new_status: 'in_progress',
              comment: 'Public Works Dept scheduled quick-fill asphalt unit for immediate remediation.',
              updated_by: 'Officer Sarah Chen',
              created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
            },
          ],
        },
        {
          id: 'iss-2',
          title: 'Water leakage near Block C',
          description: 'High pressure municipal water pipe leaking onto the main walkway near Block C. Water has been continuously gushing for over 6 hours.',
          category: 'water_leakage',
          severity: 'critical',
          ai_summary: 'Severe pressurized water main rupture causing walkway flooding and resource wastage near Block C.',
          ai_severity: 'critical',
          ai_confidence: 0.96,
          ai_reason: 'Active pressurized leak causing flooding in pedestrian zone, posing foundation erosion risk.',
          recommended_action: 'Isolate valve sector 4B immediately and dispatch emergency water utility team.',
          latitude: BASE_LAT - 0.0048,
          longitude: BASE_LNG + 0.0031,
          address: 'Block C Walkway, North Sector',
          photo_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80',
          status: 'reported',
          is_anonymous: true,
          created_by: 'Reported anonymously',
          created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
          upvotes: 59,
          priority_score: 86,
          history: [
            {
              id: 'upd-2a',
              issue_id: 'iss-2',
              old_status: null,
              new_status: 'reported',
              comment: 'Anonymous report submitted with GPS validation.',
              updated_by: 'Citizen',
              created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
            },
          ],
        },
        {
          id: 'iss-3',
          title: 'Garbage accumulation at Central Market',
          description: 'Waste bins overflowing across market alleyway. Stagnant organic waste attracting pests and causing foul odor in shopping district.',
          category: 'garbage',
          severity: 'high',
          ai_summary: 'Excessive municipal waste accumulation with sanitation hazard at Central Market.',
          ai_severity: 'high',
          ai_confidence: 0.92,
          ai_reason: 'Severe sanitation risk in food market zone with rodent/pest threat.',
          recommended_action: 'Deploy solid waste compactor truck and sanitize collection station bins.',
          latitude: BASE_LAT + 0.0062,
          longitude: BASE_LNG + 0.0054,
          address: 'Central Market Lane 3',
          photo_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
          status: 'reported',
          is_anonymous: false,
          created_by: 'Alex Rivera',
          userId: 'usr-citizen-1',
          created_at: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
          upvotes: 71,
          priority_score: 81,
          history: [
            {
              id: 'upd-3a',
              issue_id: 'iss-3',
              old_status: null,
              new_status: 'reported',
              comment: 'Citizen report flagged for urgent sanitation pickup.',
              updated_by: 'System',
              created_at: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
            },
          ],
        },
        {
          id: 'iss-4',
          title: 'Broken streetlight on Park Road',
          description: 'Streetlight pole #42 is unlit for three consecutive nights, creating a dark stretch along the student pedestrian path.',
          category: 'streetlight',
          severity: 'medium',
          ai_summary: 'Inoperative streetlight pole along pedestrian route reducing night-time visibility and security.',
          ai_severity: 'medium',
          ai_confidence: 0.89,
          ai_reason: 'Pedestrian safety and visibility concern along well-trafficked night path.',
          recommended_action: 'Inspect circuit breaker and replace 120W LED fixture.',
          latitude: BASE_LAT - 0.0021,
          longitude: BASE_LNG - 0.0065,
          address: 'Park Road, opposite Community Garden',
          photo_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
          status: 'resolved',
          is_anonymous: false,
          created_by: 'Alex Rivera',
          userId: 'usr-citizen-1',
          created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
          upvotes: 34,
          priority_score: 54,
          history: [
            {
              id: 'upd-4a',
              issue_id: 'iss-4',
              old_status: null,
              new_status: 'reported',
              comment: 'Initial report logged.',
              updated_by: 'Citizen',
              created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
            },
            {
              id: 'upd-4b',
              issue_id: 'iss-4',
              old_status: 'reported',
              new_status: 'in_progress',
              comment: 'Electrical maintenance dispatched.',
              updated_by: 'Officer Sarah Chen',
              created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
            },
            {
              id: 'upd-4c',
              issue_id: 'iss-4',
              old_status: 'in_progress',
              new_status: 'resolved',
              comment: 'LED fixture replaced and circuit continuity verified.',
              updated_by: 'Officer Sarah Chen',
              created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
            },
          ],
        },
      ];
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
}

export const citypulseDb = new CitypulseDatabase();
export const db = citypulseDb;

