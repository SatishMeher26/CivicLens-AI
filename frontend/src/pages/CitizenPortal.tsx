import React, { useState, useEffect, useMemo } from 'react';
import { CivicIssue, IssueCategory, PriorityLevel, IssueStatus } from '../services/types';
import { api } from '../services/api';
import { CivicIssueCard } from '../components/citizen/CivicIssueCard';
import { CivicMap } from '../components/gis/CivicMap';
import {
  Search, PlusCircle, Grid, Map, AlertCircle, RefreshCw,
  ArrowRight, ArrowLeft, Camera, MapPin, FileText,
  Shield, Droplets, Trash2, Lightbulb, Construction,
  Landmark, Sparkles, Filter, CheckCircle2, ChevronRight
} from 'lucide-react';

interface CitizenPortalProps {
  onOpenReport: () => void;
  onOpenTrack: () => void;
  onSelectIssue: (issue: CivicIssue) => void;
  onFeedbackRequest: (issue: CivicIssue) => void;
}

const PUNE_AREAS = [
  'All Wards',
  'Shivajinagar',
  'Kothrud',
  'Baner',
  'Aundh',
  'Deccan Gymkhana',
  'Hinjawadi',
  'Viman Nagar',
  'Hadapsar',
  'Koregaon Park',
  'Swargate',
  'Kharadi',
  'Kondhwa',
  'Pimple Saudagar'
];

const PUNE_LANDMARKS = [
  {
    name: 'Shaniwar Wada',
    title: 'Historic Peshwa Fortification',
    image: 'https://upload.wikimedia.org/wikipedia/commons/0/06/Shaniwar_Wada_Fort_Pune.jpg',
    locality: 'Kasba Peth, Pune'
  },
  {
    name: 'Aga Khan Palace',
    title: 'National Heritage Monument',
    image: 'https://upload.wikimedia.org/wikipedia/commons/2/21/AgaKhan_Palace.jpg',
    locality: 'Kalyani Nagar, Pune'
  },
  {
    name: 'Sinhagad Fort',
    title: 'Historic Sahyadri Hill Fortress',
    image: 'https://upload.wikimedia.org/wikipedia/commons/f/f5/Sinhagad.jpg',
    locality: 'Haveli, Pune'
  },
  {
    name: 'Dagdusheth Halwai Temple',
    title: 'Cultural Spiritual Landmark',
    image: 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Dagdusheth_Halwai_Temple.JPG',
    locality: 'Budhwar Peth, Pune'
  }
];

export const CitizenPortal: React.FC<CitizenPortalProps> = ({
  onOpenReport,
  onOpenTrack,
  onSelectIssue,
  onFeedbackRequest
}) => {
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [loading, setLoading] = useState(true);

  // Portal view: 'landing' (attractive homepage) vs 'browse' (dedicated full complaints directory)
  const [currentView, setCurrentView] = useState<'landing' | 'browse'>('landing');

  // Filter and Browse States (for 'browse' view)
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedWard, setSelectedWard] = useState<string>('All Wards');
  const [sortBy, setSortBy] = useState<'urgency' | 'confirmations' | 'recent'>('recent');
  const [visibleCount, setVisibleCount] = useState<number>(9);

  const fetchIssues = () => {
    setLoading(true);
    api.getIssues()
      .then((data) => setIssues(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  // Filtered issues for the dedicated browse view
  const filteredIssues = useMemo(() => {
    return issues.filter((iss) => {
      if (categoryFilter !== 'all' && iss.category !== categoryFilter) return false;
      if (priorityFilter !== 'all' && iss.priority.priority_level !== priorityFilter) return false;
      if (statusFilter !== 'all' && iss.status !== statusFilter) return false;
      if (selectedWard !== 'All Wards') {
        const matchLoc = (iss.location.locality + ' ' + iss.location.ward + ' ' + iss.location.address).toLowerCase();
        if (!matchLoc.includes(selectedWard.toLowerCase())) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const match = (
          iss.title +
          ' ' +
          iss.description +
          ' ' +
          iss.issue_code +
          ' ' +
          iss.location.address +
          ' ' +
          iss.location.ward +
          ' ' +
          iss.location.locality
        ).toLowerCase();
        if (!match.includes(q)) return false;
      }
      return true;
    });
  }, [issues, categoryFilter, priorityFilter, statusFilter, selectedWard, search]);

  // Sorted issues
  const sortedIssues = useMemo(() => {
    return [...filteredIssues].sort((a, b) => {
      if (sortBy === 'confirmations') {
        return b.community_confirmations - a.community_confirmations;
      }
      if (sortBy === 'recent') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return b.priority.raw_score - a.priority.raw_score;
    });
  }, [filteredIssues, sortBy]);

  // 4-5 recent complaints for landing page preview
  const recentComplaints = useMemo(() => {
    const list = [...issues].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return list.slice(0, 4);
  }, [issues]);

  // =========================================================================
  // VIEW B: DEDICATED ALL COMPLAINTS BROWSING INTERFACE
  // =========================================================================
  if (currentView === 'browse') {
    return (
      <div className="space-y-5 animate-in fade-in duration-200">
        {/* Navigation Bar / Return Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setCurrentView('landing');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors text-xs font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Citizen Portal
            </button>
            <div className="h-5 w-px bg-slate-200 hidden sm:block" />
            <div>
              <h1 className="text-base font-bold text-slate-900">Pune Community Complaints Directory</h1>
              <p className="text-xs text-slate-500">
                Browse, track and confirm verified civic issues across Pune (PMC & PCMC)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenTrack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 transition shadow-2xs"
            >
              <Search className="w-3.5 h-3.5" /> Track Status
            </button>
            <button
              onClick={onOpenReport}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#07966B] hover:bg-[#06825c] text-white text-xs font-semibold transition shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Report Issue
            </button>
          </div>
        </div>

        {/* Filters and Search Toolbar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
          {/* Area Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
              Area:
            </span>
            {PUNE_AREAS.map((ward) => (
              <button
                key={ward}
                onClick={() => setSelectedWard(ward)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedWard === ward
                    ? 'bg-[#17365D] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {ward}
              </button>
            ))}
          </div>

          {/* Search + Category + Priority + Status + Sort + View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 pt-1">
            <div className="relative sm:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by ID, keyword, locality or street..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-[#3973B9] focus:border-[#3973B9] bg-slate-50/50"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:ring-2 focus:ring-[#3973B9]"
            >
              <option value="all">All Categories</option>
              <option value="roads_infrastructure">Roads & Footpaths</option>
              <option value="drainage_flooding">Drainage & Flooding</option>
              <option value="solid_waste">Garbage & Sanitation</option>
              <option value="streetlighting">Streetlights</option>
              <option value="water_supply">Water Supply</option>
              <option value="public_parks">Parks & Trees</option>
              <option value="traffic_signals">Traffic Signals</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:ring-2 focus:ring-[#3973B9]"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical / Hazard</option>
              <option value="high">High Urgency</option>
              <option value="medium">Standard</option>
              <option value="low">Low Priority</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:ring-2 focus:ring-[#3973B9]"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Received</option>
              <option value="under_review">In Review</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">Work in Progress</option>
              <option value="awaiting_verification">Inspection Pending</option>
              <option value="resolved">Resolved</option>
            </select>

            <div className="flex items-center gap-1.5">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:ring-2 focus:ring-[#3973B9]"
              >
                <option value="recent">Most Recent</option>
                <option value="urgency">Highest Urgency</option>
                <option value="confirmations">Most Confirmed</option>
              </select>

              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
                <button
                  onClick={() => setViewMode('grid')}
                  title="Card Grid"
                  className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  title="GIS Map View"
                  className={`p-1.5 rounded ${viewMode === 'map' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Map className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={fetchIssues}
                title="Refresh Grievances"
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Directory Summary Count */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span className="font-medium text-slate-700">
            Showing {Math.min(visibleCount, sortedIssues.length)} of {sortedIssues.length} issues
            {selectedWard !== 'All Wards' ? ` in ${selectedWard}` : ' across Pune'}
          </span>
          <span className="text-slate-400">
            {sortBy === 'recent' ? 'Ordered by latest reports' : sortBy === 'urgency' ? 'Ordered by priority' : 'Ordered by citizen confirmations'}
          </span>
        </div>

        {/* Issues Rendering: Map vs Grid */}
        {viewMode === 'map' ? (
          <CivicMap issues={sortedIssues} onSelectIssue={onSelectIssue} height="560px" />
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-white rounded-xl border border-slate-200" />
            ))}
          </div>
        ) : sortedIssues.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 space-y-3">
            <AlertCircle className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-700 text-sm">No complaints match your selected filters</p>
            <button
              onClick={() => {
                setSearch('');
                setCategoryFilter('all');
                setPriorityFilter('all');
                setStatusFilter('all');
                setSelectedWard('All Wards');
              }}
              className="text-xs text-[#3973B9] hover:underline font-semibold"
            >
              Reset all search filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {sortedIssues.slice(0, visibleCount).map((issue) => (
                <CivicIssueCard
                  key={issue.id}
                  issue={issue}
                  onSelect={onSelectIssue}
                  onLocateOnMap={(iss) => {
                    setViewMode('map');
                    onSelectIssue(iss);
                  }}
                  onFeedbackRequest={onFeedbackRequest}
                />
              ))}
            </div>

            {/* Load More Button */}
            {visibleCount < sortedIssues.length && (
              <div className="text-center pt-2">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 9)}
                  className="px-5 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition"
                >
                  Load More Complaints ({sortedIssues.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        )}

        <div className="md:hidden h-14" />
      </div>
    );
  }

  // =========================================================================
  // VIEW A: NEW CITIZEN PORTAL PUBLIC LANDING PAGE
  // =========================================================================
  return (
    <div className="space-y-8 animate-in fade-in duration-200 pb-12">
      
      {/* ===================================================================== */}
      {/* 1. PUNE HERO SECTION WITH AUTHENTIC PUNE PHOTOGRAPHY */}
      {/* ===================================================================== */}
      <section className="relative rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-[#102A43] text-white">
        {/* Subtle Background Photography Collage */}
        <div className="absolute inset-0 grid grid-cols-2 md:grid-cols-4 opacity-35 mix-blend-luminosity">
          {PUNE_LANDMARKS.map((lm, idx) => (
            <div key={idx} className="relative h-full overflow-hidden">
              <img
                src={lm.image}
                alt={lm.name}
                className="w-full h-full object-cover scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#102A43] via-transparent to-transparent opacity-80" />
            </div>
          ))}
        </div>

        {/* Navy Blue Gradient Overlay for High Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F2642]/95 via-[#17365D]/90 to-[#102A43]/80" />

        {/* Hero Content */}
        <div className="relative z-10 px-6 py-10 md:py-14 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-400/15 border border-sky-400/30 text-sky-200 text-xs font-semibold tracking-wide">
            <Landmark className="w-3.5 h-3.5 text-sky-300" />
            <span>Official Pune Municipal Civic Intelligence & Grievance Portal</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Your City. Your Voice. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-sky-200 to-emerald-300">
              Better Pune.
            </span>
          </h1>

          <p className="text-slate-200 text-sm md:text-base leading-relaxed max-w-2xl">
            Together, let's build a cleaner, safer and smarter Pune. Report civic issues, contribute
            to your community and help improve the city we call home across PMC and PCMC wards.
          </p>

          <div className="flex items-center flex-wrap gap-3 pt-2">
            <button
              onClick={onOpenReport}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#07966B] hover:bg-[#06825c] text-white text-sm font-semibold shadow-md transition transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              Report a Civic Issue
            </button>
            <button
              onClick={() => {
                setCurrentView('browse');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/20 transition backdrop-blur-xs"
            >
              <Search className="w-4 h-4 text-sky-300" />
              Browse Pune Complaints
              <ArrowRight className="w-4 h-4 text-sky-300" />
            </button>
          </div>

          {/* Pune Landmarks Subtle Ribbon */}
          <div className="pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {PUNE_LANDMARKS.map((lm, idx) => (
              <div key={idx} className="flex items-center gap-2 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span className="truncate font-medium text-slate-200">{lm.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 2. CIVIC AWARENESS / INFORMATIVE KNOWLEDGE SECTION */}
      {/* ===================================================================== */}
      <section className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#17365D]">
            <Sparkles className="w-4 h-4 text-[#3973B9]" />
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              Know Your City. Make a Difference.
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Active citizens create resilient cities. Timely reporting of civic defects allows municipal engineers
            and field divisions to resolve issues before they escalate.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card A: Road Safety */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-sm hover:border-[#3973B9]/40 transition space-y-2 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#17365D] border border-sky-200/60 flex items-center justify-center">
                <Construction className="w-4 h-4 text-[#3973B9]" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Road Safety</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Report potholes, damaged roads, broken footpaths and unsafe road conditions to help make neighbourhoods safer.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-semibold text-[#3973B9] flex items-center gap-1">
              <span>PMC Road Dept SLA: 24-48h</span>
            </div>
          </div>

          {/* Card B: Clean & Healthy Pune */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-sm hover:border-[#3973B9]/40 transition space-y-2 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Clean & Healthy Pune</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Help maintain clean surroundings by reporting garbage accumulation, overflowing bins and sanitation problems.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
              <span>Solid Waste Management</span>
            </div>
          </div>

          {/* Card C: Water & Drainage */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-sm hover:border-[#3973B9]/40 transition space-y-2 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 border border-blue-200/60 flex items-center justify-center">
                <Droplets className="w-4 h-4 text-[#3973B9]" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Water & Drainage</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Report water leakage, drainage blockages, sewage overflow and monsoon waterlogging in your locality.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-semibold text-[#17365D] flex items-center gap-1">
              <span>Stormwater & Drainage Division</span>
            </div>
          </div>

          {/* Card D: Public Infrastructure */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-sm hover:border-[#3973B9]/40 transition space-y-2 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/60 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Public Infrastructure</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Help improve public spaces by reporting broken streetlights, damaged public facilities and traffic signal issues.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-semibold text-amber-700 flex items-center gap-1">
              <span>Electrical & Traffic Wings</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 3. REPORT A PROBLEM – PRIMARY CALL TO ACTION */}
      {/* ===================================================================== */}
      <section className="bg-gradient-to-br from-slate-50 to-sky-50/40 rounded-2xl border border-slate-200 p-6 md:p-8 space-y-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#3973B9]">
              Fast, Transparent & Accountable
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">
              Report a Civic Problem
            </h2>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
              Notice something that needs attention? Share the details and help the concerned authorities take action.
            </p>
          </div>

          <button
            onClick={onOpenReport}
            className="self-start md:self-center px-6 py-3 rounded-xl bg-[#07966B] hover:bg-[#06825c] text-white text-sm font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 transform active:scale-95 shrink-0"
          >
            <PlusCircle className="w-5 h-5" />
            Report a Problem Now
          </button>
        </div>

        {/* 3 Step Explanation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 flex items-start gap-3 shadow-2xs">
            <div className="p-2 rounded-lg bg-sky-50 text-[#17365D] border border-sky-100 shrink-0">
              <Camera className="w-4 h-4 text-[#3973B9]" />
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 block">1. Take Photograph</span>
              <p className="text-[11px] text-slate-500 leading-tight">
                Attach clear photo evidence of the defect or hazard directly from your phone or device.
              </p>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 flex items-start gap-3 shadow-2xs">
            <div className="p-2 rounded-lg bg-sky-50 text-[#17365D] border border-sky-100 shrink-0">
              <MapPin className="w-4 h-4 text-[#3973B9]" />
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 block">2. Geotag Location</span>
              <p className="text-[11px] text-slate-500 leading-tight">
                Automatic GPS placement or choose from verified Pune localities and landmarks.
              </p>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 flex items-start gap-3 shadow-2xs">
            <div className="p-2 rounded-lg bg-sky-50 text-[#17365D] border border-sky-100 shrink-0">
              <FileText className="w-4 h-4 text-[#3973B9]" />
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 block">3. AI Triage & Routing</span>
              <p className="text-[11px] text-slate-500 leading-tight">
                Automated NLP classification routes complaints straight to the responsible municipal department.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 4. RECENT COMMUNITY ISSUES – SHOW ONLY 4–5 */}
      {/* ===================================================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Community Issues</h2>
            <p className="text-xs text-slate-500">
              Showing the latest verified community grievances reported across Pune
            </p>
          </div>

          <button
            onClick={() => {
              setCurrentView('browse');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#17365D] hover:text-[#3973B9] transition-colors"
          >
            <span>View All Complaints ({issues.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Display only 4-5 complaints on the landing page */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-white rounded-xl border border-slate-200" />
            ))}
          </div>
        ) : recentComplaints.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
            <p className="text-xs">No grievances reported yet in Pune. Be the first to report!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentComplaints.map((issue) => (
              <CivicIssueCard
                key={issue.id}
                issue={issue}
                onSelect={onSelectIssue}
                onLocateOnMap={(iss) => {
                  setCurrentView('browse');
                  setViewMode('map');
                  onSelectIssue(iss);
                }}
                onFeedbackRequest={onFeedbackRequest}
              />
            ))}
          </div>
        )}

        {/* 5. VIEW ALL COMPLAINTS CTA BUTTON */}
        <div className="text-center pt-3">
          <button
            onClick={() => {
              setCurrentView('browse');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-[#17365D] text-slate-800 hover:text-[#17365D] text-xs font-bold shadow-2xs hover:shadow-xs transition-all"
          >
            <span>View All Complaints ({issues.length})</span>
            <ArrowRight className="w-4 h-4 text-[#3973B9]" />
          </button>
        </div>
      </section>

      {/* Mobile bottom spacer */}
      <div className="md:hidden h-14" />
    </div>
  );
};
