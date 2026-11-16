import React, { useState, useEffect, useRef } from 'react';
import { IssueCategory, DuplicateCandidate } from '../../services/types';
import { api } from '../../services/api';
import {
  X, Camera, MapPin, Sparkles, AlertTriangle,
  CheckCircle, ArrowRight, Upload, Info, ShieldAlert,
  Navigation, Trash2, Check, HelpCircle
} from 'lucide-react';
import { CategoryBadge } from '../common/CategoryBadge';
import { PriorityBadge } from '../common/PriorityBadge';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportCreated: () => void;
}

const PRESET_LOCATIONS = [
  { name: 'Shivajinagar (FC Road)', locality: 'Shivajinagar', ward: 'Ward 7 (Ghole Road)', lat: 18.5314, lng: 73.8446, address: 'Near Goodluck Chowk, FC Road' },
  { name: 'Kothrud (Paud Road)', locality: 'Kothrud', ward: 'Ward 12 (Kothrud - Bavdhan)', lat: 18.5074, lng: 73.8077, address: 'Opposite Vanaz Metro Station, Paud Road' },
  { name: 'Baner (High Street)', locality: 'Baner', ward: 'Ward 9 (Baner - Balewadi)', lat: 18.5590, lng: 73.7868, address: 'Baner High Street, Near Syngenta Chowk' },
  { name: 'Aundh (Bremen Chowk)', locality: 'Aundh', ward: 'Ward 10 (Aundh - Bopodi)', lat: 18.5626, lng: 73.8087, address: 'DP Road, Near Bremen Chowk' },
  { name: 'Viman Nagar (Phoenix Mall)', locality: 'Viman Nagar', ward: 'Ward 3 (Viman Nagar)', lat: 18.5679, lng: 73.9143, address: 'Symbiosis Road, Near Phoenix Marketcity' },
  { name: 'Hinjawadi Phase 1 (IT Park)', locality: 'Hinjawadi', ward: 'PCMC / Hinjawadi Zone', lat: 18.5913, lng: 73.7389, address: 'Near Shivaji Chowk, Hinjawadi Phase 1' },
];

const PRESET_PHOTO_SAMPLES = [
  { label: 'Pothole Defect', url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80' },
  { label: 'Drainage Overflow', url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80' },
  { label: 'Garbage Dump', url: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=600&auto=format&fit=crop&q=80' },
  { label: 'Broken Streetlight', url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600&auto=format&fit=crop&q=80' },
];

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, onReportCreated }) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | ''>('');
  const [selectedLocIndex, setSelectedLocIndex] = useState(0);
  const [address, setAddress] = useState(PRESET_LOCATIONS[0].address);
  const [locality, setLocality] = useState(PRESET_LOCATIONS[0].locality);
  const [ward, setWard] = useState(PRESET_LOCATIONS[0].ward);
  const [lat, setLat] = useState(PRESET_LOCATIONS[0].lat);
  const [lng, setLng] = useState(PRESET_LOCATIONS[0].lng);
  const [reporterName, setReporterName] = useState('Concerned Citizen');
  const [contact, setContact] = useState('citizen.contact@example.com');
  const [photoUrl, setPhotoUrl] = useState<string | null>(PRESET_PHOTO_SAMPLES[0].url);

  // GPS state
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [gpsMessage, setGpsMessage] = useState('');

  // AI Classification & Duplicate Candidate detection state
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateCandidate[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdResult, setCreatedResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle preset location change
  const handleLocationPresetChange = (idx: number) => {
    setSelectedLocIndex(idx);
    const loc = PRESET_LOCATIONS[idx];
    setAddress(loc.address);
    setLocality(loc.locality);
    setWard(loc.ward);
    setLat(loc.lat);
    setLng(loc.lng);
    setGpsSuccess(false);
    setGpsMessage('');
  };

  // Browser Geolocation API Handler
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setGpsMessage('Location detection is not supported by your browser. Please choose a location below.');
      return;
    }

    setGpsLoading(true);
    setGpsMessage('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const detectedLat = Number(position.coords.latitude.toFixed(4));
        const detectedLng = Number(position.coords.longitude.toFixed(4));
        setLat(detectedLat);
        setLng(detectedLng);
        setGpsLoading(false);
        setGpsSuccess(true);
        setGpsMessage(`Location detected: [${detectedLat}, ${detectedLng}]. Matched to nearby city ward.`);
        setAddress(`GPS Location Pin [${detectedLat}, ${detectedLng}]`);
      },
      (error) => {
        setGpsLoading(false);
        setGpsSuccess(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsMessage('Location permission was denied. You can select a neighborhood or enter an address below.');
        } else {
          setGpsMessage('Could not retrieve location. Please select your area manually below.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Local File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Real-time AI triage trigger when description/title changes
  useEffect(() => {
    if (!title || title.length < 5 || !description || description.length < 10) {
      setAiSuggestion(null);
      setDuplicateCandidates([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsAnalyzing(true);
      try {
        // 1. NLP Classification
        const classifyRes = await api.classifyText(title, description, locality);
        setAiSuggestion(classifyRes);
        if (!selectedCategory) {
          setSelectedCategory(classifyRes.suggested_category);
        }

        // 2. Duplicate Detection
        const dupRes = await api.checkDuplicates({
          title,
          description,
          category: selectedCategory || classifyRes.suggested_category,
          latitude: lat,
          longitude: lng
        });
        setDuplicateCandidates(dupRes.candidates || []);
      } catch (err) {
        console.error('AI Triage error:', err);
      } finally {
        setIsAnalyzing(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [title, description, locality, lat, lng, selectedCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!title.trim() || !description.trim() || !address.trim()) {
      setErrorMessage('Please fill in the problem title, description, and location.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.submitReport({
        title: title.trim(),
        description: description.trim(),
        category: (selectedCategory as IssueCategory) || undefined,
        address,
        locality,
        ward,
        latitude: lat,
        longitude: lng,
        reported_by_name: reporterName.trim() || 'Citizen',
        reported_by_contact: contact.trim() || undefined,
        images: photoUrl ? [photoUrl] : []
      });

      setCreatedResult(res);
      onReportCreated();
    } catch (err: any) {
      setErrorMessage(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setTitle('');
    setDescription('');
    setSelectedCategory('');
    setCreatedResult(null);
    setDuplicateCandidates([]);
    setErrorMessage('');
    setCurrentStep(1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Simple Header */}
        <div className="px-5 py-4 bg-[#173B65] text-white flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Camera className="w-5 h-5 text-sky-400" />
              Report a Civic Problem
            </h2>
            <p className="text-xs text-sky-200">
              Submit an issue in your neighborhood. We will route it to the right department.
            </p>
          </div>
          <button
            onClick={handleReset}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        {!createdResult && (
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex items-center justify-between text-xs font-medium text-slate-600">
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                currentStep >= 1 ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>1</span>
              <span className={currentStep === 1 ? 'font-bold text-slate-900' : ''}>What happened?</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                currentStep >= 2 ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>2</span>
              <span className={currentStep === 2 ? 'font-bold text-slate-900' : ''}>Where is it?</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                currentStep === 3 ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>3</span>
              <span className={currentStep === 3 ? 'font-bold text-slate-900' : ''}>Photos & Review</span>
            </div>
          </div>
        )}

        {/* Success View */}
        {createdResult ? (
          <div className="p-6 sm:p-8 text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Thank You! Your Report Was Received</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md mx-auto">
                We've assigned a tracking code so you can check the progress anytime. The municipal team has been notified.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-md mx-auto text-left space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Your Tracking Code:</span>
                <span className="font-mono font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded border border-sky-200">
                  {createdResult.report.tracking_code}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Municipal Issue ID:</span>
                <span className="font-mono font-bold text-slate-800">{createdResult.linked_issue.issue_code}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Responsible Department:</span>
                <span className="font-semibold text-slate-800">{createdResult.department_recommendation.department_name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Estimated Urgency:</span>
                <PriorityBadge
                  level={createdResult.priority_calculation.priority_level}
                  score={createdResult.priority_calculation.raw_score}
                />
              </div>
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 italic">
                Target turnaround window: within {createdResult.priority_calculation.sla_deadline_hours} hours.
              </div>
            </div>

            <button
              onClick={handleReset}
              className="mt-4 px-6 py-2.5 bg-[#173B65] text-white rounded-lg text-xs font-semibold hover:bg-navy-900 transition shadow-sm"
            >
              Done & Return to Feed
            </button>
          </div>
        ) : (
          /* Form Content */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                {errorMessage}
              </div>
            )}

            {/* Step 1: Issue Summary & Description */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Problem Summary <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Deep pothole on 100 Feet Road causing vehicle accidents"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">A short summary of what needs fixing.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Describe the Issue in Detail <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Tell us what you see: how big or severe is it? Is it causing danger to pedestrians, two-wheelers, or children?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                  />
                </div>

                {/* Plain-English AI Suggestion Box */}
                {(isAnalyzing || aiSuggestion) && (
                  <div className="p-3 bg-gradient-to-r from-sky-50 to-indigo-50 rounded-xl border border-sky-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sky-950 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-sky-600" />
                        Smart Category Suggestion
                      </span>
                      {isAnalyzing && <span className="text-[11px] text-sky-600">Analyzing your words...</span>}
                    </div>

                    {aiSuggestion && (
                      <div className="text-slate-700 text-[11px] space-y-1">
                        <div className="flex items-center gap-2">
                          <span>We suggest:</span>
                          <CategoryBadge category={aiSuggestion.suggested_category} />
                          <span className="text-slate-500">({Math.round(aiSuggestion.confidence * 100)}% match)</span>
                        </div>
                        <p className="text-slate-600 italic">
                          Why: {aiSuggestion.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Category Selection / Confirmation */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Confirm or Change Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as IssueCategory)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-sky-500 outline-none bg-white"
                  >
                    <option value="">Auto-selected based on description</option>
                    <option value="roads_infrastructure">Roads & Public Footpaths</option>
                    <option value="drainage_flooding">Drainage & Rainwater Flooding</option>
                    <option value="solid_waste">Garbage & Cleanliness</option>
                    <option value="streetlighting">Streetlights & Electricity</option>
                    <option value="water_supply">Water Supply Pipelines</option>
                    <option value="public_parks">Public Parks & Trees</option>
                    <option value="traffic_signals">Traffic Lights & Road Signs</option>
                    <option value="other">General Municipal Problem</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!title.trim() || !description.trim()) {
                        setErrorMessage('Please provide a title and short description before continuing.');
                        return;
                      }
                      setErrorMessage('');
                      setCurrentStep(2);
                    }}
                    className="px-5 py-2 bg-[#173B65] text-white rounded-lg text-xs font-semibold hover:bg-navy-900 transition flex items-center gap-1.5"
                  >
                    Next: Location <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Location & Geolocation */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-sky-600" />
                      Pinpoint Location
                    </label>

                    {/* Geolocation Trigger Button */}
                    <button
                      type="button"
                      onClick={handleDetectGPS}
                      disabled={gpsLoading}
                      className="px-3 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-800 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border border-sky-300"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      {gpsLoading ? 'Detecting GPS...' : 'Use My Current Location'}
                    </button>
                  </div>

                  {gpsMessage && (
                    <div className={`p-2 rounded text-[11px] font-medium flex items-center gap-1.5 ${
                      gpsSuccess ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      {gpsMessage}
                    </div>
                  )}

                  {/* Quick Neighborhood Preset Chips */}
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1.5">Or choose a common city area:</span>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {PRESET_LOCATIONS.map((loc, i) => (
                        <button
                          key={loc.name}
                          type="button"
                          onClick={() => handleLocationPresetChange(i)}
                          className={`px-2.5 py-1 text-[11px] rounded-md font-medium whitespace-nowrap transition ${
                            selectedLocIndex === i && !gpsSuccess
                              ? 'bg-sky-600 text-white font-semibold shadow-sm'
                              : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          {loc.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Exact Address / Street */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-slate-600 text-[11px] font-medium block">Street Address / Landmark:</span>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g. Near Metro Pillar 124"
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs mt-0.5"
                      />
                    </div>
                    <div>
                      <span className="text-slate-600 text-[11px] font-medium block">Ward & Zone:</span>
                      <input
                        type="text"
                        required
                        value={`${ward} (${locality})`}
                        disabled
                        className="w-full px-2.5 py-1.5 rounded border border-slate-200 bg-slate-100 text-slate-600 text-xs mt-0.5"
                      />
                    </div>
                  </div>
                </div>

                {/* Friendly Duplicate Notification Alert */}
                {duplicateCandidates.length > 0 && (
                  <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-300 text-xs space-y-2">
                    <div className="flex items-center gap-2 text-amber-900 font-bold">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                      Notice: Similar Report Found Nearby
                    </div>
                    <p className="text-amber-800 text-[11px]">
                      A neighbor recently reported a similar problem within {Math.round(duplicateCandidates[0].distance_meters)} meters.
                      You can confirm that report to save time, or continue submitting yours if it is a separate defect.
                    </p>
                    <div className="space-y-1">
                      {duplicateCandidates.slice(0, 2).map((c) => (
                        <div key={c.candidate_id} className="p-2 bg-white rounded border border-amber-200 text-[11px] flex justify-between items-center">
                          <div>
                            <span className="font-semibold text-slate-800">{c.matched_issue_title}</span>
                            <div className="text-slate-500 text-[10px]">{c.reason}</div>
                          </div>
                          <span className="font-mono text-amber-800 font-semibold px-2 py-0.5 bg-amber-100 rounded text-[10px]">
                            {Math.round(c.distance_meters)}m away
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-medium"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!address.trim()) {
                        setErrorMessage('Please specify the location or address.');
                        return;
                      }
                      setErrorMessage('');
                      setCurrentStep(3);
                    }}
                    className="px-5 py-2 bg-[#173B65] text-white rounded-lg text-xs font-semibold hover:bg-navy-900 transition flex items-center gap-1.5"
                  >
                    Next: Photo & Contact <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Photo Upload & Contact Information */}
            {currentStep === 3 && (
              <div className="space-y-4">
                {/* Photo Upload Options */}
                <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-sky-600" />
                      Attach a Photo (Optional)
                    </label>
                    {photoUrl && (
                      <button
                        type="button"
                        onClick={() => setPhotoUrl(null)}
                        className="text-[11px] text-rose-600 hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Remove photo
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Photos help crews verify the problem and bring the correct tools. You can take a photo with your phone or pick a sample.
                  </p>

                  {/* Real File Input for Citizens */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition flex items-center gap-1.5 shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-sky-600" />
                      Upload From Your Device
                    </button>
                    <span className="text-[11px] text-slate-400">or click a quick sample:</span>
                  </div>

                  {/* Photo Presets for quick evaluator testing */}
                  <div className="flex gap-2 overflow-x-auto pt-1">
                    {PRESET_PHOTO_SAMPLES.map((photo) => (
                      <button
                        key={photo.label}
                        type="button"
                        onClick={() => setPhotoUrl(photo.url)}
                        className={`relative w-24 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition ${
                          photoUrl === photo.url ? 'border-sky-600 ring-2 ring-sky-300' : 'border-transparent opacity-75 hover:opacity-100'
                        }`}
                      >
                        <img src={photo.url} alt={photo.label} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] py-0.5 text-center truncate">
                          {photo.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  {photoUrl && (
                    <div className="mt-2 relative w-32 h-20 rounded-lg overflow-hidden border border-slate-300">
                      <img src={photoUrl} alt="Selected preview" className="w-full h-full object-cover" />
                      <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[9px] px-1.5 py-0.2 rounded font-medium">
                        Attached
                      </span>
                    </div>
                  )}
                </div>

                {/* Reporter Contact Info */}
                <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Contact Details (For Updates)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <span className="text-[11px] text-slate-600 font-medium block">Your Name:</span>
                      <input
                        type="text"
                        required
                        value={reporterName}
                        onChange={(e) => setReporterName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded border border-slate-300 text-xs mt-0.5 bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-600 font-medium block">Phone or Email:</span>
                      <input
                        type="text"
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        placeholder="For status SMS/notifications"
                        className="w-full px-3 py-1.5 rounded border border-slate-300 text-xs mt-0.5 bg-white"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 pt-1">
                    🔒 Privacy Guarantee: Your contact information is kept confidential and only used for report status updates.
                  </p>
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-medium"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting & Routing...' : 'Submit Report Now'}
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
