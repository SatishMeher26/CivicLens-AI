import React, { useState } from 'react';
import { CivicIssue, DuplicateCandidate } from '../../services/types';
import {
  X, Copy, Check, MapPin, AlertTriangle,
  ArrowRight, ShieldCheck, Link2, Info, HelpCircle
} from 'lucide-react';
import { CategoryBadge } from '../common/CategoryBadge';
import { PriorityBadge } from '../common/PriorityBadge';

interface DuplicateReviewModalProps {
  issue: CivicIssue | null;
  isOpen: boolean;
  onClose: () => void;
  onCandidateHandled?: () => void;
}

export const DuplicateReviewModal: React.FC<DuplicateReviewModalProps> = ({
  issue,
  isOpen,
  onClose,
  onCandidateHandled
}) => {
  const [candidates, setCandidates] = useState<DuplicateCandidate[]>([]);
  const [resolvedIds, setResolvedIds] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (issue) {
      setCandidates(issue.duplicate_candidates || []);
      setResolvedIds({});
    }
  }, [issue]);

  if (!isOpen || !issue) return null;

  const handleAction = (candidateId: string, action: 'linked' | 'dismissed') => {
    setResolvedIds(prev => ({ ...prev, [candidateId]: action }));
    if (onCandidateHandled) onCandidateHandled();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 bg-amber-800 text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <Copy className="w-5 h-5 text-amber-300" />
              Review Possible Duplicate Reports
            </h3>
            <p className="text-xs text-amber-200">
              Check whether nearby complaints refer to the exact same physical issue
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-amber-200 hover:text-white" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
          {/* Policy disclaimer */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Human Staff Decision:</strong> CivicLens flags potential duplicates when reports are close together with similar descriptions. We never delete citizen reports. You decide whether to link them or keep them as separate tasks.
            </p>
          </div>

          {/* Primary Issue Summary Card */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Primary Issue Under Review</span>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-sky-900 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 text-[11px]">
                {issue.issue_code}
              </span>
              <PriorityBadge level={issue.priority.priority_level} score={issue.priority.raw_score} />
            </div>
            <h4 className="font-semibold text-slate-900 text-xs sm:text-sm">{issue.title}</h4>
            <p className="text-slate-600 text-[11px]">{issue.description}</p>
            <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{issue.location.address}, {issue.location.ward}</span>
            </div>
          </div>

          {/* Candidate List */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
              Matching Candidate Complaints ({candidates.length})
            </h4>

            {candidates.length === 0 ? (
              <p className="text-slate-400 italic py-4 text-center">No duplicate candidates flagged for this issue.</p>
            ) : (
              candidates.map((cand) => {
                const actionTaken = resolvedIds[cand.candidate_id];
                return (
                  <div
                    key={cand.candidate_id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-amber-300 transition shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        Matched Ticket: {cand.matched_issue_id}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded border border-amber-200">
                          {Math.round(cand.overall_confidence * 100)}% Similarity
                        </span>
                      </div>
                    </div>

                    <div className="font-semibold text-slate-900 text-xs sm:text-sm">{cand.matched_issue_title}</div>

                    {/* Signal Breakdown in Plain English */}
                    <div className="grid grid-cols-3 gap-2 p-2 bg-slate-50 rounded-lg text-center text-[10px]">
                      <div>
                        <span className="text-slate-400 block">Distance:</span>
                        <span className="font-bold text-slate-800">{Math.round(cand.distance_meters)} meters apart</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Word Match:</span>
                        <span className="font-bold text-slate-800">{Math.round(cand.text_similarity * 100)}% shared terms</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Category:</span>
                        <span className="font-bold text-slate-800">{cand.category_match ? 'Same Category' : 'Related'}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 italic bg-amber-50/60 p-2 rounded border border-amber-100">
                      Why flagged: {cand.reason}
                    </p>

                    {/* Actions */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      {actionTaken ? (
                        <span className="font-semibold text-emerald-700 flex items-center gap-1">
                          <Check className="w-4 h-4" /> Marked as {actionTaken === 'linked' ? 'Linked Duplicate' : 'Independent Defect'}
                        </span>
                      ) : (
                        <div className="flex items-center gap-2 ml-auto">
                          <button
                            type="button"
                            onClick={() => handleAction(cand.candidate_id, 'dismissed')}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium transition"
                          >
                            Keep Separate (Different Issue)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAction(cand.candidate_id, 'linked')}
                            className="px-3.5 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-white font-semibold transition flex items-center gap-1 shadow-xs"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                            Link as Duplicate
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
