import {
  CivicIssue, CivicReport, Department, AnalyticsSummary,
  RecurrenceData, IssueCategory, IssueStatus, PriorityLevel, UserRole
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

export const api = {
  // 1. Health
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  // 2. Reports
  async submitReport(payload: {
    title: string;
    description: string;
    category?: IssueCategory;
    address: string;
    locality: string;
    ward: string;
    latitude: number;
    longitude: number;
    landmark?: string;
    reported_by_name: string;
    reported_by_contact?: string;
    images?: string[];
  }) {
    const res = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to submit report');
    }
    return res.json();
  },

  async getReports() {
    const res = await fetch(`${API_BASE}/reports`);
    if (!res.ok) throw new Error('Failed to fetch reports');
    return res.json() as Promise<CivicReport[]>;
  },

  async getReport(identifier: string) {
    const res = await fetch(`${API_BASE}/reports/${identifier}`);
    if (!res.ok) throw new Error('Report not found');
    return res.json() as Promise<CivicReport>;
  },

  // 3. Issues
  async getIssues(params?: {
    category?: string;
    status?: string;
    priority?: string;
    ward?: string;
    locality?: string;
    is_recurring?: boolean;
    search?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.status) query.set('status', params.status);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.ward) query.set('ward', params.ward);
    if (params?.locality) query.set('locality', params.locality);
    if (params?.is_recurring !== undefined) query.set('is_recurring', String(params.is_recurring));
    if (params?.search) query.set('search', params.search);

    const res = await fetch(`${API_BASE}/issues?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch issues');
    return res.json() as Promise<CivicIssue[]>;
  },

  async getIssue(identifier: string) {
    const res = await fetch(`${API_BASE}/issues/${identifier}`);
    if (!res.ok) throw new Error('Issue not found');
    return res.json() as Promise<CivicIssue>;
  },

  async updateStatus(issueId: string, payload: {
    to_status: IssueStatus;
    reason: string;
    changed_by: string;
    role: UserRole;
  }) {
    const res = await fetch(`${API_BASE}/issues/${issueId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update status');
    }
    return res.json() as Promise<CivicIssue>;
  },

  async assignIssue(issueId: string, payload: {
    department_id: string;
    assigned_officer?: string;
    notes?: string;
    changed_by: string;
    role: UserRole;
  }) {
    const res = await fetch(`${API_BASE}/issues/${issueId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to assign issue');
    }
    return res.json() as Promise<CivicIssue>;
  },

  async submitEvidence(issueId: string, payload: {
    evidence_type: 'original' | 'resolution';
    file_url: string;
    description?: string;
    uploaded_by: string;
  }) {
    const res = await fetch(`${API_BASE}/issues/${issueId}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to upload evidence');
    }
    return res.json() as Promise<CivicIssue>;
  },

  async verifyIssue(issueId: string, payload: {
    approved: boolean;
    notes: string;
    reviewer_name: string;
  }) {
    const res = await fetch(`${API_BASE}/issues/${issueId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to verify issue');
    }
    return res.json() as Promise<CivicIssue>;
  },

  async confirmIssue(issueId: string, userId: string = 'anon-citizen') {
    const res = await fetch(`${API_BASE}/issues/${issueId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
    if (!res.ok) throw new Error('Failed to confirm issue');
    return res.json();
  },

  async submitFeedback(issueId: string, payload: {
    rating: number;
    comment?: string;
    citizen_name?: string;
  }) {
    const res = await fetch(`${API_BASE}/issues/${issueId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to submit feedback');
    }
    return res.json() as Promise<CivicIssue>;
  },

  // 4. AI
  async classifyText(title: string, description: string, locality?: string) {
    const res = await fetch(`${API_BASE}/ai/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, locality }),
    });
    if (!res.ok) throw new Error('AI classification failed');
    return res.json();
  },

  async checkDuplicates(payload: {
    title: string;
    description: string;
    category: IssueCategory;
    latitude: number;
    longitude: number;
  }) {
    const res = await fetch(`${API_BASE}/ai/duplicates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Duplicate check failed');
    return res.json();
  },

  async explainPriority(issueId: string) {
    const res = await fetch(`${API_BASE}/ai/explain-priority/${issueId}`);
    if (!res.ok) throw new Error('Failed to explain priority');
    return res.json();
  },

  async summarizeIssue(issueId: string, summaryType: 'executive' | 'citizen_friendly' | 'operational' = 'executive') {
    const res = await fetch(`${API_BASE}/ai/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issue_id: issueId, summary_type: summaryType }),
    });
    if (!res.ok) throw new Error('AI summarization failed');
    return res.json();
  },

  // 5. GIS & Map
  async getMapIssues(params?: {
    category?: string;
    status?: string;
    priority?: string;
    ward?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.status) query.set('status', params.status);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.ward) query.set('ward', params.ward);

    const res = await fetch(`${API_BASE}/map/issues?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch map data');
    return res.json();
  },

  async getHeatmapPoints(category?: string, priority?: string) {
    const query = new URLSearchParams();
    if (category) query.set('category', category);
    if (priority) query.set('priority', priority);

    const res = await fetch(`${API_BASE}/map/heatmap?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch heatmap points');
    return res.json();
  },

  // 6. Analytics & Departments
  async getAnalyticsSummary() {
    const res = await fetch(`${API_BASE}/analytics/summary`);
    if (!res.ok) throw new Error('Failed to fetch analytics summary');
    return res.json() as Promise<AnalyticsSummary>;
  },

  async getRecurringAnalysis() {
    const res = await fetch(`${API_BASE}/analytics/recurring`);
    if (!res.ok) throw new Error('Failed to fetch recurring analysis');
    return res.json() as Promise<RecurrenceData>;
  },

  async getDepartments() {
    const res = await fetch(`${API_BASE}/departments`);
    if (!res.ok) throw new Error('Failed to fetch departments');
    return res.json() as Promise<Department[]>;
  }
};
