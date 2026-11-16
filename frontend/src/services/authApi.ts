import { UserProfile, AuthTokenResponse, DemoAccount, UserRole } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const authStorage = {
  getToken: () => localStorage.getItem('civiclens_auth_token'),
  setToken: (token: string) => localStorage.setItem('civiclens_auth_token', token),
  clearToken: () => localStorage.removeItem('civiclens_auth_token'),
  getUser: (): UserProfile | null => {
    const raw = localStorage.getItem('civiclens_auth_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  setUser: (user: UserProfile) => localStorage.setItem('civiclens_auth_user', JSON.stringify(user)),
  clearUser: () => localStorage.removeItem('civiclens_auth_user')
};

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    authStorage.clearToken();
    authStorage.clearUser();
  }
  return res;
}

export const authApi = {
  async login(payload: {
    identifier: string;
    password: string;
    role?: UserRole;
    otp_code?: string;
    mfa_code?: string;
  }): Promise<AuthTokenResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Authentication failed' }));
      throw new Error(err.detail || 'Login failed');
    }
    const data: AuthTokenResponse = await res.json();
    authStorage.setToken(data.access_token);
    authStorage.setUser(data.user);
    return data;
  },

  async registerCitizen(payload: {
    name: string;
    mobile: string;
    email?: string;
    password: string;
    locality: string;
    consent_terms?: boolean;
  }): Promise<AuthTokenResponse> {
    const res = await fetch(`${API_BASE}/auth/register-citizen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(err.detail || 'Registration failed');
    }
    const data: AuthTokenResponse = await res.json();
    authStorage.setToken(data.access_token);
    authStorage.setUser(data.user);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await fetchWithAuth(`${API_BASE}/auth/logout`, { method: 'POST' });
    } finally {
      authStorage.clearToken();
      authStorage.clearUser();
    }
  },

  async getMe(): Promise<UserProfile> {
    const res = await fetchWithAuth(`${API_BASE}/auth/me`);
    if (!res.ok) {
      throw new Error('Failed to retrieve user session');
    }
    const user: UserProfile = await res.json();
    authStorage.setUser(user);
    return user;
  },

  async getDemoAccounts(): Promise<DemoAccount[]> {
    const res = await fetch(`${API_BASE}/auth/demo-accounts`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.accounts || [];
  },

  async getAuthorityUsers(): Promise<UserProfile[]> {
    const res = await fetchWithAuth(`${API_BASE}/auth/authority-users`);
    if (!res.ok) throw new Error('Failed to load authority users');
    return res.json();
  },

  async inviteOfficial(payload: {
    email: string;
    name: string;
    role: UserRole;
    employee_id: string;
    department_id?: string;
    department_name?: string;
    jurisdiction_ward?: string;
    designation: string;
  }): Promise<{ status: string; message: string; activation_url: string }> {
    const res = await fetchWithAuth(`${API_BASE}/auth/invite`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Invitation failed' }));
      throw new Error(err.detail || 'Invitation failed');
    }
    return res.json();
  },

  async setUserStatus(userId: string, newStatus: string): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE}/auth/users/${userId}/status?new_status=${newStatus}`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Status update failed' }));
      throw new Error(err.detail || 'Status update failed');
    }
  },

  async adminResetPassword(userId: string, newPassword: string): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE}/auth/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ new_password: newPassword })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Password reset failed' }));
      throw new Error(err.detail || 'Password reset failed');
    }
  }
};
