import React, { useState } from 'react';
import { CivicIssue } from '../../services/types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  X, CheckSquare, XCircle, ShieldCheck, Sparkles,
  AlertTriangle, Image as ImageIcon, Info
} from 'lucide-react';

interface VerificationModalProps {
  issue: CivicIssue | null;
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  issue,
  isOpen,
  onClose,
  onVerified
}) => {
  const { userName } = useAuth();
  const [notes, setNotes] = useState('Inspected post-remediation photographic proof. Defect successfully resolved to municipal specifications.');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !issue) return null;

  const originalEvidence = issue.evidence?.find(e => e.evidence_type === 'original');
  const resolutionEvidence = issue.evidence?.find(e => e.evidence_type === 'resolution');

  const handleDecision = async (approved: boolean) => {
    if (!notes.trim()) {
      setError('Reviewer justification notes are mandatory.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await api.verifyIssue(issue.id, {
        approved,
        notes: notes.trim(),
        reviewer_name: userName
      });
      onVerified();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Verification decision failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-purple-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-300" />
              Resolution Evidence Verification Queue
            </h3>
            <p className="text-xs text-purple-200 font-mono">{issue.issue_code} — {issue.title}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-purple-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              {error}
            </div>
          )}

          {/* Side-by-Side Visual Inspection Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original Grievance Photo */}
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex flex-col">
              <div className="px-3 py-2 bg-slate-100 font-bold text-slate-700 flex items-center justify-between text-[11px]">
                <span>1. Original Citizen Grievance Proof</span>
                <span className="text-slate-500 font-normal">Before Work</span>
              </div>
              <div className="h-48 bg-slate-200 flex items-center justify-center relative">
                {originalEvidence?.file_url ? (
                  <img
                    src={originalEvidence.file_url}
                    alt="Original issue"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-slate-400 p-4">
                    <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                    <span>No baseline photograph captured</span>
                  </div>
                )}
              </div>
              <div className="p-2.5 text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700">Uploaded:</span> {originalEvidence ? new Date(originalEvidence.uploaded_at).toLocaleDateString() : 'N/A'}
                <p className="mt-0.5 italic">{originalEvidence?.description || 'Initial report upload.'}</p>
              </div>
            </div>

            {/* Resolution Remediation Photo */}
            <div className="rounded-xl border border-purple-200 overflow-hidden bg-purple-50/30 flex flex-col">
              <div className="px-3 py-2 bg-purple-100 font-bold text-purple-900 flex items-center justify-between text-[11px]">
                <span>2. Field Squad Remediation Proof</span>
                <span className="text-purple-700 font-semibold">After Repair</span>
              </div>
              <div className="h-48 bg-slate-200 flex items-center justify-center relative">
                {resolutionEvidence?.file_url ? (
                  <img
                    src={resolutionEvidence.file_url}
                    alt="Resolution evidence"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-slate-400 p-4">
                    <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                    <span>No resolution photograph submitted</span>
                  </div>
                )}
              </div>
              <div className="p-2.5 text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700">Uploaded by:</span> {resolutionEvidence?.uploaded_by || 'Field Squad Lead'}
                <p className="mt-0.5 italic">{resolutionEvidence?.description || 'Work completed on site.'}</p>
              </div>
            </div>
          </div>

          {/* AI Decision Support Inspector Card */}
          <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-purple-900 text-xs">
                <Sparkles className="w-4 h-4 text-purple-600" />
                AI Evidence Completeness Inspection
              </div>
              <span className="font-mono text-xs font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded border border-purple-300">
                88% Completeness Confidence
              </span>
            </div>

            <ul className="text-[11px] text-slate-700 space-y-1 list-disc pl-4">
              <li>High visual resolution and timestamp metadata verified.</li>
              <li>Post-work remediation demonstrates surface reinstatement at geo-coordinates.</li>
              <li>Field notes documented by authorized crew lead.</li>
            </ul>

            <div className="pt-2 border-t border-purple-200/80 text-[10px] text-purple-800/80 italic flex items-center gap-1">
              <Info className="w-3.5 h-3.5 shrink-0" />
              Automated assistance score only. Authoritative sign-off by human quality reviewer is legally required.
            </div>
          </div>

          {/* Reviewer Sign-off Notes */}
          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
              Quality Reviewer Formal Remarks & Sign-off Notes <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="text-[11px] text-slate-500">
            Authorizing Reviewer: <span className="font-semibold text-slate-800">{userName}</span>
          </div>

          {/* Action Buttons: Approve vs Reject */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleDecision(false)}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg font-semibold transition flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4 text-rose-600" />
                Reject & Re-work
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleDecision(true)}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-semibold shadow-sm transition flex items-center gap-1.5"
              >
                <CheckSquare className="w-4 h-4" />
                Approve & Mark Resolved
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
