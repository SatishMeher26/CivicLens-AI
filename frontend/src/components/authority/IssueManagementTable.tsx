import React, { useState } from 'react';
import { CivicIssue, IssueStatus, PriorityLevel, IssueCategory } from '../../services/types';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { CategoryBadge } from '../common/CategoryBadge';
import {
  Search, Filter, ChevronRight, UserPlus,
  ArrowRightLeft, CheckSquare, Sparkles, Repeat, AlertCircle, Copy
} from 'lucide-react';

interface IssueManagementTableProps {
  issues: CivicIssue[];
  onSelectIssue: (issue: CivicIssue) => void;
  onAssign: (issue: CivicIssue) => void;
  onTransitionStatus: (issue: CivicIssue) => void;
  onVerify: (issue: CivicIssue) => void;
  onReviewDuplicates: (issue: CivicIssue) => void;
  onShowAIInsights: (issue: CivicIssue) => void;
}

export const IssueManagementTable: React.FC<IssueManagementTableProps> = ({
  issues,
  onSelectIssue,
  onAssign,
  onTransitionStatus,
  onVerify,
  onReviewDuplicates,
  onShowAIInsights
}) => {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [onlyRecurring, setOnlyRecurring] = useState(false);

  // Apply filtering
  const filtered = issues.filter((iss) => {
    if (filterCategory !== 'all' && iss.category !== filterCategory) return false;
    if (filterStatus !== 'all' && iss.status !== filterStatus) return false;
    if (filterPriority !== 'all' && iss.priority.priority_level !== filterPriority) return false;
    if (onlyRecurring && !iss.is_recurring) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchText = (
        iss.title +
        iss.issue_code +
        iss.description +
        iss.location.address +
        iss.location.ward +
        (iss.assigned_department_name || '')
      ).toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* Filtering Toolbar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by code, title, ward, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-700 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="awaiting_verification">Awaiting Verification</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-700 outline-none"
          >
            <option value="all">All Categories</option>
            <option value="roads_infrastructure">Roads</option>
            <option value="drainage_flooding">Drainage</option>
            <option value="solid_waste">Solid Waste</option>
            <option value="streetlighting">Lighting</option>
            <option value="water_supply">Water Supply</option>
            <option value="public_parks">Parks</option>
            <option value="traffic_signals">Traffic</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-700 outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <label className="flex items-center gap-1.5 cursor-pointer select-none px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-700">
            <input
              type="checkbox"
              checked={onlyRecurring}
              onChange={(e) => setOnlyRecurring(e.target.checked)}
              className="rounded text-sky-600 focus:ring-sky-500"
            />
            <span className="font-semibold text-rose-700 flex items-center gap-1">
              <Repeat className="w-3 h-3 text-rose-600" /> Recurring
            </span>
          </label>
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/80 text-slate-600 border-b border-slate-200 uppercase tracking-wider text-[11px] font-semibold">
              <th className="py-3 px-4">Code & Issue Summary</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3">Priority Impact</th>
              <th className="py-3 px-3">Lifecycle Status</th>
              <th className="py-3 px-3">Location / Ward</th>
              <th className="py-3 px-3">Assigned Unit</th>
              <th className="py-3 px-3 text-center">Duplicates</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  No issues found matching current criteria.
                </td>
              </tr>
            ) : (
              filtered.map((iss) => (
                <tr
                  key={iss.id}
                  onClick={() => onSelectIssue(iss)}
                  className="hover:bg-slate-50/80 transition cursor-pointer group"
                >
                  {/* Code & Summary */}
                  <td className="py-3 px-4 max-w-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-sky-900 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 text-[10px]">
                        {iss.issue_code}
                      </span>
                      {iss.is_recurring && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          {iss.recurrence_count}x Recurring
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-slate-900 mt-1 line-clamp-1 group-hover:text-blue-700 transition">
                      {iss.title}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <CategoryBadge category={iss.category} />
                  </td>

                  {/* Priority */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <PriorityBadge
                      level={iss.priority.priority_level}
                      score={iss.priority.raw_score}
                    />
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <StatusBadge status={iss.status} size="sm" />
                  </td>

                  {/* Ward / Location */}
                  <td className="py-3 px-3 text-slate-600 max-w-[140px] truncate">
                    <div className="font-medium text-slate-800 truncate">{iss.location.ward}</div>
                    <div className="text-[10px] text-slate-500 truncate">{iss.location.address}</div>
                  </td>

                  {/* Assigned Department */}
                  <td className="py-3 px-3 text-slate-600 max-w-[150px]">
                    <div className="font-medium text-slate-800 truncate">
                      {iss.assigned_department_name || <span className="text-amber-600 font-semibold italic">Unassigned</span>}
                    </div>
                    {iss.assigned_officer && (
                      <div className="text-[10px] text-slate-500 truncate">{iss.assigned_officer}</div>
                    )}
                  </td>

                  {/* Duplicates */}
                  <td className="py-3 px-3 text-center">
                    {iss.duplicate_candidates && iss.duplicate_candidates.length > 0 ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onReviewDuplicates(iss);
                        }}
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 transition inline-flex items-center gap-1 border border-amber-300"
                        title="Review duplicate candidates"
                      >
                        <Copy className="w-2.5 h-2.5" />
                        {iss.duplicate_candidates.length} Match
                      </button>
                    ) : (
                      <span className="text-slate-400 text-[10px]">0</span>
                    )}
                  </td>

                  {/* Actions Dropdown / Quick Buttons */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {/* Department Assignment Button */}
                      <button
                        onClick={() => onAssign(iss)}
                        className="p-1.5 text-slate-600 hover:text-sky-700 hover:bg-slate-100 rounded-md transition"
                        title="Assign Department"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                      </button>

                      {/* State Transition Button */}
                      <button
                        onClick={() => onTransitionStatus(iss)}
                        className="p-1.5 text-slate-600 hover:text-indigo-700 hover:bg-slate-100 rounded-md transition"
                        title="Update Lifecycle Status"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                      </button>

                      {/* Verify Resolution Proof Button (highlighted when awaiting verification) */}
                      {iss.status === 'awaiting_verification' && (
                        <button
                          onClick={() => onVerify(iss)}
                          className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-[11px] font-semibold transition flex items-center gap-1 shadow-sm"
                          title="Verify Resolution Proof"
                        >
                          <CheckSquare className="w-3 h-3" />
                          <span>Verify</span>
                        </button>
                      )}

                      {/* AI Intelligence Drawer Button */}
                      <button
                        onClick={() => onShowAIInsights(iss)}
                        className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-md transition"
                        title="AI Executive Insights"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
        <span>Showing {filtered.length} of {issues.length} total municipal issues</span>
        <span className="text-[11px]">Click any row for detailed triage and audit view</span>
      </div>
    </div>
  );
};
