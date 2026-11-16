import React, { useState, useEffect, useMemo } from 'react';
import { CivicIssue } from '../services/types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { CategoryBadge } from '../components/common/CategoryBadge';
import {
  CheckCircle2, AlertOctagon, Clock, ShieldCheck,
  Search, ArrowRight, Eye, Camera, Check, XCircle,
  RefreshCw, FileText, MapPin
} from 'lucide-react';

interface ReviewerDashboardProps {
  onSelectIssue: (issue: CivicIssue) => void;
  onActionVerify?: (issue: CivicIssue) => void;
}

export const ReviewerDashboard: React.FC<ReviewerDashboardProps> = ({
  onSelectIssue,
  onActionVerify
}) => {
  const { user } = useAuth();
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'resolved' | 'all'>('pending');
  const [search, setSearch] = useState('');

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

  // Filter complaints
  const filteredIssues = useMemo(() => {
    return issues.filter(iss => {
      if (activeTab === 'pending') {
        if (iss.status !== 'awaiting_verification') return false;
      } else if (activeTab === 'resolved') {
        if (iss.status !== 'resolved') return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const str = (iss.issue_code + ' ' + iss.title + ' ' + iss.location.ward + ' ' + (iss.assigned_department_name || '')).toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  }, [issues, activeTab, search]);

  const pendingVerificationCount = useMemo(() => {
    return issues.filter(i => i.status === 'awaiting_verification').length;
  }, [issues]);

  const resolvedCount = useMemo(() => {
    return issues.filter(i => i.status === 'resolved').length;
  }, [issues]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Reviewer Profile Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-[#17365D] text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-purple-400/20 border border-purple-400/30 flex items-center justify-center text-purple-200 shrink-0">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-400/20 text-purple-200 font-semibold text-xs border border-purple-400/30">
                Quality Reviewer Cell
              </span>
              <span className="text-xs text-purple-200/80 font-mono">
                ID: {user?.employee_id || 'PCMC-QR-5012'}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              {user?.name || 'Dr. Sunita Kulkarni'}
            </h1>
            <p className="text-xs text-purple-200/80 flex items-center gap-1.5">
              <span>{user?.designation || 'Chief Quality Auditor'}</span>
              <span>•</span>
              <span className="font-semibold text-white">Independent Audit & Verification</span>
            </p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/15 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-purple-300 shrink-0" />
          <div>
            <span className="text-[10px] text-purple-200 uppercase font-bold tracking-wider block">
              Inspection Queue
            </span>
            <span className="text-sm font-bold text-white">
              {pendingVerificationCount} Works Awaiting Approval
            </span>
          </div>
        </div>
      </div>

      {/* KPI Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          onClick={() => setActiveTab('pending')}
          className={`p-4 rounded-xl border cursor-pointer transition shadow-2xs ${
            activeTab === 'pending'
              ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-400/30'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Awaiting Verification</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-900 mt-2 font-mono">
            {pendingVerificationCount}
          </div>
          <span className="text-[10px] text-purple-700 font-semibold">Field work completed, inspection needed</span>
        </div>

        <div
          onClick={() => setActiveTab('resolved')}
          className={`p-4 rounded-xl border cursor-pointer transition shadow-2xs ${
            activeTab === 'resolved'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/30'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Approved Resolutions</span>
            <Check className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-800 mt-2 font-mono">
            {resolvedCount}
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold">Closed with verified proof</span>
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
            <span>Total Works Monitored</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {issues.length}
          </div>
          <span className="text-[10px] text-slate-500 font-semibold">City-wide quality oversight</span>
        </div>
      </div>

      {/* Main Verification Queue */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-4">
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by ID, keyword, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <button
            onClick={loadIssues}
            title="Refresh Inspection Queue"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition self-end sm:self-auto"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 animate-pulse text-xs">
            Loading inspection queue...
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="font-semibold text-slate-700">No issues currently awaiting verification.</p>
            <p>All completed works have been audited and signed off.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIssues.map((issue) => {
              const originalEvidence = issue.evidence?.find(e => e.evidence_type === 'original');
              const resolutionEvidence = issue.evidence?.find(e => e.evidence_type === 'resolution');

              return (
                <div
                  key={issue.id}
                  onClick={() => onSelectIssue(issue)}
                  className="p-4 bg-slate-50/70 hover:bg-white rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-xs transition cursor-pointer space-y-3 group"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {issue.issue_code}
                      </span>
                      <CategoryBadge category={issue.category} size="sm" />
                      <PriorityBadge level={issue.priority.priority_level} score={issue.priority.raw_score} size="sm" />
                    </div>
                    <StatusBadge status={issue.status} size="sm" />
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-900 transition">
                    {issue.title}
                  </h3>

                  <div className="text-xs text-slate-500 flex items-center gap-2 truncate">
                    <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span className="truncate">{issue.location.address}, {issue.location.ward}</span>
                    <span>•</span>
                    <span className="truncate">Unit: <strong className="text-slate-700">{issue.assigned_department_name}</strong></span>
                  </div>

                  {/* Before & After Photo Inspection Box */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                        <Camera className="w-3 h-3 text-blue-600" /> Original Grievance Photo
                      </span>
                      {originalEvidence?.file_url ? (
                        <div className="h-28 rounded overflow-hidden bg-slate-100 border border-slate-200">
                          <img src={originalEvidence.file_url} alt="Original Defect" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-28 rounded bg-slate-100 flex items-center justify-center text-slate-400 text-[10px]">
                          No initial photo uploaded
                        </div>
                      )}
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-purple-200 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-purple-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-purple-600" /> Field Remediation Photo
                      </span>
                      {resolutionEvidence?.file_url ? (
                        <div className="h-28 rounded overflow-hidden bg-slate-100 border border-purple-200">
                          <img src={resolutionEvidence.file_url} alt="Remediation Proof" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-28 rounded bg-purple-50 flex items-center justify-center text-purple-400 text-[10px]">
                          Pending field upload
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Review Action Toolbar */}
                  <div
                    className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-[11px] text-slate-500 italic">
                      Authoritative review: audit compliance with Pune municipal standards.
                    </span>

                    <div className="flex items-center gap-2">
                      {issue.status === 'awaiting_verification' && onActionVerify && (
                        <button
                          onClick={() => onActionVerify(issue)}
                          className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verify & Sign Off
                        </button>
                      )}

                      <button
                        onClick={() => onSelectIssue(issue)}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition"
                      >
                        Inspect Details
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
};
