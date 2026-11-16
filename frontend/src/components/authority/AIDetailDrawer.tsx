import React, { useState, useEffect } from 'react';
import { CivicIssue } from '../../services/types';
import { api } from '../../services/api';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { CategoryBadge } from '../common/CategoryBadge';
import {
  X, Sparkles, Clock, MapPin, Shield,
  Repeat, CheckCircle2, ChevronDown, ChevronUp,
  Maximize2, Eye, Camera, AlertCircle, Building2,
  CopyCheck, FileText, Info
} from 'lucide-react';

interface AIDetailDrawerProps {
  issue: CivicIssue | null;
  isOpen: boolean;
  onClose: () => void;
  onActionAssign?: (issue: CivicIssue) => void;
  onActionTransition?: (issue: CivicIssue) => void;
  onActionVerify?: (issue: CivicIssue) => void;
}

export const AIDetailDrawer: React.FC<AIDetailDrawerProps> = ({
  issue,
  isOpen,
  onClose,
  onActionAssign,
  onActionTransition,
  onActionVerify
}) => {
  const [summaryType, setSummaryType] = useState<'executive' | 'operational' | 'citizen_friendly'>('executive');
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Collapsible sections state
  const [showAllAudit, setShowAllAudit] = useState(false);
  const [showKeyPoints, setShowKeyPoints] = useState(false);
  const [showTechDetails, setShowTechDetails] = useState(false);

  // Lightbox preview for photos
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string; type: string } | null>(null);

  useEffect(() => {
    if (issue && isOpen) {
      setLoadingSummary(true);
      api.summarizeIssue(issue.id, summaryType)
        .then(res => setAiSummary(res))
        .catch(err => console.error(err))
        .finally(() => setLoadingSummary(false));
    }
  }, [issue, isOpen, summaryType]);

  // Reset toggles when issue changes
  useEffect(() => {
    setShowAllAudit(false);
    setShowKeyPoints(false);
    setShowTechDetails(false);
    setPreviewImage(null);
  }, [issue?.id]);

  if (!isOpen || !issue) return null;

  // Format category name for clean readability
  const categoryLabel = issue.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  // Priority level label mapping
  const getPriorityLabel = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'critical':
        return 'URGENT – HAZARD';
      case 'high':
        return 'HIGH URGENCY';
      case 'medium':
        return 'STANDARD';
      case 'low':
        return 'LOW PRIORITY';
      default:
        return level?.toUpperCase() || 'STANDARD';
    }
  };

  // Audit trail slices: recent 2-3 vs complete
  const allHistory = issue.status_history || [];
  const recentHistory = allHistory.slice(-3).reverse(); // latest first
  const displayHistory = showAllAudit ? [...allHistory].reverse() : recentHistory;

  // Score color helper
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-red-600';
    if (score >= 60) return 'bg-orange-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-emerald-600';
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
        <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden">
          
          {/* ================================================================= */}
          {/* 1. COMPACT HEADER */}
          {/* ================================================================= */}
          <div className="px-5 py-3.5 bg-[#17365D] text-white flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold tracking-wide uppercase text-white">
                    Civic Intelligence & Audit Profile
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-sky-400/20 text-sky-200 font-mono text-[11px] font-semibold tracking-wider">
                    {issue.issue_code}
                  </span>
                </div>
                <p className="text-[10px] text-sky-200/80">Municipal Grievance Case Management • Pune</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Close Profile (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Action Bar for Authority Operators (Preserved functionality) */}
          {(onActionAssign || onActionTransition || (issue.status === 'awaiting_verification' && onActionVerify)) && (
            <div className="px-5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
              <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" /> Administrative Actions:
              </span>
              <div className="flex items-center gap-2">
                {onActionAssign && (
                  <button
                    onClick={() => onActionAssign(issue)}
                    className="px-2.5 py-1 bg-[#17365D] text-white text-[11px] rounded-md font-medium hover:bg-[#102A43] transition flex items-center gap-1 shadow-xs"
                  >
                    <Building2 className="w-3 h-3" /> Assign Unit
                  </button>
                )}
                {onActionTransition && (
                  <button
                    onClick={() => onActionTransition(issue)}
                    className="px-2.5 py-1 bg-white text-slate-700 text-[11px] border border-slate-300 rounded-md font-medium hover:bg-slate-100 transition shadow-xs"
                  >
                    Change Status
                  </button>
                )}
                {issue.status === 'awaiting_verification' && onActionVerify && (
                  <button
                    onClick={() => onActionVerify(issue)}
                    className="px-2.5 py-1 bg-purple-600 text-white text-[11px] rounded-md font-medium hover:bg-purple-700 transition flex items-center gap-1 shadow-xs"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Verify Proof
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Main Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">

            {/* ================================================================= */}
            {/* 2. ISSUE SUMMARY – MOST IMPORTANT SECTION */}
            {/* ================================================================= */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3 shadow-xs">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-50 text-[#17365D] border border-sky-200/80">
                      {categoryLabel}
                    </span>
                    <PriorityBadge level={issue.priority.priority_level} score={issue.priority.raw_score} size="sm" />
                  </div>
                  <StatusBadge status={issue.status} size="sm" />
                </div>

                <h1 className="text-sm font-bold text-slate-900 leading-snug pt-0.5">
                  {issue.title}
                </h1>
              </div>

              {/* Location Bar */}
              <div className="flex items-start gap-2 p-2.5 bg-slate-50/80 rounded-md border border-slate-200 text-[11px] text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-[#3973B9] shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <span className="font-medium text-slate-900">{issue.location.address}</span>
                  <span className="text-slate-500">, {issue.location.locality}, {issue.location.ward}, Pune</span>
                  {issue.location.landmark && (
                    <span className="text-slate-500 block text-[10px]">Landmark: {issue.location.landmark}</span>
                  )}
                </div>
                <span className="font-mono text-[10px] text-slate-400 shrink-0 self-center">
                  {issue.location.latitude.toFixed(4)}, {issue.location.longitude.toFixed(4)}
                </span>
              </div>
            </div>

            {/* Chronic Defect Spot Banner (if recurring) */}
            {issue.is_recurring && (
              <div className="p-3 bg-red-50/80 rounded-lg border border-red-200 flex items-start gap-2.5 text-[11px]">
                <Repeat className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-red-900">Chronic Infrastructure Defect Spot</span>
                  <p className="text-red-800 text-[11px] leading-relaxed">
                    {issue.recurrence_notes || `Repeated municipal defect identified (${issue.recurrence_count} occurrences within a 120-meter corridor). Requires underlying root-cause engineering.`}
                  </p>
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* 3. CIVICLENS INTELLIGENCE SUMMARY */}
            {/* ================================================================= */}
            <div className="bg-[#F8FAFC] rounded-lg border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#3973B9]" />
                  <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                    CivicLens Intelligence Summary
                  </h4>
                  <span className="text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    AI Advisory
                  </span>
                </div>

                {/* Compact Segmented Perspective Selector */}
                <div className="inline-flex bg-slate-200/80 p-0.5 rounded-md text-[10px]">
                  {(['executive', 'operational', 'citizen_friendly'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setSummaryType(mode)}
                      className={`px-2 py-0.5 rounded font-medium transition-all ${
                        summaryType === mode
                          ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {mode === 'citizen_friendly' ? 'Citizen' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Narrative Briefing */}
              {loadingSummary ? (
                <div className="py-3 text-center text-slate-400 animate-pulse text-[11px]">
                  Synthesizing operational intelligence briefing...
                </div>
              ) : aiSummary ? (
                <div className="space-y-2.5">
                  <p className="text-[11px] text-slate-700 leading-relaxed font-normal bg-white p-3 rounded-md border border-slate-200/80">
                    {aiSummary.summary}
                  </p>

                  {/* 3 Key Operational Assessment Indicators */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="p-2.5 bg-white rounded-md border border-slate-200 space-y-0.5">
                      <span className="text-[10px] font-medium text-slate-500 block uppercase tracking-wider">
                        Impact & SLA
                      </span>
                      <div className="text-[11px] font-bold text-slate-800 flex items-center justify-between">
                        <span className="capitalize">{issue.priority.priority_level}</span>
                        <span className="text-slate-500 font-mono text-[10px] font-normal">{issue.priority.sla_deadline_hours}h SLA</span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-white rounded-md border border-slate-200 space-y-0.5">
                      <span className="text-[10px] font-medium text-slate-500 block uppercase tracking-wider">
                        Assigned Unit
                      </span>
                      <div className="text-[11px] font-bold text-slate-800 truncate" title={issue.assigned_department_name || 'Pending'}>
                        {issue.assigned_department_name || 'Pending Dispatch'}
                      </div>
                    </div>

                    <div className="p-2.5 bg-white rounded-md border border-slate-200 space-y-0.5">
                      <span className="text-[10px] font-medium text-slate-500 block uppercase tracking-wider">
                        Duplicate Check
                      </span>
                      <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                        <CopyCheck className="w-3 h-3 text-emerald-600" />
                        <span>
                          {issue.duplicate_candidates && issue.duplicate_candidates.length > 0
                            ? `${issue.duplicate_candidates.length} candidate(s)`
                            : 'No duplicates'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Key Highlights */}
                  {aiSummary.key_points && aiSummary.key_points.length > 0 && (
                    <div className="pt-1">
                      <button
                        onClick={() => setShowKeyPoints(!showKeyPoints)}
                        className="text-[10px] text-[#3973B9] hover:text-[#17365D] font-medium flex items-center gap-1 transition-colors"
                      >
                        {showKeyPoints ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {showKeyPoints ? 'Hide operational highlights' : 'View operational highlights'}
                      </button>
                      {showKeyPoints && (
                        <ul className="mt-2 space-y-1 list-disc pl-4 text-[10px] text-slate-600 bg-white p-2.5 rounded border border-slate-200">
                          {aiSummary.key_points.map((pt: string, idx: number) => (
                            <li key={idx} className="leading-relaxed">{pt}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* ================================================================= */}
            {/* 4. PRIORITY SCORE */}
            {/* ================================================================= */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                  Priority Score
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    issue.priority.priority_level === 'critical'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : issue.priority.priority_level === 'high'
                      ? 'bg-orange-50 text-orange-700 border-orange-200'
                      : issue.priority.priority_level === 'medium'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {getPriorityLabel(issue.priority.priority_level)}
                </span>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                  {issue.priority.raw_score}
                </span>
                <span className="text-xs font-mono text-slate-400">/ 100</span>
              </div>

              {/* Subtle Progress Indicator */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/60">
                <div
                  className={`h-full transition-all duration-500 ${getScoreColor(issue.priority.raw_score)}`}
                  style={{ width: `${Math.min(100, Math.max(5, issue.priority.raw_score))}%` }}
                />
              </div>
            </div>

            {/* ================================================================= */}
            {/* 5. PHOTOGRAPHIC EVIDENCE (Compact Gallery) */}
            {/* ================================================================= */}
            {issue.evidence && issue.evidence.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-slate-500" />
                    <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                      Photographic Evidence ({issue.evidence.length})
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400">Click thumbnail to expand</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {issue.evidence.map(e => (
                    <div
                      key={e.id}
                      onClick={() => setPreviewImage({ url: e.file_url, title: e.description || 'Evidence Photo', type: e.evidence_type })}
                      className="group relative rounded-md border border-slate-200 overflow-hidden bg-slate-50 cursor-pointer hover:border-[#3973B9] transition shadow-2xs"
                    >
                      <div className="h-24 w-full overflow-hidden bg-slate-100 relative">
                        <img
                          src={e.file_url}
                          alt={e.description || 'Evidence'}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors flex items-center justify-center">
                          <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                        </div>
                      </div>
                      <div className="p-1.5 bg-white border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <span className="font-semibold uppercase tracking-wider text-slate-700 text-[9px] bg-slate-100 px-1 py-0.5 rounded">
                          {e.evidence_type}
                        </span>
                        <span className="text-slate-400 text-[9px] truncate max-w-[100px]">
                          {e.uploaded_by}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* 6. COMPLETE AUDIT TRAIL / ACTIVITY */}
            {/* ================================================================= */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                    {showAllAudit ? `Complete Audit Trail (${allHistory.length})` : 'Recent Audit Activity'}
                  </h4>
                </div>
                {allHistory.length > 3 && (
                  <button
                    onClick={() => setShowAllAudit(!showAllAudit)}
                    className="text-[10px] text-[#3973B9] hover:text-[#17365D] font-medium flex items-center gap-1 transition-colors"
                  >
                    {showAllAudit ? 'Show recent only' : `Show all (${allHistory.length})`}
                  </button>
                )}
              </div>

              {displayHistory.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic py-2">No lifecycle audit records available.</p>
              ) : (
                <div className="relative border-l border-slate-200 pl-3.5 ml-1.5 space-y-3">
                  {displayHistory.map((hist, idx) => (
                    <div key={idx} className="relative group">
                      {/* Timeline dot */}
                      <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-[#17365D] group-hover:border-[#3973B9] transition-colors" />
                      
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-bold text-[11px] text-slate-800 uppercase tracking-wider">
                          {hist.to_status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {new Date(hist.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-500">
                        <span className="font-medium text-slate-700">{hist.changed_by}</span>
                        <span className="text-slate-400"> • {hist.role}</span>
                      </div>

                      {hist.reason && (
                        <p className="text-[10px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100 mt-1 italic">
                          "{hist.reason}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ================================================================= */}
            {/* 7. ORGANIZED SECONDARY / TECHNICAL DETAILS (Collapsible) */}
            {/* ================================================================= */}
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 space-y-2">
              <button
                onClick={() => setShowTechDetails(!showTechDetails)}
                className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-700 hover:text-slate-900 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-400" /> Technical Metadata & Verification Schema
                </span>
                {showTechDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showTechDetails && (
                <div className="pt-2 border-t border-slate-200 space-y-1.5 text-[10px] font-mono text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Database Entity ID:</span>
                    <span className="text-slate-800">{issue.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">GIS Geocoordinates:</span>
                    <span className="text-slate-800">[{issue.location.latitude}, {issue.location.longitude}]</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Created Timestamp:</span>
                    <span className="text-slate-800">{new Date(issue.created_at).toISOString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">SLA Target Deadline:</span>
                    <span className="text-slate-800">{issue.sla_deadline ? new Date(issue.sla_deadline).toISOString() : 'Standard 48h'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Community Confirmations:</span>
                    <span className="text-slate-800">{issue.community_confirmations} citizen upvotes</span>
                  </div>
                  {aiSummary?.generated_by && (
                    <div className="flex justify-between pt-1 border-t border-slate-200">
                      <span className="text-slate-400 font-sans">AI Extraction Engine:</span>
                      <span className="text-slate-800">{aiSummary.generated_by}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* FULL-SIZE PHOTOGRAPHIC EVIDENCE LIGHTBOX MODAL */}
      {/* ================================================================= */}
      {previewImage && (
        <div
          className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="max-w-2xl w-full bg-white rounded-xl overflow-hidden shadow-2xl border border-slate-800"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-4 py-3 bg-[#17365D] text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block">
                  {previewImage.type} Photographic Proof
                </span>
                <p className="text-[11px] text-sky-200">{previewImage.title}</p>
              </div>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-900 max-h-[70vh] flex items-center justify-center p-2">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[65vh] w-auto max-w-full object-contain rounded"
              />
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span className="truncate max-w-md">{previewImage.title}</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded text-[11px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
