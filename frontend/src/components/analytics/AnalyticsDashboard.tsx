import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { AnalyticsSummary, RecurrenceData } from '../../services/types';
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import {
  BarChart3, Repeat, Sparkles, AlertTriangle,
  Building, CheckCircle2, Clock, Layers,
  RefreshCw, ShieldAlert, ArrowUpRight, Activity
} from 'lucide-react';

// Enterprise color system
const COLORS = {
  primaryNavy: '#17365D',
  deepNavy: '#102A43',
  primaryBlue: '#3973B9',
  lightBlue: '#EAF1F8',
  critical: '#DC2626',
  high: '#EA580C',
  medium: '#D69E2E',
  resolved: '#16845B',
  border: '#E2E8F0',
  textPrimary: '#1F2937',
  textSecondary: '#64748B'
};

// Coordinated blue palette for categories (darker for top volume, graded tones)
const CATEGORY_BLUES = [
  '#17365D',
  '#234B7D',
  '#31609E',
  '#3973B9',
  '#4E85C4',
  '#6798CF',
  '#84ACDB',
  '#A3C1E7'
];

// Enterprise status palette
const STATUS_PALETTE: Record<string, { label: string; color: string }> = {
  submitted: { label: 'Received', color: '#64748B' },
  under_review: { label: 'In Review', color: '#6366F1' },
  assigned: { label: 'Assigned', color: '#3973B9' },
  in_progress: { label: 'Work in Progress', color: '#0284C7' },
  awaiting_verification: { label: 'Inspection Pending', color: '#D69E2E' },
  resolved: { label: 'Resolved', color: '#16845B' },
  reopened: { label: 'Reopened', color: '#DC2626' },
  rejected: { label: 'Declined', color: '#94A3B8' }
};

// Enterprise priority palette
const PRIORITY_PALETTE: Record<string, { label: string; color: string }> = {
  CRITICAL: { label: 'Critical Hazard', color: '#DC2626' },
  HIGH: { label: 'High Urgency', color: '#EA580C' },
  MEDIUM: { label: 'Standard', color: '#D69E2E' },
  LOW: { label: 'Low Priority', color: '#16845B' }
};

const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const name = item.payload?.name || label || item.name;
    const value = item.value;
    return (
      <div className="bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-md text-xs">
        <p className="font-semibold text-slate-800">{name}</p>
        <div className="flex items-center justify-between gap-4 mt-1 text-slate-600">
          <span className="text-[11px] text-slate-500">Incidents:</span>
          <span className="font-mono font-bold text-slate-900">{value}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const AnalyticsDashboard: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [recurrence, setRecurrence] = useState<RecurrenceData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.getAnalyticsSummary(),
      api.getRecurringAnalysis()
    ]).then(([sumData, recData]) => {
      setSummary(sumData);
      setRecurrence(recData);
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading || !summary) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
        <BarChart3 className="w-8 h-8 text-[#17365D] mx-auto animate-pulse" />
        <p className="text-sm font-medium text-slate-700">Calculating live municipal intelligence metrics...</p>
        <p className="text-xs text-slate-400">Aggregating incident distributions, department workloads and chronic clusters</p>
      </div>
    );
  }

  const { metrics, distributions, executive_digest } = summary;

  // 1. Sort categories descending for clean comparison
  const sortedCategories = [...distributions.by_category].sort((a, b) => b.value - a.value);

  // 2. Structured priorities in analytical order
  const priorityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const sortedPriorities = [...distributions.by_priority].sort(
    (a, b) => priorityOrder.indexOf(a.name) - priorityOrder.indexOf(b.name)
  );

  // 3. Departments sorted descending by active workload
  const sortedDepartments = [...distributions.by_department].sort((a, b) => b.value - a.value);

  // 4. Status breakdown calculations
  const totalStatusCount = distributions.by_status.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="space-y-5">
      {/* 1. Dashboard Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-1">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Civic Intelligence Analytics & Recurrence Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Operational workload allocation, category distributions, and chronic recurrence hotspots
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs transition"
          title="Refresh analytics data"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* 2. Environment / Data Status Strip */}
      <div className="px-4 py-2.5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>
            <strong className="text-slate-800">Operational Dataset:</strong> Derived from {metrics.total_issues} geocoded Pune municipal grievances (PMC & PCMC). All figures calculated in real time.
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
            Live DB Sync
          </span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="hidden sm:inline text-slate-500">Updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* 3. Executive Municipal Intelligence Digest */}
      <div className="p-4 sm:p-5 bg-[#102A43] text-white rounded-xl border border-[#17365D] shadow-sm space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-300 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            Executive Municipal Intelligence Digest
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Automated Synthesis • Safety & SLA Focus</span>
        </div>
        <p className="text-xs sm:text-sm font-normal leading-relaxed text-slate-200">
          {executive_digest}
        </p>
      </div>

      {/* 4. KPI Summary Cards (Executive-Level Presentation) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1 */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Active Incident Load</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-[#17365D]">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-slate-900">
              {metrics.open_issues}
              <span className="text-sm font-normal text-slate-400 font-sans ml-1.5">/ {metrics.total_issues}</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center justify-between">
              <span>Under active resolution</span>
              <span className="font-semibold text-[#17365D]">
                {Math.round((metrics.open_issues / (metrics.total_issues || 1)) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Critical Hazards</span>
            <div className="p-1.5 rounded-lg bg-red-50 text-[#DC2626]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-[#DC2626]">
              {metrics.critical_issues}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center justify-between">
              <span>Immediate SLA window</span>
              <span className="font-semibold text-rose-700">24h Priority</span>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Awaiting Sign-Off</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-[#D69E2E]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-[#D69E2E]">
              {metrics.awaiting_verification}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center justify-between">
              <span>Remediation proof filed</span>
              <span className="font-semibold text-amber-700">Audit Ready</span>
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Chronic Hotspots</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-[#17365D]">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-slate-900">
              {metrics.recurring_issues}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center justify-between">
              <span>Repeated defect spots</span>
              <span className="font-semibold text-[#17365D] font-mono">120m Gate</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Chart Row 1: Issue Volume & Priority Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart A: Issue Volume by Civic Category */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#17365D]" />
                Issue Volume by Civic Category
              </h3>
              <span className="text-[11px] font-medium text-slate-500">
                {sortedCategories.length} Categories
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked distribution of citizen grievances across municipal service sectors
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedCategories}
                layout="vertical"
                margin={{ top: 5, right: 24, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={145}
                  tick={{ fontSize: 11, fill: '#334155', fontWeight: 500 }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18}>
                  {sortedCategories.map((entry, idx) => (
                    <Cell
                      key={`cat-${idx}`}
                      fill={CATEGORY_BLUES[idx % CATEGORY_BLUES.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Primary Driver: <strong className="text-slate-800">{sortedCategories[0]?.name || 'N/A'}</strong> ({sortedCategories[0]?.value || 0} incidents)</span>
            <span className="text-slate-400 font-mono">Sorted Descending</span>
          </div>
        </div>

        {/* Chart B: Operational Priority Distribution */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#EA580C]" />
                Operational Priority Distribution
              </h3>
              <span className="text-[11px] font-medium text-slate-500">
                4 Severity Levels
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Incident count categorized by transparent risk factors and turnaround SLAs
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedPriorities}
                margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#334155', fontWeight: 500 }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={42}>
                  {sortedPriorities.map((entry, idx) => (
                    <Cell
                      key={`prio-${idx}`}
                      fill={PRIORITY_PALETTE[entry.name]?.color || '#64748B'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Critical & High: <strong className="text-slate-800">{metrics.critical_issues + metrics.high_priority_issues}</strong> issues requiring accelerated dispatch</span>
            <span className="text-slate-400 font-mono">Turnaround: 24h–96h</span>
          </div>
        </div>
      </div>

      {/* 6. Chart Row 2: Department Workload & Lifecycle Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart C: Department Workload & Jurisdictions */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Building className="w-4 h-4 text-[#17365D]" />
                Department Workload & Jurisdictions
              </h3>
              <span className="text-[11px] font-medium text-slate-500">
                {sortedDepartments.length} Agencies
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Current active grievance routing and crew assignments across city divisions
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedDepartments}
                layout="vertical"
                margin={{ top: 5, right: 24, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={150}
                  tick={{ fontSize: 11, fill: '#334155', fontWeight: 500 }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18}>
                  {sortedDepartments.map((entry, idx) => (
                    <Cell
                      key={`dept-${idx}`}
                      fill={idx === 0 ? '#17365D' : '#3973B9'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Highest Assignment: <strong className="text-slate-800">{sortedDepartments[0]?.name || 'N/A'}</strong></span>
            <span className="text-slate-400 font-mono">Capacity Monitored</span>
          </div>
        </div>

        {/* Chart D: Incident Lifecycle Status Breakdown */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16845B]" />
                Incident Lifecycle Status Breakdown
              </h3>
              <span className="text-[11px] font-medium text-slate-500">
                {distributions.by_status.length} States
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              End-to-end progression of logged incidents from submission through verification
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 h-64">
            {/* Donut with centered metric */}
            <div className="relative w-full sm:w-1/2 h-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributions.by_status}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {distributions.by_status.map((entry, index) => {
                      const cfg = STATUS_PALETTE[entry.key] || { color: '#64748B' };
                      return <Cell key={`status-${index}`} fill={cfg.color} />;
                    })}
                  </Pie>
                  <Tooltip content={<CustomChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Centered Total Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold font-mono text-slate-900 leading-none">
                  {totalStatusCount}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-1">
                  Total
                </span>
              </div>
            </div>

            {/* Structured Compact Legend with Counts & Percentages */}
            <div className="w-full sm:w-1/2 space-y-1.5 overflow-y-auto max-h-56 pr-1 text-xs">
              {distributions.by_status.map((entry, idx) => {
                const cfg = STATUS_PALETTE[entry.key] || { label: entry.name, color: '#64748B' };
                const pct = Math.round((entry.value / (totalStatusCount || 1)) * 100);
                return (
                  <div key={idx} className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-50 text-[11px] transition">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                      <span className="text-slate-700 truncate">{entry.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-slate-600 shrink-0 ml-2">
                      <span className="font-semibold text-slate-800">{entry.value}</span>
                      <span className="text-slate-400 text-[10px] w-8 text-right">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Verified Resolutions: <strong className="text-slate-800">{metrics.resolved_issues}</strong> ({Math.round((metrics.resolved_issues / (metrics.total_issues || 1)) * 100)}%)</span>
            <span className="text-slate-400 font-mono">Strict State Machine</span>
          </div>
        </div>
      </div>

      {/* 7. Spatio-Temporal Chronic Recurrence Hotspots Table */}
      {recurrence && recurrence.hotspots.length > 0 && (
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Repeat className="w-4 h-4 text-[#17365D]" />
                Spatio-Temporal Chronic Recurrence Hotspots
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Geographic defect clusters occurring repeatedly within a 120-meter perimeter across inspection cycles
              </p>
            </div>
            <span className="text-xs font-semibold text-[#17365D] bg-[#EAF1F8] px-2.5 py-1 rounded-lg border border-[#C8DCF0] font-mono">
              {recurrence.hotspot_count} Chronic Clusters Identified
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 text-slate-600 border-b border-slate-200 text-[11px] font-semibold">
                  <th className="py-2.5 px-3.5">Cluster ID</th>
                  <th className="py-2.5 px-3.5">Locality & Ward</th>
                  <th className="py-2.5 px-3.5">Category</th>
                  <th className="py-2.5 px-3.5 text-center">Recurrence</th>
                  <th className="py-2.5 px-3.5">Incident Codes</th>
                  <th className="py-2.5 px-3.5">Municipal Action Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {recurrence.hotspots.map((hs) => (
                  <tr key={hs.cluster_id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3.5 font-mono font-semibold text-[#17365D]">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
                        {hs.cluster_id}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 font-medium text-slate-800">
                      {hs.locality} <span className="text-slate-400 font-normal">({hs.ward})</span>
                    </td>
                    <td className="py-2.5 px-3.5 capitalize text-slate-700">
                      {hs.category.replace('_', ' ')}
                    </td>
                    <td className="py-2.5 px-3.5 text-center font-mono">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {hs.incident_count}x repeat
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 font-mono text-[11px] text-slate-600">
                      <div className="flex items-center gap-1 flex-wrap">
                        {hs.issue_codes.map((code) => (
                          <span key={code} className="bg-slate-50 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">
                            {code}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-600 text-[11px] leading-relaxed">
                      {hs.recommendation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
