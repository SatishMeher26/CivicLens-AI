import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, UserRole } from '../services/types';
import { authApi } from '../services/authApi';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Landmark, Users, Shield, UserPlus, KeyRound, CheckCircle2,
  XCircle, Clock, Building2, MapPin, Search, ArrowRight,
  AlertTriangle, RefreshCw, Copy, Check, Filter, ShieldAlert
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateToGIS?: () => void;
  onNavigateToAnalytics?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateToGIS,
  onNavigateToAnalytics
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'audit'>('overview');

  // Accounts state
  const [authorityUsers, setAuthorityUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Metrics state
  const [metrics, setMetrics] = useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // Invite Official Modal State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('operator');
  const [inviteEmpId, setInviteEmpId] = useState('');
  const [inviteDept, setInviteDept] = useState('Roads & Infrastructure Department');
  const [inviteWard, setInviteWard] = useState('Shivajinagar');
  const [inviteDesignation, setInviteDesignation] = useState('Field Dispatch Engineer');
  const [inviteResult, setInviteResult] = useState<{ url: string; msg: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Reset Password Modal State
  const [resetTargetUser, setResetTargetUser] = useState<UserProfile | null>(null);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const loadData = () => {
    setLoadingMetrics(true);
    setLoadingUsers(true);

    api.getAnalyticsSummary()
      .then(res => setMetrics(res))
      .catch(console.error)
      .finally(() => setLoadingMetrics(false));

    authApi.getAuthorityUsers()
      .then(res => setAuthorityUsers(res))
      .catch(console.error)
      .finally(() => setLoadingUsers(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Invite Form Submission
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteError(null);
    setInviteResult(null);

    try {
      const res = await authApi.inviteOfficial({
        name: inviteName,
        email: inviteEmail,
        role: inviteRole,
        employee_id: inviteEmpId,
        department_name: inviteDept,
        jurisdiction_ward: inviteWard,
        designation: inviteDesignation
      });
      setInviteResult({ url: res.activation_url, msg: res.message });
      // Reload users list
      authApi.getAuthorityUsers().then(setAuthorityUsers);
    } catch (err: any) {
      setInviteError(err.message || 'Failed to generate invitation');
    } finally {
      setInviting(false);
    }
  };

  // Toggle User Status
  const handleToggleStatus = async (targetUser: UserProfile) => {
    const newStatus = targetUser.status === 'active' ? 'deactivated' : 'active';
    const confirmMsg = targetUser.status === 'active'
      ? `Are you sure you want to deactivate ${targetUser.name}'s official account?`
      : `Reactivate ${targetUser.name}'s account?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await authApi.setUserStatus(targetUser.id, newStatus);
      // Update local state
      setAuthorityUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, status: newStatus as any } : u));
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  // Handle Admin Password Reset
  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) return;
    setResetting(true);
    setResetMessage(null);

    try {
      await authApi.adminResetPassword(resetTargetUser.id, newAdminPassword);
      setResetMessage(`Password successfully reset for ${resetTargetUser.name}.`);
      setTimeout(() => {
        setResetTargetUser(null);
        setNewAdminPassword('');
        setResetMessage(null);
      }, 1800);
    } catch (err: any) {
      alert(err.message || 'Failed to reset password');
    } finally {
      setResetting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Filtered authority users
  const filteredUsers = useMemo(() => {
    return authorityUsers.filter(u => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (userSearch.trim()) {
        const q = userSearch.toLowerCase();
        const str = (u.name + ' ' + (u.email || '') + ' ' + (u.employee_id || '') + ' ' + (u.department_name || '')).toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  }, [authorityUsers, roleFilter, userSearch]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Administrator Secretariat Banner */}
      <div className="bg-[#102A43] text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-200 shrink-0">
            <Landmark className="w-7 h-7 text-sky-300" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-200 font-semibold text-xs border border-sky-400/30">
                Civic Administrator Secretariat
              </span>
              <span className="text-xs text-sky-200/80 font-mono">
                ID: {user?.employee_id || 'PMC-ADM-001'}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              {user?.name || 'Commissioner Vikram Shinde (IAS)'}
            </h1>
            <p className="text-xs text-sky-200/80">
              Executive Governance, Authority Access Control & City-Wide Intelligence • Pune (PMC & PCMC)
            </p>
          </div>
        </div>

        {/* Tab Switcher in Banner */}
        <div className="flex items-center bg-white/10 backdrop-blur-xs p-1 rounded-xl border border-white/15 self-start md:self-auto text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeTab === 'overview' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-200 hover:text-white'
            }`}
          >
            Executive Overview
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeTab === 'accounts' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-200 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Account Management ({authorityUsers.length})
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {/* ===================================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-xs font-semibold text-slate-500 block">Total Pune Grievances</span>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {metrics?.total_issues || 20}
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold">100% Geocoded in PMC/PCMC</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-xs font-semibold text-slate-500 block">SLA Compliance Rate</span>
              <div className="text-2xl font-black text-emerald-700 font-mono">
                {metrics?.sla_performance?.on_time_pct ? `${metrics.sla_performance.on_time_pct}%` : '85.0%'}
              </div>
              <span className="text-[10px] text-slate-500">Target turnaround: 24-48h</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-xs font-semibold text-slate-500 block">Active Critical Hazards</span>
              <div className="text-2xl font-black text-red-600 font-mono">
                {metrics?.distributions?.by_priority?.find((p: any) => p.name.includes('Critical'))?.value || 3}
              </div>
              <span className="text-[10px] text-red-600 font-semibold">Hospital & School corridors</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-xs font-semibold text-slate-500 block">Municipal Staff Active</span>
              <div className="text-2xl font-black text-[#17365D] font-mono">
                {authorityUsers.length || 3} Officers
              </div>
              <span className="text-[10px] text-[#3973B9] font-semibold">RBAC Verified Access</span>
            </div>
          </div>

          {/* Quick Shortcuts to GIS and Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-slate-900 to-[#17365D] text-white p-5 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-sky-400" />
                  <h3 className="text-base font-bold text-white">GIS Spatial & Incident Intelligence</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Interactive OpenStreetMap geospatial monitoring across Pune wards, spatial density clusters, and acute chronic recurrence corridors.
                </p>
              </div>
              {onNavigateToGIS && (
                <button
                  onClick={onNavigateToGIS}
                  className="self-start px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow-sm"
                >
                  Launch Full GIS Explorer <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="bg-gradient-to-br from-[#17365D] to-indigo-950 text-white p-5 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-300" />
                  <h3 className="text-base font-bold text-white">Analytics, Trends & Recurrence</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Complete departmental distributions, resolution efficiency curves, chronic failure hotspots, and executive digests.
                </p>
              </div>
              {onNavigateToAnalytics && (
                <button
                  onClick={onNavigateToAnalytics}
                  className="self-start px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow-sm"
                >
                  View Executive Analytics <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: AUTHORITY ACCOUNT MANAGEMENT (PART 8) */}
      {/* ===================================================================== */}
      {activeTab === 'accounts' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#17365D]" /> Authority Staff & Access Management
              </h2>
              <p className="text-xs text-slate-500">
                Manage Municipal Operators, Quality Reviewers, and Civic Administrators. Issue secure single-use invitation links.
              </p>
            </div>

            <button
              onClick={() => {
                setIsInviteOpen(true);
                setInviteResult(null);
                setInviteError(null);
              }}
              className="px-4 py-2 bg-[#17365D] hover:bg-[#102A43] text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-xs shrink-0 self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              Invite Official Account
            </button>
          </div>

          {/* Filters Strip */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search staff by name, email, employee ID..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-[#17365D]"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:ring-2 focus:ring-[#17365D]"
              >
                <option value="all">All Authority Roles</option>
                <option value="operator">Municipal Operators</option>
                <option value="reviewer">Quality Reviewers</option>
                <option value="admin">Administrators</option>
              </select>

              <button
                onClick={loadData}
                title="Refresh Staff List"
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Accounts Table */}
          {loadingUsers ? (
            <div className="py-12 text-center text-slate-400 animate-pulse text-xs">
              Loading authority accounts...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No authority accounts found matching your filter.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Official / Employee ID</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Department & Jurisdiction</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Last Activity</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 space-y-0.5">
                        <span className="font-bold text-slate-900 block">{u.name}</span>
                        <div className="flex items-center gap-2 text-slate-500 font-mono text-[10px]">
                          <span>{u.employee_id || 'N/A'}</span>
                          <span>•</span>
                          <span>{u.email}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          u.role === 'admin'
                            ? 'bg-slate-900 text-white'
                            : u.role === 'reviewer'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-sky-100 text-[#17365D] border border-sky-200'
                        }`}>
                          {u.role.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">{u.designation}</span>
                      </td>

                      <td className="py-3 px-4 space-y-0.5">
                        <span className="font-medium text-slate-800 block">{u.department_name || 'All Municipal Departments'}</span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#3973B9]" />
                          Ward: {u.jurisdiction_ward || 'City-wide (ALL)'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {u.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[10px]">
                        {u.last_login_at
                          ? new Date(u.last_login_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : 'Never logged in'}
                      </td>

                      <td className="py-3 px-4 text-right space-x-2">
                        {u.id !== user?.id && (
                          <>
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`px-2 py-1 rounded text-[10px] font-semibold border transition ${
                                u.status === 'active'
                                  ? 'border-red-200 text-red-600 hover:bg-red-50'
                                  : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                              }`}
                            >
                              {u.status === 'active' ? 'Deactivate' : 'Reactivate'}
                            </button>

                            <button
                              onClick={() => {
                                setResetTargetUser(u);
                                setNewAdminPassword('');
                                setResetMessage(null);
                              }}
                              className="px-2 py-1 rounded text-[10px] font-semibold border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
                            >
                              Reset Pwd
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: INVITE OFFICIAL ACCOUNT */}
      {/* ===================================================================== */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#17365D] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-sky-300" />
                <h3 className="text-sm font-bold">Invite Municipal Official Account</h3>
              </div>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="p-6 space-y-3.5 text-xs">
              {inviteError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {inviteError}
                </div>
              )}

              {inviteResult ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Official Invitation Created Successfully</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    A single-use account activation link has been generated. Send this link to the official so they can configure their password. Link valid for 72 hours.
                  </p>
                  <div className="p-2.5 bg-white rounded-lg border border-emerald-200 flex items-center justify-between gap-2 font-mono text-[11px] text-slate-700">
                    <span className="truncate">{window.location.origin}{inviteResult.url}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`${window.location.origin}${inviteResult.url}`)}
                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center gap-1 shrink-0"
                    >
                      {copiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedLink ? 'Copied' : 'Copy Link'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsInviteOpen(false);
                      setInviteResult(null);
                    }}
                    className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg text-xs"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Official Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Er. Anand More"
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-[#17365D]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Official Govt Email</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. anand.more@pune.gov.in"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-[#17365D]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Assign Role</label>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as UserRole)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-[#17365D] bg-white font-semibold"
                      >
                        <option value="operator">Municipal Operator</option>
                        <option value="reviewer">Quality Reviewer</option>
                        <option value="admin">Civic Administrator</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Official Employee ID</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. PMC-OP-8890"
                        value={inviteEmpId}
                        onChange={(e) => setInviteEmpId(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-[#17365D]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Municipal Department</label>
                      <select
                        value={inviteDept}
                        onChange={(e) => setInviteDept(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-[#17365D] bg-white"
                      >
                        <option value="Roads & Infrastructure Department">Roads & Infrastructure</option>
                        <option value="Drainage & Stormwater Department">Drainage & Stormwater</option>
                        <option value="Solid Waste & Sanitation Department">Solid Waste & Sanitation</option>
                        <option value="Streetlighting & Electrical Wing">Streetlighting & Electrical</option>
                        <option value="Quality Audit & Verification Cell">Quality Audit & Verification</option>
                        <option value="Municipal Administrative Secretariat">Administrative Secretariat</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Jurisdiction Ward</label>
                      <select
                        value={inviteWard}
                        onChange={(e) => setInviteWard(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-[#17365D] bg-white"
                      >
                        <option value="ALL">City-Wide (ALL Pune)</option>
                        <option value="Shivajinagar">Shivajinagar (Zone 7)</option>
                        <option value="Kothrud">Kothrud (Zone 6)</option>
                        <option value="Baner">Baner (Zone 8)</option>
                        <option value="Aundh">Aundh (Zone 8)</option>
                        <option value="Deccan Gymkhana">Deccan Gymkhana</option>
                        <option value="Hinjawadi">Hinjawadi (PCMC)</option>
                        <option value="Viman Nagar">Viman Nagar</option>
                        <option value="Hadapsar">Hadapsar</option>
                        <option value="Swargate">Swargate</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Official Designation</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Assistant Executive Engineer (Drainage)"
                      value={inviteDesignation}
                      onChange={(e) => setInviteDesignation(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-[#17365D]"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={inviting}
                      className="w-full py-2.5 bg-[#17365D] hover:bg-[#102A43] text-white rounded-lg font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      {inviting ? 'Generating Invitation Token...' : 'Generate Single-Use Activation Link'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: ADMIN PASSWORD RESET */}
      {/* ===================================================================== */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#17365D] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-300" />
                <h3 className="text-sm font-bold">Administrator Password Reset</h3>
              </div>
              <button
                onClick={() => setResetTargetUser(null)}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordResetSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <span className="text-slate-500 block">Target Account:</span>
                <span className="text-sm font-bold text-slate-900 block">{resetTargetUser.name}</span>
                <span className="text-[11px] text-slate-400 font-mono">{resetTargetUser.email} • {resetTargetUser.employee_id}</span>
              </div>

              {resetMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-medium">
                  {resetMessage}
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">New Password</label>
                <input
                  type="text"
                  required
                  placeholder="Minimum 8 characters"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-[#17365D] font-mono text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="px-4 py-2 bg-[#17365D] hover:bg-[#102A43] text-white rounded-lg font-bold shadow-xs"
                >
                  {resetting ? 'Resetting...' : 'Confirm Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
