import React, { useState, useEffect } from 'react';
import { CivicIssue, AnalyticsSummary } from '../services/types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { OverviewStats } from '../components/authority/OverviewStats';
import { IssueManagementTable } from '../components/authority/IssueManagementTable';
import { AssignmentModal } from '../components/authority/AssignmentModal';
import { StatusTransitionModal } from '../components/authority/StatusTransitionModal';
import { VerificationModal } from '../components/authority/VerificationModal';
import { DuplicateReviewModal } from '../components/authority/DuplicateReviewModal';
import { AIDetailDrawer } from '../components/authority/AIDetailDrawer';
import {
  Shield, UserCheck, CheckCircle2, AlertTriangle,
  RefreshCw, Filter, Sparkles, Layers, Flame, Copy,
  CheckSquare, Repeat, Info
} from 'lucide-react';

interface AuthorityPortalProps {
  onSelectIssue: (issue: CivicIssue) => void;
}

export const AuthorityPortal: React.FC<AuthorityPortalProps> = ({ onSelectIssue }) => {
  const { role, userName, roleDescriptions } = useAuth();
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Workflow queue tab state
  const [activeQueueTab, setActiveQueueTab] = useState<'all' | 'urgent' | 'duplicates' | 'verification' | 'recurring'>('all');

  // Modal target states
  const [assignTarget, setAssignTarget] = useState<CivicIssue | null>(null);
  const [statusTarget, setStatusTarget] = useState<CivicIssue | null>(null);
  const [verifyTarget, setVerifyTarget] = useState<CivicIssue | null>(null);
  const [duplicateTarget, setDuplicateTarget] = useState<CivicIssue | null>(null);
  const [aiTarget, setAiTarget] = useState<CivicIssue | null>(null);

  const reloadData = () => {
    setLoading(true);
    Promise.all([
      api.getIssues(),
      api.getAnalyticsSummary()
    ]).then(([issuesData, sumData]) => {
      setIssues(issuesData);
      setSummary(sumData);
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Filter issues based on active queue tab
  const getTabFilteredIssues = () => {
    switch (activeQueueTab) {
      case 'urgent':
        return issues.filter(i => i.priority.priority_level === 'critical' || i.priority.priority_level === 'high');
      case 'duplicates':
        return issues.filter(i => i.duplicate_candidates && i.duplicate_candidates.length > 0);
      case 'verification':
        return issues.filter(i => i.status === 'awaiting_verification');
      case 'recurring':
        return issues.filter(i => i.is_recurring);
      case 'all':
      default:
        return issues;
    }
  };

  const displayedIssues = getTabFilteredIssues();

  return (
    <div className="space-y-5">
      {/* Role Context Notification Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#173B65] text-sky-400 flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">{userName}</span>
              <span className="font-mono uppercase font-bold text-[10px] px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-300">
                {role}
              </span>
            </div>
            <p className="text-slate-500 text-[11px] mt-0.5">{roleDescriptions[role]}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={reloadData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Desk</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Metrics Cards */}
      <OverviewStats
        summary={summary}
        onFilterStatus={(st) => {
          if (st === 'awaiting_verification') setActiveQueueTab('verification');
          else setActiveQueueTab('all');
        }}
        onFilterPriority={(p) => {
          if (p === 'critical') setActiveQueueTab('urgent');
          else setActiveQueueTab('all');
        }}
        onFilterRecurring={() => setActiveQueueTab('recurring')}
      />

      {/* AI Transparency & Human Supervision Notice */}
      <div className="p-3 bg-slate-100/90 rounded-xl border border-slate-200/80 text-[11px] text-slate-700 flex items-start gap-2">
        <Info className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800">AI Decision-Support Transparency:</span> All category classifications, priority scores, and duplicate suggestions are advisory recommendations. Municipal staff have complete authority to reassign, change status, or dismiss suggestions. CivicLens AI never closes issues or deletes records automatically.
        </div>
      </div>

      {/* Main Issue Management with Workflow Queue Switcher */}
      <div className="space-y-3">
        {/* Workflow Action Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 pb-2">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveQueueTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeQueueTab === 'all'
                  ? 'bg-[#173B65] text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              All Issues ({issues.length})
            </button>

            <button
              onClick={() => setActiveQueueTab('urgent')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeQueueTab === 'urgent'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-white hover:bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              Action Queue: Urgent ({issues.filter(i => i.priority.priority_level === 'critical' || i.priority.priority_level === 'high').length})
            </button>

            <button
              onClick={() => setActiveQueueTab('duplicates')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeQueueTab === 'duplicates'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-white hover:bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              <Copy className="w-3.5 h-3.5" />
              Duplicates to Review ({issues.filter(i => i.duplicate_candidates && i.duplicate_candidates.length > 0).length})
            </button>

            <button
              onClick={() => setActiveQueueTab('verification')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeQueueTab === 'verification'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-white hover:bg-purple-50 text-purple-700 border border-purple-200'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Verify Completed Work ({issues.filter(i => i.status === 'awaiting_verification').length})
            </button>

            <button
              onClick={() => setActiveQueueTab('recurring')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeQueueTab === 'recurring'
                  ? 'bg-red-800 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <Repeat className="w-3.5 h-3.5" />
              Repeated Problem Spots ({issues.filter(i => i.is_recurring).length})
            </button>
          </div>
        </div>

        <IssueManagementTable
          issues={displayedIssues}
          onSelectIssue={(iss) => {
            onSelectIssue(iss);
            setAiTarget(iss);
          }}
          onAssign={(iss) => setAssignTarget(iss)}
          onTransitionStatus={(iss) => setStatusTarget(iss)}
          onVerify={(iss) => setVerifyTarget(iss)}
          onReviewDuplicates={(iss) => setDuplicateTarget(iss)}
          onShowAIInsights={(iss) => setAiTarget(iss)}
        />
      </div>

      {/* Modal Dialogs */}
      <AssignmentModal
        issue={assignTarget}
        isOpen={Boolean(assignTarget)}
        onClose={() => setAssignTarget(null)}
        onAssigned={reloadData}
      />

      <StatusTransitionModal
        issue={statusTarget}
        isOpen={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        onStatusUpdated={reloadData}
      />

      <VerificationModal
        issue={verifyTarget}
        isOpen={Boolean(verifyTarget)}
        onClose={() => setVerifyTarget(null)}
        onVerified={reloadData}
      />

      <DuplicateReviewModal
        issue={duplicateTarget}
        isOpen={Boolean(duplicateTarget)}
        onClose={() => setDuplicateTarget(null)}
        onCandidateHandled={reloadData}
      />

      <AIDetailDrawer
        issue={aiTarget}
        isOpen={Boolean(aiTarget)}
        onClose={() => setAiTarget(null)}
        onActionAssign={(iss) => { setAiTarget(null); setAssignTarget(iss); }}
        onActionTransition={(iss) => { setAiTarget(null); setStatusTarget(iss); }}
        onActionVerify={(iss) => { setAiTarget(null); setVerifyTarget(iss); }}
      />
    </div>
  );
};
