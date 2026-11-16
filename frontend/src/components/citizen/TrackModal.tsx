import React, { useState } from 'react';
import { api } from '../../services/api';
import { CivicIssue } from '../../services/types';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { CategoryBadge } from '../common/CategoryBadge';
import {
  X, Search, Clock, ShieldCheck, MapPin,
  CheckCircle2, AlertCircle, Star, ArrowRight, Check, User
} from 'lucide-react';

interface TrackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LIFECYCLE_STAGES = [
  { key: 'submitted', label: 'Report Received', desc: 'Submitted by citizen' },
  { key: 'assigned', label: 'Assigned to Crew', desc: 'Routed to department' },
  { key: 'in_progress', label: 'Work in Progress', desc: 'Field repair underway' },
  { key: 'awaiting_verification', label: 'Repair Completed', desc: 'Awaiting quality check' },
  { key: 'resolved', label: 'Resolved & Closed', desc: 'Inspected and verified' },
];

export const TrackModal: React.FC<TrackModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('CVL-2026-103');
  const [issue, setIssue] = useState<CivicIssue | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Citizen feedback state
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setIssue(null);
    setFeedbackSuccess(false);

    try {
      // 1. Try by issue code or ID
      try {
        const found = await api.getIssue(query.trim());
        setIssue(found);
        return;
      } catch {
        // 2. Try report tracking code or contact
        const rep = await api.getReport(query.trim());
        if (rep.linked_issue_id) {
          const linked = await api.getIssue(rep.linked_issue_id);
          setIssue(linked);
        } else {
          setError('Report found but has no active municipal ticket.');
        }
      }
    } catch (err: any) {
      setError('No record found matching this code. Please check your tracking number or phone.');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue) return;
    try {
      const updated = await api.submitFeedback(issue.id, {
        rating: feedbackRating,
        comment: feedbackComment,
        citizen_name: 'Citizen'
      });
      setIssue(updated);
      setFeedbackSuccess(true);
    } catch (err: any) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  // Determine stage index
  const getStageIndex = (status: string) => {
    if (status === 'submitted' || status === 'under_review') return 0;
    if (status === 'assigned') return 1;
    if (status === 'in_progress') return 2;
    if (status === 'awaiting_verification') return 3;
    if (status === 'resolved') return 4;
    return 0;
  };

  const activeStage = issue ? getStageIndex(issue.status) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 bg-[#173B65] text-white flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Search className="w-5 h-5 text-sky-400" />
              Track Your Report Progress
            </h2>
            <p className="text-xs text-sky-200">
              Check live status, field crew updates, and submit feedback when completed
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-300 hover:text-white" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-5 pb-3 border-b border-slate-100 bg-slate-50">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter tracking code (TRK-...) or ticket code (CVL-...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-sky-500 outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#173B65] hover:bg-navy-900 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              {loading ? 'Checking...' : 'Check Status'}
            </button>
          </form>

          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-500">
            <span>Demo sample codes:</span>
            {['CVL-2026-101', 'CVL-2026-103', 'CVL-2026-107'].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setQuery(code);
                }}
                className="font-mono text-sky-700 bg-white hover:bg-sky-50 px-2 py-0.5 rounded border border-slate-200 transition"
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              {error}
            </div>
          )}

          {issue && (
            <div className="space-y-5">
              {/* Header Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-mono text-xs font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded border border-sky-200">
                    Ticket ID: {issue.issue_code}
                  </span>
                  <div className="flex items-center gap-2">
                    <PriorityBadge level={issue.priority.priority_level} score={issue.priority.raw_score} />
                    <StatusBadge status={issue.status} />
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900">{issue.title}</h3>

                <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                  <CategoryBadge category={issue.category} />
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {issue.location.address}, {issue.location.ward}
                  </span>
                </div>
              </div>

              {/* Visual Progress Steps Tracker */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Resolution Progress
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[10px]">
                  {LIFECYCLE_STAGES.map((st, i) => {
                    const isDone = i <= activeStage;
                    const isCurrent = i === activeStage;
                    return (
                      <div
                        key={st.key}
                        className={`p-2 rounded-lg border transition ${
                          isCurrent
                            ? 'bg-sky-50 border-sky-500 font-bold text-sky-900 shadow-xs'
                            : isDone
                            ? 'bg-white border-emerald-300 text-emerald-800'
                            : 'bg-white/50 border-slate-200 text-slate-400'
                        }`}
                      >
                        <div className="flex justify-center mb-1">
                          {isDone ? (
                            <CheckCircle2 className={`w-4 h-4 ${isCurrent ? 'text-sky-600' : 'text-emerald-500'}`} />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-300" />
                          )}
                        </div>
                        <div className="font-semibold">{st.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Responsible Department Box */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 block text-[11px]">Assigned Department:</span>
                  <span className="font-semibold text-slate-800">{issue.assigned_department_name || 'Triage in Progress'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Duty Officer / Squad Lead:</span>
                  <span className="font-semibold text-slate-800">{issue.assigned_officer || 'Zonal Queue'}</span>
                </div>
              </div>

              {/* Status Timeline in Plain English */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                  Activity History
                </h4>

                <div className="space-y-2.5 pl-2 border-l-2 border-sky-200">
                  {issue.status_history.map((hist, idx) => (
                    <div key={hist.id || idx} className="relative pl-4">
                      <div className="absolute -left-[1.35rem] top-1 w-2.5 h-2.5 rounded-full bg-sky-600 border-2 border-white shadow-sm" />
                      <div className="text-xs">
                        <span className="font-semibold text-slate-800">{hist.to_status.replace('_', ' ').toUpperCase()}</span>
                        <span className="text-slate-400 text-[10px] ml-2">
                          {new Date(hist.timestamp).toLocaleDateString()} at {new Date(hist.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {hist.reason && <p className="text-[11px] text-slate-600 mt-0.5">{hist.reason}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Before and After Photos */}
              {issue.evidence && issue.evidence.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Inspection & Resolution Photos ({issue.evidence.length})
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {issue.evidence.map((evi) => (
                      <div key={evi.id} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                        <div className="h-40 w-full bg-slate-100">
                          <img src={evi.file_url} alt={evi.description || 'Evidence'} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-2.5 text-[11px]">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            evi.evidence_type === 'resolution' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {evi.evidence_type === 'resolution' ? 'Post-Repair Photo' : 'Original Grievance Photo'}
                          </span>
                          <p className="text-slate-600 mt-1">{evi.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Citizen Feedback Form (when Resolved) */}
              {issue.status === 'resolved' && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-3">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    This issue has been marked resolved!
                  </div>

                  {issue.citizen_feedback_rating ? (
                    <div className="p-3 bg-white rounded-lg border border-emerald-100 text-[11px] space-y-1">
                      <div className="flex items-center gap-1 text-amber-600 font-bold">
                        <span>Your Rating:</span>
                        {'★'.repeat(issue.citizen_feedback_rating)}
                        {'☆'.repeat(5 - issue.citizen_feedback_rating)}
                      </div>
                      {issue.citizen_feedback_comment && (
                        <p className="text-slate-600 italic">"{issue.citizen_feedback_comment}"</p>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleFeedbackSubmit} className="space-y-2.5">
                      <p className="text-slate-700 text-[11px]">
                        How satisfied are you with the quality and speed of this repair?
                      </p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFeedbackRating(star)}
                            className={`p-1 text-2xl transition hover:scale-110 ${star <= feedbackRating ? 'text-amber-500' : 'text-slate-300'}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder="Optional remarks (e.g. Clean patchwork, swift response)..."
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-xs"
                      >
                        Submit Feedback
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
