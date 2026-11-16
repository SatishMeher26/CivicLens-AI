import React from 'react';
import { PriorityLevel } from '../../services/types';
import { AlertCircle, AlertTriangle, ShieldCheck, Flame } from 'lucide-react';

interface PriorityBadgeProps {
  level: PriorityLevel;
  score?: number;
  showScore?: boolean;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ level, score, showScore = true, size = 'md' }) => {
  const py = size === 'sm' ? 'py-0.5' : 'py-0.5';
  const px = size === 'sm' ? 'px-2' : 'px-2.5';
  const textClass = size === 'sm' ? 'text-[11px]' : 'text-xs';
  const iconClass = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  switch (level) {
    case 'critical':
      return (
        <span
          title="Estimated high safety hazard. Planning estimate to help dispatchers prioritize."
          className={`inline-flex items-center gap-1 ${px} ${py} rounded-full ${textClass} font-semibold bg-red-100 text-red-800 border border-red-200 cursor-help`}
        >
          <Flame className={`${iconClass} text-red-600`} />
          <span>Urgent (Hazard)</span>
          {showScore && score !== undefined && <span className="opacity-75 font-mono">({score})</span>}
        </span>
      );
    case 'high':
      return (
        <span
          title="Estimated high civic impact. Target turnaround: 24h."
          className={`inline-flex items-center gap-1 ${px} ${py} rounded-full ${textClass} font-semibold bg-orange-100 text-orange-800 border border-orange-200 cursor-help`}
        >
          <AlertTriangle className={`${iconClass} text-orange-600`} />
          <span>High Urgency</span>
          {showScore && score !== undefined && <span className="opacity-75 font-mono">({score})</span>}
        </span>
      );
    case 'medium':
      return (
        <span
          title="Standard municipal repair queue. Target turnaround: 48h."
          className={`inline-flex items-center gap-1 ${px} ${py} rounded-full ${textClass} font-medium bg-amber-100 text-amber-800 border border-amber-200 cursor-help`}
        >
          <AlertCircle className={`${iconClass} text-amber-600`} />
          <span>Standard</span>
          {showScore && score !== undefined && <span className="opacity-75 font-mono">({score})</span>}
        </span>
      );
    case 'low':
    default:
      return (
        <span
          title="Routine civic maintenance. Target turnaround: 96h."
          className={`inline-flex items-center gap-1 ${px} ${py} rounded-full ${textClass} font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-help`}
        >
          <ShieldCheck className={`${iconClass} text-emerald-600`} />
          <span>Low Priority</span>
          {showScore && score !== undefined && <span className="opacity-75 font-mono">({score})</span>}
        </span>
      );
  }
};
