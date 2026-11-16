import React, { useState } from 'react';
import { UserRole } from '../services/types';
import { useAuth } from '../context/AuthContext';
import {
  Shield, UserCheck, HardHat, CheckCircle2, Landmark,
  ArrowRight, Lock, Mail, Phone, MapPin, KeyRound,
  X, AlertCircle, Sparkles, Building2, Eye, EyeOff
} from 'lucide-react';

interface AuthLandingPageProps {
  onSuccessRedirect: (role: UserRole) => void;
  onContinueAsGuest?: () => void;
}

export const AuthLandingPage: React.FC<AuthLandingPageProps> = ({
  onSuccessRedirect,
  onContinueAsGuest
}) => {
  const { login, registerCitizen, quickLoginDemo } = useAuth();

  // Selected role modal
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Citizen registration fields
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [locality, setLocality] = useState('Shivajinagar, Pune');
  const [consentTerms, setConsentTerms] = useState(true);

  // Status & error states
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setIdentifier('');
    setPassword('');
    setMfaCode('');
    setFullName('');
    setMobile('');
    setEmail('');
    setErrorMessage(null);
    setIsRegistering(false);
    setShowPassword(false);
  };

  const handleOpenRole = (role: UserRole) => {
    resetForm();
    setSelectedRole(role);
    // Autofill demo hint based on role
    if (role === 'citizen') {
      setIdentifier('9876543210');
      setPassword('CitizenDemo@123');
    } else if (role === 'operator') {
      setIdentifier('PMC-OP-2041');
      setPassword('OperatorDemo@123');
    } else if (role === 'reviewer') {
      setIdentifier('PCMC-QR-5012');
      setPassword('ReviewerDemo@123');
    } else if (role === 'admin') {
      setIdentifier('PMC-ADM-001');
      setPassword('AdminDemo@123');
      setMfaCode('123456');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      if (selectedRole === 'citizen' && isRegistering) {
        if (!consentTerms) {
          throw new Error('Please consent to the terms of service and privacy policy.');
        }
        await registerCitizen({
          name: fullName,
          mobile,
          email: email || undefined,
          password,
          locality,
          consent_terms: consentTerms
        });
        onSuccessRedirect('citizen');
      } else {
        await login({
          identifier,
          password,
          role: selectedRole,
          mfa_code: selectedRole === 'admin' ? mfaCode : undefined
        });
        onSuccessRedirect(selectedRole);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = async (role: UserRole) => {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await quickLoginDemo(role);
      onSuccessRedirect(role);
    } catch (err: any) {
      setErrorMessage(err.message || 'Demo authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F8FC] flex flex-col justify-between text-slate-800">
      
      {/* Top Navbar */}
      <header className="bg-[#17365D] text-white border-b border-white/10 px-6 py-4 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center shadow-inner text-white font-black text-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white block leading-none">
                CivicLens AI
              </span>
              <p className="text-[10px] text-sky-200/80 mt-1 leading-tight font-medium">
                Pune Civic Intelligence Platform (PMC & PCMC)
              </p>
            </div>
          </div>

          {onContinueAsGuest && (
            <button
              onClick={onContinueAsGuest}
              className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors"
            >
              Public Citizen View →
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-10 space-y-8 flex flex-col justify-center">
        
        {/* Hero Title */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-[#17365D] text-xs font-semibold border border-sky-200 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#3973B9]" />
            Multi-Role Municipal Governance & Citizen Access
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Welcome to CivicLens AI
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Secure access to Pune's civic intelligence and municipal governance platform.
            Select your assigned role to access your dedicated dashboard.
          </p>
        </div>

        {/* 4 Dedicated Role Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Citizen Login */}
          <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-[#3973B9] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center group-hover:scale-105 transition-transform">
                <UserCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                  Public Resident
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Citizen Portal
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Report civic issues, track personal grievances, confirm community defects and receive live resolution updates.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 space-y-2">
              <button
                onClick={() => handleOpenRole('citizen')}
                className="w-full py-2.5 px-3 bg-[#07966B] hover:bg-[#06825c] text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                Citizen Sign In
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 2. Municipal Operator Login */}
          <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-[#3973B9] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-800 border border-sky-200/80 flex items-center justify-center group-hover:scale-105 transition-transform">
                <HardHat className="w-6 h-6 text-[#3973B9]" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#3973B9] block">
                  Field Dispatch & Triage
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Municipal Operator
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Triage incoming reports, assign zonal field units, update work progress, and manage department SLAs.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 space-y-2">
              <button
                onClick={() => handleOpenRole('operator')}
                className="w-full py-2.5 px-3 bg-[#17365D] hover:bg-[#102A43] text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                Operator Sign In
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 3. Quality Reviewer Login */}
          <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-[#3973B9] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-800 border border-purple-200/80 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                  Independent Audit
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Quality Reviewer
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Inspect remediation evidence, review before-and-after photographs, approve quality sign-offs or request rework.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 space-y-2">
              <button
                onClick={() => handleOpenRole('reviewer')}
                className="w-full py-2.5 px-3 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                Reviewer Sign In
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 4. Civic Administrator Login */}
          <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-[#3973B9] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 border border-slate-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Landmark className="w-6 h-6 text-[#17365D]" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                  Municipal Secretariat
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Civic Administrator
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                City-wide executive analytics, GIS intelligence, authority staff provisioning, ward configurations, and complete audit trail.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 space-y-2">
              <button
                onClick={() => handleOpenRole('admin')}
                className="w-full py-2.5 px-3 bg-[#102A43] hover:bg-black text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                Administrator Sign In
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* Development & Demo Selector Bar (Part 12) */}
        <div className="bg-slate-100/90 rounded-2xl border border-slate-200 p-4 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-bold uppercase tracking-wider">
                DEMO ENVIRONMENT
              </span>
              <span className="text-xs font-bold text-slate-800">
                Quick 1-Click Role Login for Evaluation & Testing
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              Pre-provisioned with authentic Pune Municipal dataset
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <button
              onClick={() => handleQuickDemo('citizen')}
              disabled={submitting}
              className="p-2 bg-white hover:bg-emerald-50 rounded-lg border border-slate-200 text-left transition text-xs group"
            >
              <div className="font-bold text-emerald-800 group-hover:text-emerald-900 flex items-center justify-between">
                <span>Citizen Demo</span>
                <span className="text-[9px] bg-emerald-100 px-1 rounded">Resident</span>
              </div>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">Aarav Deshmukh</p>
            </button>

            <button
              onClick={() => handleQuickDemo('operator')}
              disabled={submitting}
              className="p-2 bg-white hover:bg-sky-50 rounded-lg border border-slate-200 text-left transition text-xs group"
            >
              <div className="font-bold text-[#17365D] group-hover:text-[#3973B9] flex items-center justify-between">
                <span>Operator Demo</span>
                <span className="text-[9px] bg-sky-100 text-[#17365D] px-1 rounded">Roads</span>
              </div>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">Er. Rajesh Verma (Shivajinagar)</p>
            </button>

            <button
              onClick={() => handleQuickDemo('reviewer')}
              disabled={submitting}
              className="p-2 bg-white hover:bg-purple-50 rounded-lg border border-slate-200 text-left transition text-xs group"
            >
              <div className="font-bold text-purple-800 group-hover:text-purple-900 flex items-center justify-between">
                <span>Reviewer Demo</span>
                <span className="text-[9px] bg-purple-100 text-purple-800 px-1 rounded">Auditor</span>
              </div>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">Dr. Sunita Kulkarni (Quality Cell)</p>
            </button>

            <button
              onClick={() => handleQuickDemo('admin')}
              disabled={submitting}
              className="p-2 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 text-left transition text-xs group"
            >
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>Admin Demo</span>
                <span className="text-[9px] bg-slate-200 px-1 rounded">IAS</span>
              </div>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">Comm. Vikram Shinde</p>
            </button>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3.5 px-6 text-xs text-slate-500 text-center">
        <span>CivicLens AI &copy; 2026 • Pune Municipal Corporation (PMC) & Pimpri-Chinchwad Municipal Corporation (PCMC)</span>
      </footer>

      {/* ===================================================================== */}
      {/* ROLE LOGIN MODAL OVERLAY */}
      {/* ===================================================================== */}
      {selectedRole && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#17365D] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-200">
                  {selectedRole === 'citizen' && <UserCheck className="w-5 h-5 text-emerald-300" />}
                  {selectedRole === 'operator' && <HardHat className="w-5 h-5 text-sky-300" />}
                  {selectedRole === 'reviewer' && <CheckCircle2 className="w-5 h-5 text-purple-300" />}
                  {selectedRole === 'admin' && <Landmark className="w-5 h-5 text-slate-200" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold capitalize">
                    {selectedRole === 'citizen'
                      ? isRegistering ? 'Citizen Registration' : 'Citizen Portal Login'
                      : selectedRole === 'operator'
                      ? 'Municipal Operator Sign In'
                      : selectedRole === 'reviewer'
                      ? 'Quality Reviewer Sign In'
                      : 'Civic Administrator Sign In'}
                  </h3>
                  <p className="text-[10px] text-sky-200/80">Pune Municipal Governance Platform</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedRole(null)}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Citizen Toggle Sign In vs Register */}
            {selectedRole === 'citizen' && (
              <div className="grid grid-cols-2 p-1 bg-slate-100 border-b border-slate-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className={`py-2 text-center rounded-lg transition-all ${
                    !isRegistering ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Existing Citizen Login
                </button>
                <button
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className={`py-2 text-center rounded-lg transition-all ${
                    isRegistering ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  New Citizen Register
                </button>
              </div>
            )}

            {/* Form Body */}
            <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
              
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Citizen Registration Fields */}
              {selectedRole === 'citizen' && isRegistering ? (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aarav Deshmukh"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-[#07966B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Mobile Number (Primary ID)</label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-[#07966B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Email Address (Optional)</label>
                    <input
                      type="email"
                      placeholder="e.g. resident@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-[#07966B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Pune Locality / Ward</label>
                    <select
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-[#07966B] bg-white"
                    >
                      <option value="Shivajinagar, Pune">Shivajinagar</option>
                      <option value="Kothrud, Pune">Kothrud</option>
                      <option value="Baner, Pune">Baner</option>
                      <option value="Aundh, Pune">Aundh</option>
                      <option value="Deccan Gymkhana, Pune">Deccan Gymkhana</option>
                      <option value="Hinjawadi, Pune">Hinjawadi</option>
                      <option value="Viman Nagar, Pune">Viman Nagar</option>
                      <option value="Hadapsar, Pune">Hadapsar</option>
                      <option value="Koregaon Park, Pune">Koregaon Park</option>
                      <option value="Swargate, Pune">Swargate</option>
                      <option value="Pimple Saudagar, PCMC">Pimple Saudagar (PCMC)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Create Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-[#07966B]"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      id="termsConsent"
                      checked={consentTerms}
                      onChange={(e) => setConsentTerms(e.target.checked)}
                      className="rounded border-slate-300 text-[#07966B] focus:ring-[#07966B]"
                    />
                    <label htmlFor="termsConsent" className="text-[11px] leading-tight">
                      I agree to the CivicLens AI Pune privacy terms and verified civic reporting charter.
                    </label>
                  </div>
                </>
              ) : (
                /* Standard Sign In Form */
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      {selectedRole === 'citizen'
                        ? 'Mobile Number or Email'
                        : selectedRole === 'operator'
                        ? 'Employee ID or Official Email'
                        : selectedRole === 'reviewer'
                        ? 'Reviewer ID or Official Email'
                        : 'Administrator ID or Official Email'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={
                        selectedRole === 'citizen'
                          ? 'e.g. 9876543210 or citizen@pune.gov.in'
                          : selectedRole === 'operator'
                          ? 'e.g. PMC-OP-2041'
                          : selectedRole === 'reviewer'
                          ? 'e.g. PCMC-QR-5012'
                          : 'e.g. PMC-ADM-001'
                      }
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-[#17365D]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 pr-9 rounded-lg border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-[#17365D]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Administrator MFA field */}
                  {selectedRole === 'admin' && (
                    <div className="space-y-1 pt-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                        <span>Multi-Factor Authentication (MFA)</span>
                        <span className="text-[10px] text-slate-400 font-mono">Demo: 123456</span>
                      </label>
                      <input
                        type="text"
                        placeholder="6-digit security code"
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-[#17365D] font-mono tracking-widest text-center"
                      />
                    </div>
                  )}

                  {selectedRole !== 'citizen' && (
                    <p className="text-[10px] text-slate-500 italic pt-1 leading-relaxed">
                      Official accounts are provisioned and invited by the Civic Administrator Secretariat.
                      Public registration is disabled for authority roles.
                    </p>
                  )}
                </>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-2.5 rounded-lg text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 ${
                    selectedRole === 'citizen'
                      ? 'bg-[#07966B] hover:bg-[#06825c]'
                      : selectedRole === 'operator'
                      ? 'bg-[#17365D] hover:bg-[#102A43]'
                      : selectedRole === 'reviewer'
                      ? 'bg-purple-700 hover:bg-purple-800'
                      : 'bg-[#102A43] hover:bg-black'
                  }`}
                >
                  {submitting ? (
                    <span className="animate-pulse">Authenticating...</span>
                  ) : selectedRole === 'citizen' && isRegistering ? (
                    <>Complete Citizen Registration <ArrowRight className="w-3.5 h-3.5" /></>
                  ) : (
                    <>Sign In & Open Dashboard <ArrowRight className="w-3.5 h-3.5" /></>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
