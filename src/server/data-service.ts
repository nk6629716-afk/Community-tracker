import type { IssueCategory, IssueSeverity, IssueStatus } from '../types';
import { citypulseDb } from './database';
import { PostgresCitypulseDatabase } from './postgres';

type ReportFilters = {
  category?: string;
  status?: string;
  severity?: string;
  search?: string;
  sort?: string;
  userId?: string;
};

const postgres = process.env.DATABASE_URL ? new PostgresCitypulseDatabase() : null;

/**
 * Uses standard managed PostgreSQL (e.g. Aiven, Render, Neon) whenever DATABASE_URL is configured.
 * The JSON store is retained solely for local demo / offline work, never as a production persistence layer.
 */
export const dataService = {
  isPersistent: Boolean(postgres),
  healthcheck: () => postgres?.healthcheck() ?? Promise.resolve(),
  createUser: (data: { email: string; passwordHash: string; name: string; role?: 'CITIZEN' | 'AUTHORITY' | 'ADMIN'; age?: number; area?: string }) =>
    postgres ? postgres.createUser(data) : Promise.resolve(citypulseDb.createUser(data)),
  findUserByEmail: (email: string) => postgres ? postgres.findUserByEmail(email) : Promise.resolve(citypulseDb.findUserByEmail(email)),
  findUserById: (id: string) => postgres ? postgres.findUserById(id) : Promise.resolve(citypulseDb.findUserById(id)),
  getAllUsers: () => postgres ? postgres.getAllUsers() : Promise.resolve(citypulseDb.getAllUsers()),
  updateUserRole: (id: string, role: 'CITIZEN' | 'AUTHORITY' | 'ADMIN') =>
    postgres ? postgres.updateUserRole(id, role) : Promise.resolve(citypulseDb.updateUserRole(id, role)),
  deleteUser: (id: string) =>
    postgres ? postgres.deleteUser(id) : Promise.resolve(citypulseDb.deleteUser(id)),
  updateUserPassword: (email: string, passwordHash: string) =>
    postgres ? postgres.updateUserPassword(email, passwordHash) : Promise.resolve(citypulseDb.updateUserPassword(email, passwordHash)),
  getAllReports: (filters?: ReportFilters) => postgres ? postgres.getAllReports(filters) : Promise.resolve(citypulseDb.getAllReports(filters)),
  getReportById: (id: string) => postgres ? postgres.getReportById(id) : Promise.resolve(citypulseDb.getReportById(id)),
  createReport: (data: {
    title: string; description: string; category: IssueCategory; severity: IssueSeverity;
    latitude: number; longitude: number; address: string; photo_url?: string;
    is_anonymous?: boolean; created_by?: string; userId?: string; ai_summary?: string;
    ai_severity?: IssueSeverity; ai_confidence?: number; ai_reason?: string; recommended_action?: string;
  }) => postgres ? postgres.createReport(data) : Promise.resolve(citypulseDb.createReport(data)),
  updateReportStatus: (id: string, status: IssueStatus, comment: string, updatedBy: string) =>
    postgres ? postgres.updateReportStatus(id, status, comment, updatedBy) : Promise.resolve(citypulseDb.updateReportStatus(id, status, comment, updatedBy)),
  addUpvote: (id: string) => postgres ? postgres.addUpvote(id) : Promise.resolve(citypulseDb.addUpvote(id)),
  getAnalytics: () => postgres ? postgres.getAnalytics() : Promise.resolve(citypulseDb.getAnalytics()),
  seedDelhiIssues: (force?: boolean) => postgres ? postgres.seedDelhiIssues(force) : Promise.resolve(citypulseDb.seedDelhi(force)),
};
