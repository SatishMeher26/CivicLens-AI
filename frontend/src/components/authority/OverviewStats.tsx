import React from 'react';
import { AnalyticsSummary } from '../../services/types';
import {
  AlertTriangle, CheckCircle, Clock, Flame,
  Repeat, ShieldAlert, FileText, Layers
} from 'lucide-react';

interface OverviewStatsProps {
  summary: AnalyticsSummary | null;
  onFilterStatus?: (status: string) => void;
  onFilterPriority?: (priority: string) => void;
  onFilterRecurring?: () => void;
}

export const OverviewStats: React.FC<OverviewStatsProps> = ({
  summary,
  onFilterStatus,
  onFilterPriority,
  onFilterRecurring
}) => {
  if (!summary) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-24 bg-white rounded-xl border border-slate-200" />
        ))}
      </div>
    );
  }

  const { metrics } = summary;

  const stats = [
    {
      label: 'Total Incidents',
      value: metrics.total_issues,
      subtext: 'Across all 6 wards',
      icon: Layers,
      color: 'text-slate-700 bg-slate-100',
      action: undefined
    },
    {
      label: 'Active Queue',
      value: metrics.open_issues,
      subtext: 'Under triage / in progress',
      icon: Clock,
      color: 'text-blue-700 bg-blue-100',
      action: () => onFilterStatus && onFilterStatus('open')
    },
    {
      label: 'Critical & High',
      value: metrics.critical_issues + metrics.high_priority_issues,
      subtext: `${metrics.critical_issues} critical safety hazards`,
      icon: Flame,
      color: 'text-rose-700 bg-rose-100',
      action: () => onFilterPriority && onFilterPriority('critical')
    },
    {
      label: 'Awaiting Sign-off',
      value: metrics.awaiting_verification,
      subtext: 'Proof uploaded by crew',
      icon: CheckCircle,
      color: 'text-purple-700 bg-purple-100',
      action: () => onFilterStatus && onFilterStatus('awaiting_verification')
    },
    {
      label: 'Chronic Hotspots',
      value: metrics.recurring_issues,
      subtext: 'Repeat failures flagged',
      icon: Repeat,
      color: 'text-amber-700 bg-amber-100',
      action: onFilterRecurring
    },
    {
      label: 'SLA Overdue',
      value: metrics.overdue_issues,
      subtext: 'Turnaround deadline breach',
      icon: AlertTriangle,
      color: 'text-red-700 bg-red-100',
      action: undefined
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((st, i) => {
        const Icon = st.icon;
        return (
          <div
            key={i}
            onClick={st.action}
            className={`p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between transition ${
              st.action ? 'cursor-pointer hover:border-sky-400 hover:shadow-md' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{st.label}</span>
              <div className={`p-1.5 rounded-lg ${st.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-slate-900 font-mono">{st.value}</div>
              <div className="text-[11px] text-slate-500 truncate mt-0.5">{st.subtext}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
