import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar, NavTabType } from './components/common/Navbar';
import { CitizenPortal } from './pages/CitizenPortal';
import { OperatorDashboard } from './pages/OperatorDashboard';
import { ReviewerDashboard } from './pages/ReviewerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuthorityPortal } from './pages/AuthorityPortal';
import { GISExplorerPage } from './pages/GISExplorerPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AuthLandingPage } from './pages/AuthLandingPage';
import { ReportModal } from './components/citizen/ReportModal';
import { TrackModal } from './components/citizen/TrackModal';
import { AIDetailDrawer } from './components/authority/AIDetailDrawer';
import { AssignmentModal } from './components/authority/AssignmentModal';
import { StatusTransitionModal } from './components/authority/StatusTransitionModal';
import { VerificationModal } from './components/authority/VerificationModal';
import { CivicIssue, UserRole } from './services/types';

export const AppContent: React.FC = () => {
  const { role, isAuthenticated, loading, logout } = useAuth();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<NavTabType>('citizen');
  const [showAuthLanding, setShowAuthLanding] = useState<boolean>(false);

  // Common Modals state
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isTrackOpen, setIsTrackOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null);

  // Authority Action Modals state
  const [assignTarget, setAssignTarget] = useState<CivicIssue | null>(null);
  const [statusTarget, setStatusTarget] = useState<CivicIssue | null>(null);
  const [verifyTarget, setVerifyTarget] = useState<CivicIssue | null>(null);

  // When role changes (or user logs in), set default tab accordingly
  useEffect(() => {
    if (role === 'citizen') {
      setActiveTab('citizen');
    } else if (role === 'operator') {
      setActiveTab('operator');
    } else if (role === 'reviewer') {
      setActiveTab('reviewer');
    } else if (role === 'admin') {
      setActiveTab('admin');
    }
  }, [role]);

  // If user is not authenticated and not explicitly viewing as guest, display Auth Landing Page
  if (!loading && !isAuthenticated && !showAuthLanding) {
    return (
      <AuthLandingPage
        onSuccessRedirect={(newRole: UserRole) => {
          if (newRole === 'citizen') setActiveTab('citizen');
          else if (newRole === 'operator') setActiveTab('operator');
          else if (newRole === 'reviewer') setActiveTab('reviewer');
          else setActiveTab('admin');
        }}
        onContinueAsGuest={() => {
          setShowAuthLanding(true);
          setActiveTab('citizen');
        }}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F8FC] text-slate-800">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenTrack={() => setIsTrackOpen(true)}
        onOpenAuthLanding={() => setShowAuthLanding(false)}
      />

      {/* Scrollable content column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-y-auto">
        <div className="md:hidden h-14" />

        <main className="flex-1 p-4 sm:p-6">
          {/* Role Dashboard Routing */}
          {activeTab === 'citizen' && (
            <CitizenPortal
              onOpenReport={() => setIsReportOpen(true)}
              onOpenTrack={() => setIsTrackOpen(true)}
              onSelectIssue={(iss) => setSelectedIssue(iss)}
              onFeedbackRequest={(iss) => {
                setSelectedIssue(iss);
                setIsTrackOpen(true);
              }}
            />
          )}

          {activeTab === 'operator' && (
            <OperatorDashboard
              onSelectIssue={(iss) => setSelectedIssue(iss)}
              onActionAssign={(iss) => setAssignTarget(iss)}
              onActionTransition={(iss) => setStatusTarget(iss)}
            />
          )}

          {activeTab === 'reviewer' && (
            <ReviewerDashboard
              onSelectIssue={(iss) => setSelectedIssue(iss)}
              onActionVerify={(iss) => setVerifyTarget(iss)}
            />
          )}

          {activeTab === 'admin' && (
            <AdminDashboard
              onNavigateToGIS={() => setActiveTab('gis')}
              onNavigateToAnalytics={() => setActiveTab('analytics')}
            />
          )}

          {activeTab === 'authority' && (
            <AuthorityPortal
              onSelectIssue={(iss) => setSelectedIssue(iss)}
            />
          )}

          {activeTab === 'gis' && (
            <GISExplorerPage
              onSelectIssue={(iss) => setSelectedIssue(iss)}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsPage />
          )}
        </main>

        <footer className="bg-white border-t border-slate-100 py-3.5 px-6 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <span className="w-5 h-5 rounded bg-[#17365D] text-white flex items-center justify-center font-bold text-[9px]">
              CVL
            </span>
            <span>CivicLens AI — Pune Municipal Multi-Role Governance Platform</span>
          </div>
          <span>Pune Municipal Corporation (PMC) & PCMC</span>
        </footer>
      </div>

      {/* Citizen Modals */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onReportCreated={() => {}}
      />

      <TrackModal
        isOpen={isTrackOpen}
        onClose={() => setIsTrackOpen(false)}
      />

      {/* Expanded Issue Profile / Drawer */}
      <AIDetailDrawer
        issue={selectedIssue}
        isOpen={Boolean(selectedIssue)}
        onClose={() => setSelectedIssue(null)}
        onActionAssign={(iss) => {
          setSelectedIssue(null);
          setAssignTarget(iss);
        }}
        onActionTransition={(iss) => {
          setSelectedIssue(null);
          setStatusTarget(iss);
        }}
        onActionVerify={(iss) => {
          setSelectedIssue(null);
          setVerifyTarget(iss);
        }}
      />

      {/* Authority Action Modals */}
      <AssignmentModal
        issue={assignTarget}
        isOpen={Boolean(assignTarget)}
        onClose={() => setAssignTarget(null)}
        onAssigned={() => {}}
      />

      <StatusTransitionModal
        issue={statusTarget}
        isOpen={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        onStatusUpdated={() => {}}
      />

      <VerificationModal
        issue={verifyTarget}
        isOpen={Boolean(verifyTarget)}
        onClose={() => setVerifyTarget(null)}
        onVerified={() => {}}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
