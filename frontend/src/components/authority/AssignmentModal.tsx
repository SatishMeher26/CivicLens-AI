import React, { useState, useEffect } from 'react';
import { CivicIssue, Department } from '../../services/types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { X, Shield, Check, Sparkles, UserCheck, AlertCircle } from 'lucide-react';

interface AssignmentModalProps {
  issue: CivicIssue | null;
  isOpen: boolean;
  onClose: () => void;
  onAssigned: () => void;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  issue,
  isOpen,
  onClose,
  onAssigned
}) => {
  const { userName, role } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [officerName, setOfficerName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.getDepartments().then((depts) => {
        setDepartments(depts);
        if (issue) {
          setSelectedDeptId(issue.assigned_department_id || depts[0]?.id || '');
          setOfficerName(issue.assigned_officer || 'Zonal Duty Inspector');
        }
      });
    }
  }, [isOpen, issue]);

  if (!isOpen || !issue) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeptId) return;

    setSubmitting(true);
    setError('');
    try {
      await api.assignIssue(issue.id, {
        department_id: selectedDeptId,
        assigned_officer: officerName,
        notes: notes || undefined,
        changed_by: userName,
        role: role
      });
      onAssigned();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Assignment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDept = departments.find(d => d.id === selectedDeptId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-[#173B65] text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <Shield className="w-4 h-4 text-sky-400" />
              Assign to Municipal Department
            </h3>
            <p className="text-xs text-sky-200">{issue.issue_code} — {issue.title.slice(0, 40)}...</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-300 hover:text-white" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              {error}
            </div>
          )}

          {/* AI Routing Recommendation Box */}
          <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-sky-900">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              Suggested Assignment (Decision Assistance)
            </div>
            <p className="text-slate-700 text-[11px] leading-relaxed">
              Based on standard municipal jurisdiction, problems in category <span className="font-semibold">{issue.category.replace('_', ' ')}</span> in <span className="font-semibold">{issue.location.ward}</span> are handled by this division. You can select another department below if needed.
            </p>
          </div>

          {/* Department Selection */}
          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
              Municipal Department Division
            </label>
            <select
              required
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-sky-500"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code}) — SLA: {d.sla_hours_default}h
                </option>
              ))}
            </select>
          </div>

          {/* Officer in Charge */}
          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
              Field Squad Lead / Duty Officer
            </label>
            <input
              type="text"
              required
              value={officerName}
              onChange={(e) => setOfficerName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Dispatch Notes */}
          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
              Dispatch Instructions / Field Priority Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Expedited equipment mobilization needed due to adjacent school traffic."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Actor info */}
          <div className="text-[11px] text-slate-500 pt-1">
            Dispatching as: <span className="font-semibold text-slate-700">{userName} ({role})</span>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#173B65] hover:bg-navy-900 text-white rounded-lg font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              {submitting ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
