import React, { useState } from 'react';
import { CivicIssue } from '../../services/types';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { CategoryBadge } from '../common/CategoryBadge';
import { MapPin, ThumbsUp, ArrowRight, Star } from 'lucide-react';
import { api } from '../../services/api';

interface CivicIssueCardProps {
  issue: CivicIssue;
  onSelect: (issue: CivicIssue) => void;
  onLocateOnMap?: (issue: CivicIssue) => void;
  onFeedbackRequest?: (issue: CivicIssue) => void;
}

export const CivicIssueCard: React.FC<CivicIssueCardProps> = ({
  issue,
  onSelect,
  onLocateOnMap,
  onFeedbackRequest
}) => {
  const [upvotes, setUpvotes] = useState(issue.community_confirmations);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [upvoting, setUpvoting] = useState(false);

  const handleUpvote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasUpvoted || upvoting) return;
    setUpvoting(true);
    try {
      const res = await api.confirmIssue(issue.id);
      setUpvotes(res.confirmations);
      setHasUpvoted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setUpvoting(false);
    }
  };

  const primaryImage = issue.evidence && issue.evidence.length > 0
    ? issue.evidence[0].file_url
    : null;

  return (
    <div
      onClick={() => onSelect(issue)}
      className="bg-white rounded-xl border border-slate-200/90 hover:border-sky-300 hover:shadow-md transition cursor-pointer p-3.5 flex flex-col justify-between gap-2.5 group"
    >
      {/* TOP ROW: Issue ID | Priority Badge | Status Badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60 shrink-0">
          {issue.issue_code}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <PriorityBadge level={issue.priority.priority_level} showScore={false} size="sm" />
          <StatusBadge status={issue.status} size="sm" />
        </div>
      </div>

      {/* MAIN ROW: Issue Title | Small Image Thumbnail (right side, 80-96px) */}
      <div className="flex items-start justify-between gap-3 min-h-[44px]">
        <h3 className="text-sm font-semibold text-slate-900 group-hover:text-sky-700 transition line-clamp-2 leading-snug flex-1">
          {issue.title}
        </h3>

        {primaryImage && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelect(issue);
            }}
            className="w-20 h-16 sm:w-24 sm:h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative group/thumb cursor-pointer"
            title="Click to view full image and details"
          >
            <img
              src={primaryImage}
              alt={issue.title}
              className="w-full h-full object-cover group-hover/thumb:scale-105 transition duration-200"
              loading="lazy"
            />
            {issue.evidence && issue.evidence.length > 1 && (
              <span className="absolute bottom-0.5 right-0.5 bg-black/65 text-white text-[9px] px-1 py-0.2 rounded font-medium">
                +{issue.evidence.length - 1}
              </span>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM ROW: Category | Location | Confirmation Count | Details */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <CategoryBadge category={issue.category} size="sm" />

          <div
            onClick={(e) => {
              if (onLocateOnMap) {
                e.stopPropagation();
                onLocateOnMap(issue);
              }
            }}
            className={`flex items-center gap-1 text-slate-500 hover:text-sky-700 text-[11px] truncate ${
              onLocateOnMap ? 'cursor-pointer hover:underline' : ''
            }`}
            title={`Location: ${issue.location.address}, ${issue.location.ward}`}
          >
            <MapPin className="w-3 h-3 text-sky-600 shrink-0" />
            <span className="truncate">{issue.location.ward || issue.location.locality || issue.location.address}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {issue.status === 'resolved' && onFeedbackRequest && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFeedbackRequest(issue);
              }}
              className="flex items-center gap-0.5 px-1.5 py-0.5 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 transition text-[11px] font-medium"
              title="Rate resolution quality"
            >
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span>{issue.citizen_feedback_rating ? `${issue.citizen_feedback_rating}★` : 'Rate'}</span>
            </button>
          )}

          <button
            onClick={handleUpvote}
            disabled={hasUpvoted || upvoting}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition font-medium ${
              hasUpvoted
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
            title="Confirm this issue affects your neighborhood"
          >
            <ThumbsUp className={`w-3 h-3 ${hasUpvoted ? 'fill-blue-600 text-blue-600' : 'text-slate-500'}`} />
            <span>{upvotes}</span>
          </button>

          <span className="text-sky-600 font-medium text-xs flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
            <span>Details</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};
