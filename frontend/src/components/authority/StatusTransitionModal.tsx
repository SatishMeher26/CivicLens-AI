import React, { useState } from 'react';
import { CivicIssue, IssueStatus } from '../../services/types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { X, ArrowRightLeft, AlertCircle, ShieldAlert } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface StatusTransitionModalProps {
  issue: CivicIssue | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated: () => void;
}

// Allowed state transitions mirroring backend state machine
const ALLOWED_NEXT_STATUSES: Record<IssueStatus, IssueStatus[]> = {
  submitted: ['under_review', 'assigned', 'rejected'],
  under_review: ['assigned', 'rejected'],
  assigned: ['in_progress', 'under_review', 'rejected'],
  in_progress: ['awaiting_verification', 'assigned'],
  awaiting_verification: ['resolved', 'in_progress'],
  resolved: ['reopened'],
  reopened: ['under_review', 'assigned', 'in_progress'],
  rejected: ['under_review'],
};

export const StatusTransitionModal: React.FC<StatusTransitionModalProps> = ({
  issue,
  isOpen,
  onClose,
  onStatusUpdated
}) => {
  const { userName, role } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<IssueStatus | ''>('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !issue) return null;

  const validNext = ALLOWED_NEXT_STATUSES[issue.status] || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus) {
      setError('Please select a valid next lifecycle status.');
      return;
    }
    if (!reason.trim()) {
      setError('A formal operational transition reason is required for the audit ledger.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await api.updateStatus(issue.id, {
        to_status: selectedStatus,
        reason: reason.trim(),
        changed_by: userName,
        role: role
      });
      onStatusUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Status transition failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="px-6 py-4 bg-[#173B65] text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-sky-400" />
              Lifecycle State Transition
            </h3>
            <p className="text-xs text-sky-200 font-mono">{issue.issue_code}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              {error}
            </div>
          )}

          {/* Current State */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-600 font-medium">Current Status:</span>
            <StatusBadge status={issue.status} />
          </div>

          {/* Valid Next Status Selector */}
          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
              Permitted Next Status (State Machine Validated)
            </label>
            {validNext.length === 0 ? (
              <p className="text-rose-600 font-medium">No valid state transitions permitted from current state.</p>
            ) : (
              <select
                required
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as IssueStatus)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Select next status...</option>
                {validNext.map((st) => (
                  <option key={st} value={st}>
                    {st.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Mandatory Reason */}
          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
              Transition Reason / Field Remarks <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Provide exact justification (e.g. Field repair crew completed asphalt rolling; ready for quality inspection)."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="text-[11px] text-slate-500">
            Recorded in immutable audit trail by: <span className="font-semibold text-slate-700">{userName}</span>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:text-slate-800">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || validNext.length === 0}
              className="px-5 py-2 bg-[#173B65] hover:bg-navy-900 text-white rounded-lg font-semibold shadow-sm transition disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Commit State Change'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
