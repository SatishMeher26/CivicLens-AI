import React from 'react';
import { IssueStatus } from '../../services/types';

interface StatusBadgeProps {
  status: IssueStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<IssueStatus, { label: string; tooltip: string; bg: string; text: string; dot: string }> = {
  submitted: { label: 'Received', tooltip: 'Report logged by citizen and awaiting triage', bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },
  under_review: { label: 'In Review', tooltip: 'Under review by municipal operator', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  assigned: { label: 'Assigned', tooltip: 'Assigned to field division and officer', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  in_progress: { label: 'Work in Progress', tooltip: 'Field engineering crew deployed to site', bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  awaiting_verification: { label: 'Inspection Pending', tooltip: 'Work completed; awaiting quality sign-off', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  resolved: { label: 'Resolved', tooltip: 'Repair verified and closed', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  reopened: { label: 'Reopened', tooltip: 'Citizen requested follow-up inspection', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
  rejected: { label: 'Declined', tooltip: 'Report closed with recorded reason', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const conf = statusConfig[status] || {
    label: status,
    tooltip: status,
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    dot: 'bg-slate-400'
  };

  const py = size === 'sm' ? 'py-0.5' : 'py-1';
  const px = size === 'sm' ? 'px-2' : 'px-2.5';
  const textSize = size === 'sm' ? 'text-xs' : 'text-xs font-medium';

  return (
    <span
      title={conf.tooltip}
      className={`inline-flex items-center gap-1.5 ${py} ${px} rounded-full ${conf.bg} ${conf.text} ${textSize} border border-black/5 cursor-help`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${conf.dot} animate-pulse`} />
      {conf.label}
    </span>
  );
};
