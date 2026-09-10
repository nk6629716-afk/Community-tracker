import { Issue, AnalyticsData, IssueCategory, IssueSeverity, IssueStatus, AIAnalysis } from '../types';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'CITIZEN' | 'AUTHORITY' | 'ADMIN';
  age?: number;
  area?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  message?: string;
}

// Token management
const TOKEN_KEY = 'citypulse_auth_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

// Device-level client ID for voting
export function getDeviceId(): string {
  let id = localStorage.getItem('citypulse_device_id');
  if (!id) {
    id = `usr_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
    localStorage.setItem('citypulse_device_id', id);
  }
  return id;
}

export function getVotedIssues(): string[] {
  try {
    const raw = localStorage.getItem('citypulse_voted_issues');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markIssueAsVoted(issueId: string): void {
  try {
    const votes = getVotedIssues();
    if (!votes.includes(issueId)) {
      votes.push(issueId);
      localStorage.setItem('citypulse_voted_issues', JSON.stringify(votes));
    }
  } catch (e) {
    console.error('Failed to store voted issue locally:', e);
  }
}

const RAW_API_URL = (import.meta as any).env?.VITE_API_URL || '';
export const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');

export function apiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
}

function getHeaders(customHeaders?: Record<string, string>): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth endpoints
  async signup(payload: {
    email: string;
    password: string;
    name: string;
    role?: 'CITIZEN' | 'AUTHORITY' | 'ADMIN';
    officerCode?: string;
    age?: number;
    area?: string;
  }): Promise<AuthResponse> {
    const res = await fetch(apiUrl('/api/auth/signup'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    setAuthToken(data.token);
    return data;
  },

  async login(payload: {
    email: string;
    password: string;
    targetRole: 'CITIZEN' | 'AUTHORITY';
  }): Promise<AuthResponse> {
    const res = await fetch(apiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Authentication failed');
    }
    setAuthToken(data.token);
    return data;
  },

  async getMe(): Promise<AuthUser | null> {
    const token = getAuthToken();
    if (!token) return null;

    try {
      const res = await fetch(apiUrl('/api/auth/me'), {
        headers: getHeaders(),
      });
      if (!res.ok) {
        setAuthToken(null);
        return null;
      }
      const data = await res.json();
      return data.user;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await fetch(apiUrl('/api/auth/logout'), { method: 'POST', headers: getHeaders() });
    } finally {
      setAuthToken(null);
    }
  },

  // Master Admin & User Management endpoints
  async getUsers(): Promise<AuthUser[]> {
    const res = await fetch(apiUrl('/api/admin/users'), { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch user directory');
    return res.json();
  },

  async createOfficer(payload: {
    name: string;
    email: string;
    password: string;
    department?: string;
    area?: string;
    age?: number;
  }): Promise<{ message: string; user: AuthUser }> {
    const res = await fetch(apiUrl('/api/admin/officers'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to register municipal officer');
    return data;
  },

  async updateUserRole(userId: string, role: 'CITIZEN' | 'AUTHORITY' | 'ADMIN'): Promise<void> {
    const res = await fetch(apiUrl(`/api/admin/users/${userId}/role`), {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ role }),
    });
    if (!res.ok) throw new Error('Failed to update role');
  },

  async deleteUser(userId: string): Promise<void> {
    const res = await fetch(apiUrl(`/api/admin/users/${userId}`), {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to remove user');
  },

  async generateResetCode(identifier: string): Promise<{
    message: string;
    code: string;
    email: string;
    userName: string;
    expiresAt: string;
    instructions: string;
  }> {
    const res = await fetch(apiUrl('/api/admin/reset-code/generate'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ identifier }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate developer verification code');
    return data;
  },

  async getResetCodes(): Promise<Array<{
    code: string;
    email: string;
    userName?: string;
    expiresAt: number;
    generatedBy: string;
  }>> {
    const res = await fetch(apiUrl('/api/admin/reset-codes'), {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch active verification codes');
    return res.json();
  },

  async resetPassword(payload: {
    email: string;
    code: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    const res = await fetch(apiUrl('/api/auth/reset-password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Password reset failed');
    return data;
  },

  async broadcastEmergency(
    message: string, 
    severity: 'high' | 'critical' = 'high',
    dispatchCode?: string
  ): Promise<{ message: string; alert: any }> {
    const res = await fetch(apiUrl('/api/admin/broadcast'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message, severity, dispatchCode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to dispatch broadcast');
    return data;
  },

  async generateDispatchCode(assignedEmail: string, note?: string): Promise<{
    message: string;
    code: string;
    assignedToEmail: string;
    assignedToName?: string;
    expiresAt: string;
    expiresInSeconds: number;
    generatedBy: string;
  }> {
    const res = await fetch(apiUrl('/api/admin/dispatch-code/generate'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ assignedEmail, note }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate dispatch authorization code');
    return data;
  },

  async getDispatchCodes(): Promise<Array<{
    code: string;
    assignedToEmail: string;
    assignedToName?: string;
    generatedBy: string;
    generatedByUserId?: string;
    createdAt: number;
    expiresAt: number;
    note?: string;
    usedCount: number;
  }>> {
    const res = await fetch(apiUrl('/api/admin/dispatch-codes'), {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch active dispatch codes');
    return res.json();
  },

  async revokeDispatchCode(code: string): Promise<void> {
    const res = await fetch(apiUrl(`/api/admin/dispatch-codes/${encodeURIComponent(code)}`), {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to revoke authorization code');
    }
  },

  // Reports endpoints
  async getIssues(params?: {
    search?: string;
    category?: string;
    status?: string;
    severity?: string;
    sort?: string;
    userId?: string;
  }): Promise<Issue[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.category) query.append('category', params.category);
    if (params?.status) query.append('status', params.status);
    if (params?.severity) query.append('severity', params.severity);
    if (params?.sort) query.append('sort', params.sort);
    if (params?.userId) query.append('userId', params.userId);

    const res = await fetch(apiUrl(`/api/reports?${query.toString()}`), {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch reports');
    return res.json();
  },

  async getIssue(id: string): Promise<Issue> {
    const res = await fetch(apiUrl(`/api/reports/${id}`), {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch report details');
    return res.json();
  },

  async createIssue(payload: {
    title: string;
    description: string;
    category: IssueCategory;
    severity?: IssueSeverity;
    latitude: number;
    longitude: number;
    address: string;
    photo_url?: string;
    is_anonymous: boolean;
    created_by?: string;
    ai_summary?: string;
    ai_severity?: IssueSeverity;
    ai_confidence?: number;
    ai_reason?: string;
    recommended_action?: string;
  }): Promise<Issue> {
    const res = await fetch(apiUrl('/api/reports'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create report' }));
      throw new Error(err.error || 'Failed to create report');
    }
    return res.json();
  },

  async analyzePreview(payload: {
    title: string;
    description: string;
    category?: string;
    location?: string;
    photo?: string;
  }): Promise<AIAnalysis> {
    const res = await fetch(apiUrl('/api/ai/analyze'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error('AI analysis preview failed');
    }
    return res.json();
  },

  async updateStatus(
    id: string,
    status: IssueStatus,
    comment?: string,
    updatedBy?: string
  ): Promise<{ issue: Issue }> {
    const res = await fetch(apiUrl(`/api/reports/${id}/status`), {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status, comment, updated_by: updatedBy }),
    });
    if (!res.ok) throw new Error('Failed to update report status');
    return res.json();
  },

  async voteIssue(id: string): Promise<{ success: boolean; issue?: Issue; message?: string }> {
    const res = await fetch(apiUrl(`/api/reports/${id}/upvote`), {
      method: 'POST',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (res.ok) {
      markIssueAsVoted(id);
      return { success: true, issue: data.report || data.issue };
    }
    return { success: false, message: data.error };
  },

  async getAnalytics(): Promise<AnalyticsData> {
    const res = await fetch(apiUrl('/api/analytics'), {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },
};
