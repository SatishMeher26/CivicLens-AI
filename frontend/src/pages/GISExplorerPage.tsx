import React, { useState, useEffect } from 'react';
import { CivicIssue } from '../services/types';
import { api } from '../services/api';
import { CivicMap } from '../components/gis/CivicMap';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { CategoryBadge } from '../components/common/CategoryBadge';
import {
  MapPin, Layers, Flame, RefreshCw,
  Search, Filter, RotateCcw
} from 'lucide-react';

interface GISExplorerPageProps {
  onSelectIssue: (issue: CivicIssue) => void;
}

export const GISExplorerPage: React.FC<GISExplorerPageProps> = ({ onSelectIssue }) => {
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null);
  const [loading, setLoading] = useState(true);

  // Synchronized Filter State
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);

  const fetchIssues = () => {
    setLoading(true);
    api.getIssues().then(data => {
      setIssues(data);
      if (data.length > 0 && !selectedIssue) {
        setSelectedIssue(data[0]);
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  // Filtered issues applied to both Map and Sidebar
  const filteredIssues = issues.filter(iss => {
    if (categoryFilter !== 'all' && iss.category !== categoryFilter) return false;
    if (priorityFilter !== 'all' && iss.priority.priority_level !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = (
        iss.title +
        iss.description +
        iss.issue_code +
        iss.location.address +
        iss.location.ward +
        iss.location.locality
      ).toLowerCase();
      if (!match.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* 1. GIS Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-0.5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#17365D]" />
            GIS Geospatial Intelligence & Incident Density
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time coordinate mapping with calculated priority density heatmaps across active municipal wards
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-[#17365D] bg-[#EAF1F8] px-2.5 py-1 rounded-lg border border-[#C8DCF0]">
            {filteredIssues.length} of {issues.length} Geocoded Points
          </span>
        </div>
      </div>

      {/* 2. Compact Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ward, street, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-[#3973B9] focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 font-medium outline-none focus:ring-2 focus:ring-[#3973B9]"
          >
            <option value="all">All Categories</option>
            <option value="roads_infrastructure">Roads & Infrastructure</option>
            <option value="drainage_flooding">Drainage & Flooding</option>
            <option value="solid_waste">Solid Waste</option>
            <option value="streetlighting">Streetlighting</option>
            <option value="water_supply">Water Supply</option>
            <option value="public_parks">Public Parks</option>
            <option value="traffic_signals">Traffic Signals</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 font-medium outline-none focus:ring-2 focus:ring-[#3973B9]"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical Hazard</option>
            <option value="high">High Urgency</option>
            <option value="medium">Standard</option>
            <option value="low">Low Priority</option>
          </select>
        </div>

        {/* Heatmap & Refresh Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              showHeatmap
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
            title="Toggle priority spatial density heatmap"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{showHeatmap ? 'Heatmap Active' : 'Show Density Heatmap'}</span>
          </button>

          <button
            onClick={fetchIssues}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
            title="Refresh map points"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Main Workspace: Map (67%) + Incident Panel (33%) with matched height */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left: GIS Map */}
        <div className="lg:col-span-8 h-[510px]">
          <CivicMap
            issues={filteredIssues}
            selectedIssue={selectedIssue}
            onSelectIssue={(iss) => {
              setSelectedIssue(iss);
              onSelectIssue(iss);
            }}
            height="100%"
            showFilters={false}
            filterCategory={categoryFilter}
            filterPriority={priorityFilter}
            showHeatmap={showHeatmap}
          />
        </div>

        {/* Right: Compact Ward Incidents List */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-[510px] overflow-hidden">
          {/* Panel Header */}
          <div className="px-3.5 py-3 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                Ward Incidents List
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Click an incident to focus on map</p>
            </div>
            <span className="font-mono text-[11px] font-semibold text-[#17365D] bg-white px-2 py-0.5 rounded border border-slate-200">
              {filteredIssues.length} Listed
            </span>
          </div>

          {/* Incident List Rows */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs animate-pulse">
                Loading geocoded incidents...
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-1">
                <p className="font-medium text-slate-600">No matching incidents found</p>
                <p className="text-[11px]">Adjust your filter criteria above</p>
              </div>
            ) : (
              filteredIssues.map((iss) => {
                const isSelected = selectedIssue?.id === iss.id;
                return (
                  <div
                    key={iss.id}
                    onClick={() => {
                      setSelectedIssue(iss);
                    }}
                    onDoubleClick={() => {
                      onSelectIssue(iss);
                    }}
                    className={`p-3 cursor-pointer transition flex flex-col gap-1.5 border-l-4 ${
                      isSelected
                        ? 'bg-[#EAF1F8]/80 border-[#17365D] shadow-2xs'
                        : 'border-transparent hover:bg-slate-50'
                    }`}
                  >
                    {/* Row Top: Code | Priority | Status */}
                    <div className="flex items-center justify-between gap-1.5 text-[11px]">
                      <span className="font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200/80">
                        {iss.issue_code}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <PriorityBadge level={iss.priority.priority_level} size="sm" showScore={false} />
                        <StatusBadge status={iss.status} size="sm" />
                      </div>
                    </div>

                    {/* Row Middle: Title */}
                    <h4 className="text-xs font-semibold text-slate-900 line-clamp-1 leading-snug">
                      {iss.title}
                    </h4>

                    {/* Row Bottom: Category & Location */}
                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 pt-0.5">
                      <CategoryBadge category={iss.category} size="sm" />
                      <div className="flex items-center gap-1 truncate text-slate-600 font-medium">
                        <MapPin className="w-3 h-3 text-[#3973B9] shrink-0" />
                        <span className="truncate">{iss.location.ward || iss.location.locality}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Panel Footer Context */}
          <div className="p-2.5 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Selected: <strong className="text-slate-800">{selectedIssue?.issue_code || 'None'}</strong></span>
            <button
              onClick={() => {
                if (selectedIssue) onSelectIssue(selectedIssue);
              }}
              disabled={!selectedIssue}
              className="text-[#3973B9] hover:underline font-semibold disabled:opacity-40"
            >
              Open Full Intelligence →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
