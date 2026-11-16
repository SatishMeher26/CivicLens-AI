import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, UserProfile } from '../services/types';
import { authApi, authStorage } from '../services/authApi';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  userName: string;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (payload: { identifier: string; password: string; role?: UserRole; mfa_code?: string }) => Promise<UserProfile>;
  registerCitizen: (payload: { name: string; mobile: string; email?: string; password: string; locality: string; consent_terms?: boolean }) => Promise<UserProfile>;
  logout: () => Promise<void>;
  quickLoginDemo: (targetRole: UserRole) => Promise<UserProfile>;
  hasPermission: (perm: string) => boolean;
  roleDescriptions: Record<UserRole, string>;
  setRole: (role: UserRole) => void;
}

const roleDescriptions: Record<UserRole, string> = {
  citizen: 'Citizen Portal (Report, Track, Upvote & Review Grievances)',
  operator: 'Municipal Operator (Triage, Route, Dispatch & Department Works)',
  reviewer: 'Quality Reviewer (Inspect Evidence, Audit & Verify Resolution Proof)',
  admin: 'Civic Administrator (City Overview, SLA, Account Provisioning & Audit)'
};

const defaultNames: Record<UserRole, string> = {
  citizen: 'Concerned Citizen',
  operator: 'Dispatcher R. Verma (Control Room)',
  reviewer: 'Auditor S. Menon (Quality Cell)',
  admin: 'Commissioner V. Shinde (IAS)'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(authStorage.getUser());
  const [token, setToken] = useState<string | null>(authStorage.getToken());
  const [loading, setLoading] = useState<boolean>(true);

  // Sync session on mount
  useEffect(() => {
    const savedToken = authStorage.getToken();
    if (savedToken) {
      authApi.getMe()
        .then((profile) => {
          setUser(profile);
          setToken(savedToken);
        })
        .catch(() => {
          authStorage.clearToken();
          authStorage.clearUser();
          setUser(null);
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (payload: { identifier: string; password: string; role?: UserRole; mfa_code?: string }): Promise<UserProfile> => {
    const res = await authApi.login(payload);
    setUser(res.user);
    setToken(res.access_token);
    return res.user;
  };

  const registerCitizen = async (payload: { name: string; mobile: string; email?: string; password: string; locality: string; consent_terms?: boolean }): Promise<UserProfile> => {
    const res = await authApi.registerCitizen(payload);
    setUser(res.user);
    setToken(res.access_token);
    return res.user;
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    setToken(null);
  };

  const quickLoginDemo = async (targetRole: UserRole): Promise<UserProfile> => {
    const roleCredentials: Record<UserRole, { identifier: string; password: string }> = {
      citizen: { identifier: '9876543210', password: 'CitizenDemo@123' },
      operator: { identifier: 'PMC-OP-2041', password: 'OperatorDemo@123' },
      reviewer: { identifier: 'PCMC-QR-5012', password: 'ReviewerDemo@123' },
      admin: { identifier: 'PMC-ADM-001', password: 'AdminDemo@123' }
    };

    const creds = roleCredentials[targetRole];
    return await login({
      identifier: creds.identifier,
      password: creds.password,
      role: targetRole,
      mfa_code: targetRole === 'admin' ? '123456' : undefined
    });
  };

  const hasPermission = (perm: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(perm);
  };

  const currentRole: UserRole = user?.role || 'citizen';
  const currentName: string = user?.name || defaultNames[currentRole];

  return (
    <AuthContext.Provider value={{
      user,
      role: currentRole,
      userName: currentName,
      token,
      isAuthenticated: Boolean(user && token),
      loading,
      login,
      registerCitizen,
      logout,
      quickLoginDemo,
      hasPermission,
      roleDescriptions,
      setRole: (r: UserRole) => {
        // Safe demo fallback if someone manually switches
        quickLoginDemo(r).catch(console.error);
      }
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
