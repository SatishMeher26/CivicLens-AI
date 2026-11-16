export type UserRole = 'citizen' | 'operator' | 'reviewer' | 'admin';

export type IssueCategory =
  | 'roads_infrastructure'
  | 'drainage_flooding'
  | 'solid_waste'
  | 'streetlighting'
  | 'water_supply'
  | 'public_parks'
  | 'traffic_signals'
  | 'other';

export type IssueStatus =
  | 'submitted'
  | 'under_review'
  | 'assigned'
  | 'in_progress'
  | 'awaiting_verification'
  | 'resolved'
  | 'reopened'
  | 'rejected';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface IssueLocation {
  address: string;
  locality: string;
  ward: string;
  latitude: number;
  longitude: number;
  landmark?: string;
}

export interface EvidenceAttachment {
  id: string;
  evidence_type: 'original' | 'resolution' | 'inspection';
  file_url: string;
  description?: string;
  uploaded_by: string;
  uploaded_at: string;
  confidence_score?: number;
  verification_notes?: string;
}

export interface StatusHistory {
  id: string;
  from_status?: IssueStatus;
  to_status: IssueStatus;
  changed_by: string;
  role: UserRole;
  timestamp: string;
  reason?: string;
}

export interface PriorityFactor {
  factor_name: string;
  weight: number;
  raw_value: number;
  contribution_score: number;
  explanation: string;
}

export interface PriorityAssessment {
  raw_score: number;
  priority_level: PriorityLevel;
  factors: PriorityFactor[];
  calculated_at: string;
  sla_deadline_hours: number;
  overdue: boolean;
}

export interface DuplicateCandidate {
  candidate_id: string;
  matched_issue_id: string;
  matched_issue_title: string;
  text_similarity: number;
  distance_meters: number;
  category_match: boolean;
  overall_confidence: number;
  reason: string;
  status: 'pending' | 'confirmed' | 'dismissed';
}

export interface CivicReport {
  id: string;
  tracking_code: string;
  title: string;
  description: string;
  category: IssueCategory;
  ai_suggested_category?: IssueCategory;
  location: IssueLocation;
  reported_by_name: string;
  reported_by_contact?: string;
  submitted_at: string;
  images: string[];
  upvotes: number;
  linked_issue_id?: string;
}

export interface CivicIssue {
  id: string;
  issue_code: string;
  title: string;
  description: string;
  category: IssueCategory;
  category_human_verified: boolean;
  status: IssueStatus;
  priority: PriorityAssessment;
  location: IssueLocation;
  assigned_department_id?: string;
  assigned_department_name?: string;
  assigned_officer?: string;
  created_at: string;
  updated_at: string;
  sla_deadline?: string;
  reports_count: number;
  linked_report_ids: string[];
  status_history: StatusHistory[];
  evidence: EvidenceAttachment[];
  community_confirmations: number;
  duplicate_candidates: DuplicateCandidate[];
  is_recurring: boolean;
  recurrence_count: number;
  recurrence_notes?: string;
  citizen_feedback_rating?: number;
  citizen_feedback_comment?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  categories_handled: IssueCategory[];
  contact_email: string;
  phone: string;
  active_crew_count: number;
  sla_hours_default: number;
}

export interface AnalyticsSummary {
  metrics: {
    total_issues: number;
    open_issues: number;
    resolved_issues: number;
    awaiting_verification: number;
    critical_issues: number;
    high_priority_issues: number;
    overdue_issues: number;
    recurring_issues: number;
    top_locality: string;
    top_category: string;
  };
  distributions: {
    by_category: { name: string; value: number; key: string }[];
    by_status: { name: string; value: number; key: string }[];
    by_priority: { name: string; value: number; key: string }[];
    by_ward: { name: string; value: number }[];
    by_department: { name: string; value: number }[];
  };
  executive_digest: string;
}

export interface RecurrenceData {
  hotspot_count: number;
  hotspots: {
    cluster_id: string;
    locality: string;
    ward: string;
    category: string;
    incident_count: number;
    center_lat: number;
    center_lng: number;
    issue_codes: string[];
    recommendation: string;
  }[];
  recurring_issues: {
    id: string;
    issue_code: string;
    title: string;
    category: string;
    locality: string;
    ward: string;
    recurrence_count: number;
    status: string;
    notes: string;
  }[];
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  mobile?: string;
  role: UserRole;
  status: 'active' | 'invited' | 'deactivated' | 'locked';
  employee_id?: string;
  department_id?: string;
  department_name?: string;
  jurisdiction_ward?: string;
  designation?: string;
  locality?: string;
  permissions: string[];
  created_at: string;
  last_login_at?: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
  message: string;
}

export interface DemoAccount {
  role: UserRole;
  label: string;
  identifier: string;
  password: string;
  name: string;
  description: string;
}

export interface AuditRecord {
  id: string;
  entity_name: string;
  entity_id: string;
  action: string;
  actor: string;
  actor_role: UserRole;
  timestamp: string;
  metadata: Record<string, any>;
}
