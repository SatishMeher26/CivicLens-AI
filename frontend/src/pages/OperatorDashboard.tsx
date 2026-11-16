import React, { useState, useEffect, useMemo } from 'react';
import { CivicIssue } from '../services/types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { CategoryBadge } from '../components/common/CategoryBadge';
import {
  HardHat, MapPin, Building2, Clock, CheckCircle2,
  AlertTriangle, Filter, Search, ArrowRight, RefreshCw,
  PlusCircle, Camera, FileText
} from 'lucide-react';

interface OperatorDashboardProps {
  onSelectIssue: (issue: CivicIssue) => void;
  onActionAssign?: (issue: CivicIssue) => void;
  onActionTransition?: (issue: CivicIssue) => void;
}

export const OperatorDashboard: React.FC<OperatorDashboardProps> = ({
  onSelectIssue,
  onActionAssign,
  onActionTransition
}) => {
  const { user } = useAuth();
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'triage' | 'in_progress' | 'critical'>('all');
  const [scopeFilter, setScopeFilter] = useState<'ward_only' | 'all_pune'>('ward_only');

  const operatorWard = user?.jurisdiction_ward || 'Shivajinagar';
  const operatorDept = user?.department_name || 'Roads & Infrastructure Department';

  const loadIssues = () => {
    setLoading(true);
    api.getIssues()
      .then(data => setIssues(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadIssues();
  }, []);

  // Filter complaints based on jurisdiction scope and search
  const filteredIssues = useMemo(() => {
    return issues.filter(iss => {
      // Scope filter: Operator's assigned ward vs city-wide
      if (scopeFilter === 'ward_only' && operatorWard !== 'ALL') {
        const matchLoc = (iss.location.locality + ' ' + iss.location.ward).toLowerCase();
        if (!matchLoc.includes(operatorWard.toLowerCase())) {
          return false;
        }
      }

      // Tab filter
      if (activeTab === 'triage') {
        if (iss.status !== 'submitted' && iss.status !== 'under_review') return false;
      } else if (activeTab === 'in_progress') {
        if (iss.status !== 'in_progress' && iss.status !== 'assigned') return false;
      } else if (activeTab === 'critical') {
        if (iss.priority.priority_level !== 'critical' && iss.priority.priority_level !== 'high') return false;
      }

      // Search keyword
      if (search.trim()) {
        const q = search.toLowerCase();
        const str = (iss.issue_code + ' ' + iss.title + ' ' + iss.location.address + ' ' + iss.location.ward).toLowerCase();
        if (!str.includes(q)) return false;
      }

      return true;
    });
  }, [issues, scopeFilter, activeTab, search, operatorWard]);

  // Statistics
  const stats = useMemo(() => {
    const total = issues.length;
    const pendingTriage = issues.filter(i => i.status === 'submitted' || i.status === 'under_review').length;
    const inProgress = issues.filter(i => i.status === 'in_progress' || i.status === 'assigned').length;
    const criticalCount = issues.filter(i => i.priority.priority_level === 'critical').length;
    return { total, pendingTriage, inProgress, criticalCount };
  }, [issues]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Operator Officer Profile Banner */}
      <div className="bg-[#17365D] text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-sky-400/20 border border-sky-400/30 flex items-center justify-center text-sky-200 shrink-0">
            <HardHat className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-400/20 text-sky-200 font-semibold text-xs border border-sky-400/30">
                Municipal Operator Desk
              </span>
              <span className="text-xs text-sky-200/80 font-mono">
                ID: {user?.employee_id || 'PMC-OP-2041'}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              {user?.name || 'Er. Rajesh Verma'}
            </h1>
            <p className="text-xs text-sky-200/80 flex items-center gap-1.5">
              <span>{user?.designation || 'Senior Zonal Dispatcher'}</span>
              <span>•</span>
              <span className="font-semibold text-white">{operatorDept}</span>
            </p>
          </div>
        </div>

        {/* Assigned Jurisdiction Pill */}
        <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/15 flex items-center gap-3">
          <MapPin className="w-5 h-5 text-sky-300 shrink-0" />
          <div>
            <span className="text-[10px] text-sky-200 uppercase font-bold tracking-wider block">
              Assigned Jurisdiction
            </span>
            <span className="text-sm font-bold text-white">
              {operatorWard} Ward (Pune Zone 7)
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div
          onClick={() => setActiveTab('triage')}
          className={`p-4 rounded-xl border cursor-pointer transition shadow-2xs ${
            activeTab === 'triage'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/30'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Pending Triage</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {stats.pendingTriage}
          </div>
          <span className="text-[10px] text-amber-700 font-semibold">Requires category / unit dispatch</span>
        </div>

        <div
          onClick={() => setActiveTab('in_progress')}
          className={`p-4 rounded-xl border cursor-pointer transition shadow-2xs ${
            activeTab === 'in_progress'
              ? 'bg-sky-50/70 border-sky-300 ring-2 ring-sky-400/30'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Work In Progress</span>
            <HardHat className="w-4 h-4 text-[#3973B9]" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {stats.inProgress}
          </div>
          <span className="text-[10px] text-sky-700 font-semibold">Active field engineering crews</span>
        </div>

        <div
          onClick={() => setActiveTab('critical')}
          className={`p-4 rounded-xl border cursor-pointer transition shadow-2xs ${
            activeTab === 'critical'
              ? 'bg-red-50/70 border-red-300 ring-2 ring-red-400/30'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Critical Hazards</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-700 mt-2 font-mono">
            {stats.criticalCount}
          </div>
          <span className="text-[10px] text-red-600 font-semibold">High public safety risk &lt;24h SLA</span>
        </div>

        <div
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-xl border cursor-pointer transition shadow-2xs ${
            activeTab === 'all'
              ? 'bg-slate-50 border-slate-400 ring-2 ring-slate-400/30'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total Municipal Incidents</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {stats.total}
          </div>
          <span className="text-[10px] text-slate-500 font-semibold">City-wide consolidated database</span>
        </div>
      </div>

      {/* Control Strip & Complaints List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-4">
        
        {/* Controls: Search + Jurisdiction Scope Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by ID, keyword, road or ward..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-[#17365D]"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setScopeFilter('ward_only')}
                className={`px-3 py-1 rounded font-semibold transition ${
                  scopeFilter === 'ward_only'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {operatorWard} Only ({issues.filter(i => i.location.ward.includes(operatorWard)).length})
              </button>
              <button
                onClick={() => setScopeFilter('all_pune')}
                className={`px-3 py-1 rounded font-semibold transition ${
                  scopeFilter === 'all_pune'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Pune Wards ({issues.length})
              </button>
            </div>

            <button
              onClick={loadIssues}
              title="Refresh Queue"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Complaints Table / List */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 animate-pulse text-xs">
            Loading municipal queue...
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs space-y-1">
            <p className="font-semibold text-slate-600">No issues found in this filter.</p>
            <p>Try switching to "All Pune Wards" or changing the tab.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredIssues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => onSelectIssue(issue)}
                className="p-3.5 bg-slate-50/60 hover:bg-white rounded-xl border border-slate-200 hover:border-sky-300 hover:shadow-xs transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 group"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {issue.issue_code}
                    </span>
                    <CategoryBadge category={issue.category} size="sm" />
                    <PriorityBadge level={issue.priority.priority_level} score={issue.priority.raw_score} size="sm" />
                    <StatusBadge status={issue.status} size="sm" />
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#17365D] transition truncate">
                    {issue.title}
                  </h3>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-[#3973B9] shrink-0" />
                      {issue.location.address}, {issue.location.ward}
                    </span>
                    <span>•</span>
                    <span className="truncate">
                      Assigned: <strong className="text-slate-700">{issue.assigned_department_name || 'Unassigned'}</strong>
                    </span>
                  </div>
                </div>

                {/* Operator Actions Toolbar */}
                <div
                  className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  {onActionAssign && (
                    <button
                      onClick={() => onActionAssign(issue)}
                      className="px-2.5 py-1 bg-[#17365D] hover:bg-[#102A43] text-white rounded text-[11px] font-semibold transition flex items-center gap-1 shadow-2xs"
                    >
                      <Building2 className="w-3 h-3" /> Assign Unit
                    </button>
                  )}

                  {onActionTransition && (
                    <button
                      onClick={() => onActionTransition(issue)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[11px] font-semibold transition shadow-2xs"
                    >
                      Change Status
                    </button>
                  )}

                  <button
                    onClick={() => onSelectIssue(issue)}
                    className="p-1.5 text-slate-400 hover:text-slate-700"
                    title="View Full Profile"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
};
