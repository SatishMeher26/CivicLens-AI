import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../services/types';
import {
  Layers, MapPin, BarChart3, ShieldCheck, PlusCircle, Search,
  UserCheck, ChevronLeft, ChevronRight, Menu, X, HardHat,
  CheckCircle2, Landmark, LogOut, LogIn, Shield, Building2
} from 'lucide-react';
import { api } from '../../services/api';

export type NavTabType = 'citizen' | 'operator' | 'reviewer' | 'admin' | 'authority' | 'gis' | 'analytics';

interface NavbarProps {
  activeTab: NavTabType;
  setActiveTab: (tab: NavTabType) => void;
  onOpenReport: () => void;
  onOpenTrack: () => void;
  onOpenAuthLanding: () => void;
}

interface SidebarInnerProps {
  isCollapsed: boolean;
  closeMobile: () => void;
  activeTab: NavTabType;
  setActiveTab: (tab: NavTabType) => void;
  onOpenReport: () => void;
  onOpenTrack: () => void;
  backendOnline: boolean | null;
  onOpenAuthLanding: () => void;
}

const SidebarInner: React.FC<SidebarInnerProps> = ({
  isCollapsed,
  closeMobile,
  activeTab,
  setActiveTab,
  onOpenReport,
  onOpenTrack,
  backendOnline,
  onOpenAuthLanding
}) => {
  const { user, role, logout, isAuthenticated } = useAuth();

  // Dynamic Navigation Items per Role
  const navItems = React.useMemo(() => {
    if (role === 'citizen') {
      return [
        { id: 'citizen' as NavTabType, label: 'Citizen Portal', icon: UserCheck },
        { id: 'gis' as NavTabType, label: 'GIS Intelligence', icon: MapPin },
      ];
    }
    if (role === 'operator') {
      return [
        { id: 'operator' as NavTabType, label: 'Operator Desk', icon: HardHat },
        { id: 'authority' as NavTabType, label: 'Workflows & Triage', icon: ShieldCheck },
        { id: 'gis' as NavTabType, label: 'GIS Intelligence', icon: MapPin },
      ];
    }
    if (role === 'reviewer') {
      return [
        { id: 'reviewer' as NavTabType, label: 'Quality Audit Desk', icon: CheckCircle2 },
        { id: 'authority' as NavTabType, label: 'Inspection Queue', icon: ShieldCheck },
        { id: 'gis' as NavTabType, label: 'GIS Intelligence', icon: MapPin },
      ];
    }
    // Admin
    return [
      { id: 'admin' as NavTabType, label: 'Admin Secretariat', icon: Landmark },
      { id: 'authority' as NavTabType, label: 'Authority Desk', icon: ShieldCheck },
      { id: 'gis' as NavTabType, label: 'GIS Intelligence', icon: MapPin },
      { id: 'analytics' as NavTabType, label: 'Analytics & Trends', icon: BarChart3 },
    ];
  }, [role]);

  return (
    <div className="flex flex-col h-full overflow-hidden text-xs">
      {/* Brand */}
      <div
        className="flex items-center gap-3 px-3 py-4 cursor-pointer border-b border-white/10 flex-shrink-0"
        onClick={() => {
          if (role === 'citizen') setActiveTab('citizen');
          else if (role === 'operator') setActiveTab('operator');
          else if (role === 'reviewer') setActiveTab('reviewer');
          else setActiveTab('admin');
          closeMobile();
        }}
      >
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center shadow-inner flex-shrink-0">
          <Layers className="w-5 h-5 text-white" />
        </div>
        {!isCollapsed && (
          <div className="min-w-0 overflow-hidden">
            <span className="font-bold text-base tracking-tight text-white leading-none block whitespace-nowrap">
              CivicLens AI
            </span>
            <p className="text-[10px] text-sky-200/70 mt-1 leading-tight whitespace-nowrap font-medium">
              Pune Civic Intelligence
            </p>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {!isCollapsed && (
          <p className="text-[9px] uppercase font-bold text-sky-300/60 tracking-widest px-2 mb-2">
            Navigation
          </p>
        )}
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setActiveTab(id); closeMobile(); }}
            title={isCollapsed ? label : undefined}
            className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-xs font-semibold transition-all text-left border-l-2 ${
              activeTab === id
                ? 'bg-sky-500/20 text-sky-300 border-sky-400'
                : 'text-slate-200 hover:bg-white/8 hover:text-white border-transparent'
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className={isCollapsed ? 'hidden' : 'block truncate'}>{label}</span>
            {!isCollapsed && activeTab === id && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-300/80" />
            )}
          </button>
        ))}
      </nav>

      {/* Quick Actions for Citizens and Operators */}
      <div className="px-2 py-3 border-t border-white/10 space-y-2 flex-shrink-0">
        {!isCollapsed && (
          <p className="text-[9px] uppercase font-bold text-sky-300/60 tracking-widest px-2 mb-2">Actions</p>
        )}
        <button
          onClick={() => { onOpenReport(); closeMobile(); }}
          title={isCollapsed ? 'Report Issue' : undefined}
          className={`w-full bg-[#07966B] hover:bg-[#06825c] text-white rounded-lg text-xs font-semibold transition shadow-sm flex items-center gap-2 ${
            isCollapsed ? 'px-2 py-2 justify-center' : 'px-3 py-2'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span className={isCollapsed ? 'hidden' : 'block'}>Report a Problem</span>
        </button>
        <button
          onClick={() => { onOpenTrack(); closeMobile(); }}
          title={isCollapsed ? 'Track Issue' : undefined}
          className={`w-full bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition border border-white/15 flex items-center gap-2 ${
            isCollapsed ? 'px-2 py-2 justify-center' : 'px-3 py-2'
          }`}
        >
          <Search className="w-3.5 h-3.5 flex-shrink-0" />
          <span className={isCollapsed ? 'hidden' : 'block'}>Track Status</span>
        </button>
      </div>

      {/* Backend Status indicator */}
      <div className={`px-2 py-2 border-t border-white/10 flex-shrink-0 ${isCollapsed ? 'flex justify-center' : 'flex items-center gap-2 px-3'}`}>
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
          backendOnline === null ? 'bg-slate-400' :
          backendOnline ? 'bg-emerald-400' : 'bg-red-400'
        }`} />
        {!isCollapsed && (
          <span className="text-[10px] text-sky-200/60">
            {backendOnline === null ? 'Connecting...' : backendOnline ? 'Pune Core Online' : 'Backend Offline'}
          </span>
        )}
      </div>

      {/* User Profile & Auth Section (PART 1, 2, 3, 4, 5) */}
      <div className="p-2 border-t border-white/10 flex-shrink-0 bg-black/15">
        {isAuthenticated && user ? (
          <div className="space-y-2">
            {!isCollapsed && (
              <div className="px-2 py-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs truncate max-w-[130px]">{user.name}</span>
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-sky-400/20 text-sky-300">
                    {user.role}
                  </span>
                </div>
                <p className="text-[10px] text-sky-200/70 truncate">
                  {user.jurisdiction_ward ? `Ward: ${user.jurisdiction_ward}` : user.designation || 'Pune Municipal Platform'}
                </p>
              </div>
            )}

            <button
              onClick={() => {
                logout();
                onOpenAuthLanding();
              }}
              title="Sign Out of CivicLens AI"
              className={`w-full flex items-center gap-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-semibold transition ${
                isCollapsed ? 'p-2 justify-center' : 'px-3 py-1.5'
              }`}
            >
              <LogOut className="w-3.5 h-3.5 text-red-300" />
              {!isCollapsed && <span>Sign Out</span>}
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              onOpenAuthLanding();
              closeMobile();
            }}
            title="Sign In / Switch Role"
            className={`w-full flex items-center gap-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition shadow-xs ${
              isCollapsed ? 'p-2 justify-center' : 'px-3 py-2'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            {!isCollapsed && <span>Sign In / Role Portals</span>}
          </button>
        )}
      </div>
    </div>
  );
};

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenReport,
  onOpenTrack,
  onOpenAuthLanding
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    api.getHealth()
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));

    const interval = setInterval(() => {
      api.getHealth()
        .then(() => setBackendOnline(true))
        .catch(() => setBackendOnline(false));
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const sharedProps = {
    activeTab,
    setActiveTab,
    onOpenReport,
    onOpenTrack,
    backendOnline,
    onOpenAuthLanding
  };

  return (
    <>
      {/* Desktop Fixed Left Sidebar */}
      <aside
        className="hidden md:flex flex-col bg-[#0F2642] text-white h-screen sticky top-0 z-30 shadow-xl transition-all duration-200 overflow-hidden sidebar flex-shrink-0"
        style={{ width: collapsed ? 64 : 220 }}
      >
        <SidebarInner
          isCollapsed={collapsed}
          closeMobile={() => {}}
          {...sharedProps}
        />

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center py-2.5 border-t border-white/10 hover:bg-white/10 transition text-sky-300/70 hover:text-sky-300 flex-shrink-0 text-xs"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* Mobile Fixed Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#0F2642] h-14 flex items-center justify-between px-4 text-white">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setActiveTab('citizen')}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm text-white">CivicLens AI</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenReport}
            className="bg-[#07966B] hover:bg-[#06825c] text-white px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Report
          </button>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-md bg-white/10 hover:bg-white/20 transition"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex animate-in fade-in duration-150">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 bg-[#0F2642] text-white h-full overflow-y-auto shadow-2xl flex flex-col">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-md bg-white/10 hover:bg-white/20 transition z-10"
              aria-label="Close menu"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <SidebarInner
              isCollapsed={false}
              closeMobile={() => setMobileOpen(false)}
              {...sharedProps}
            />
          </div>
        </div>
      )}
    </>
  );
};
