import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Dashboard } from './pages/Dashboard';
import { MapPage } from './pages/MapPage';
import { Reports } from './pages/Reports';
import { ReportIssue } from './pages/ReportIssue';
import { IssueDetails } from './pages/IssueDetails';
import { Analytics } from './pages/Analytics';
import { QuickQR } from './pages/QuickQR';
import { Issue, AnalyticsData } from './types';
import { api, AuthUser } from './services/api';
import { subscribeToRealtimeReports } from './services/socket';
import { CheckCircle2, Radio, Bell } from 'lucide-react';
import { CitypulseCursor } from './components/common/CitypulseCursor';
import { AuthModal } from './components/auth/AuthModal';
import { CitizenDashboard } from './components/dashboard/CitizenDashboard';
import { AuthorityDashboard } from './components/dashboard/AuthorityDashboard';
import { CommunityTrackerBootScreen } from './components/loading/CommunityTrackerBootScreen';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showBootScreen, setShowBootScreen] = useState<boolean>(true);
  const [prefilledLocation, setPrefilledLocation] = useState<string | undefined>(undefined);
  const [notification, setNotification] = useState<string | null>(null);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authDefaultRole, setAuthDefaultRole] = useState<'CITIZEN' | 'AUTHORITY'>('CITIZEN');
  const [authDefaultMode, setAuthDefaultMode] = useState<'login' | 'signup'>('login');

  // Load authenticated user on launch
  useEffect(() => {
    api.getMe().then((user) => {
      if (user) {
        setCurrentUser(user);
      }
    });
  }, []);

  // Fetch issues and analytics from backend
  const loadData = useCallback(async () => {
    try {
      const [issuesRes, analyticsRes] = await Promise.all([
        api.getIssues(),
        api.getAnalytics(),
      ]);

      if (issuesRes && Array.isArray(issuesRes)) {
        setIssues(issuesRes);
        if (selectedIssue) {
          const fresh = issuesRes.find((i) => i.id === selectedIssue.id);
          if (fresh) setSelectedIssue(fresh);
        }
      }

      if (analyticsRes) {
        setAnalytics(analyticsRes);
      }
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedIssue]);

  // Initial data load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time synchronization via Socket.IO
  useEffect(() => {
    const unsubscribe = subscribeToRealtimeReports({
      onReportCreated: (newReport) => {
        setIssues((prev) => {
          if (prev.some((i) => i.id === newReport.id)) return prev;
          return [newReport, ...prev];
        });
        showToast(`📡 New Signal Ingested: "${newReport.title}" at ${newReport.address}`);
        api.getAnalytics().then(setAnalytics).catch(() => {});
      },
      onReportUpdated: (updatedReport) => {
        setIssues((prev) =>
          prev.map((i) => (i.id === updatedReport.id ? updatedReport : i))
        );
        setSelectedIssue((prev) =>
          prev && prev.id === updatedReport.id ? updatedReport : prev
        );
        showToast(`⚡ Incident Updated: "${updatedReport.title}" is now ${updatedReport.status.replace('_', ' ').toUpperCase()}`);
        api.getAnalytics().then(setAnalytics).catch(() => {});
      },
    });

    return () => unsubscribe();
  }, []);

  // Toast notification helper
  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Open Auth Modal
  const handleOpenAuth = (
    role: 'CITIZEN' | 'AUTHORITY' = 'CITIZEN',
    mode: 'login' | 'signup' = 'login'
  ) => {
    setAuthDefaultRole(role);
    setAuthDefaultMode(mode);
    setIsAuthModalOpen(true);
  };

  // Handle Login / Signup Success - Redirects directly to Administrative Panel for Officers/Admins
  const handleAuthSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    if (user.role === 'AUTHORITY' || user.role === 'ADMIN') {
      showToast(`🛡️ Officer Verified: Welcome ${user.name}! Accessing Administrative Panel.`);
      setCurrentTab('authority');
    } else {
      showToast(`Welcome back, ${user.name}!`);
      setCurrentTab('dashboard');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Logout
  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    showToast('Signed out of Citypulse.');
    setCurrentTab('dashboard');
  };

  // Navigation handler
  const handleNavigate = (tab: string, issueId?: string) => {
    if (issueId) {
      const target = issues.find((i) => i.id === issueId);
      if (target) {
        setSelectedIssue(target);
        setCurrentTab('details');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectIssue = (issue: Issue) => {
    setSelectedIssue(issue);
    setCurrentTab('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickReportFromQR = (locationName: string) => {
    setPrefilledLocation(locationName);
    setCurrentTab('report');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReportSuccess = async (newIssueId: string) => {
    await loadData();
    showToast('✨ Signal successfully transmitted! Real-time AI triage & map pin logged.');
    const created = issues.find((i) => i.id === newIssueId);
    if (created) {
      setSelectedIssue(created);
      setCurrentTab('details');
    } else {
      setCurrentTab('reports');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleIssueUpdated = (updated: Issue) => {
    setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setSelectedIssue(updated);
    showToast(`Status updated to ${updated.status.replace('_', ' ').toUpperCase()}`);
    loadData();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#060713] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-white relative">
      {/* Citypulse Nucleus & Orbiting Electron Custom Cursor */}
      <CitypulseCursor />

      {/* Community Tracker Digital City Infrastructure Initialization Screen */}
      {showBootScreen && (
        <CommunityTrackerBootScreen
          onComplete={() => setShowBootScreen(false)}
          isDataReady={!isLoading}
        />
      )}

      {/* Main Application Container with Slow, Smooth Reveal */}
      <div
        className={`min-h-screen flex flex-col transition-opacity duration-1000 ease-out ${
          showBootScreen
            ? 'opacity-0 pointer-events-none'
            : 'opacity-100'
        }`}
      >
        {/* Top Header with Navigation & Auth Integration */}
        <Header
          currentTab={currentTab}
          onNavigate={(tab) => handleNavigate(tab)}
          currentUser={currentUser}
          onOpenAuth={handleOpenAuth}
          onLogout={handleLogout}
          isAuthorityMode={currentUser?.role === 'AUTHORITY' || currentUser?.role === 'ADMIN'}
          onReplayBoot={() => setShowBootScreen(true)}
        />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed top-24 right-4 z-50 max-w-md glass-card bg-slate-950/90 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-cyan-400/40 animate-slide-up text-xs font-medium backdrop-blur-xl">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="leading-snug">{notification}</span>
        </div>
      )}

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {currentTab === 'dashboard' && (
          <Dashboard
            issues={issues}
            analytics={analytics}
            isLoading={isLoading}
            onNavigate={(tab, id) => handleNavigate(tab, id)}
            onSelectIssue={handleSelectIssue}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {currentTab === 'citizen' && (
          currentUser ? (
            <CitizenDashboard
              user={currentUser}
              issues={issues}
              onLodgeIssue={() => handleNavigate('report')}
              onSelectIssue={handleSelectIssue}
            />
          ) : (
            <div className="glass-card rounded-3xl p-12 text-center border border-white/10 max-w-md mx-auto my-12 space-y-4">
              <h2 className="text-xl font-bold text-white">Citizen Authentication Required</h2>
              <p className="text-xs text-slate-400">
                Please log in with your Citizen profile to view personal reports, track progress, and submit GPS complaints.
              </p>
              <button
                onClick={() => handleOpenAuth('CITIZEN')}
                className="btn-glass-primary px-6 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer"
              >
                Sign In to Citizen Hub
              </button>
            </div>
          )
        )}

        {currentTab === 'authority' && (
          currentUser && (currentUser.role === 'AUTHORITY' || currentUser.role === 'ADMIN') ? (
            <AuthorityDashboard
              user={currentUser}
              issues={issues}
              onSelectIssue={handleSelectIssue}
              onRefresh={loadData}
            />
          ) : (
            <div className="glass-card rounded-3xl p-12 text-center border border-cyan-500/30 max-w-md mx-auto my-12 space-y-4">
              <h2 className="text-xl font-bold text-white">Authority Clearance Required</h2>
              <p className="text-xs text-slate-400">
                Municipal triage and crew dispatch controls require verified Officer or Administrator credentials.
              </p>
              <button
                onClick={() => handleOpenAuth('AUTHORITY')}
                className="btn-glass-primary px-6 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer"
              >
                Sign In to Authority Portal
              </button>
            </div>
          )
        )}

        {currentTab === 'map' && (
          <MapPage
            issues={issues}
            onSelectIssue={handleSelectIssue}
          />
        )}

        {currentTab === 'reports' && (
          <Reports
            issues={issues}
            onSelectIssue={handleSelectIssue}
            onNavigateReport={() => handleNavigate('report')}
          />
        )}

        {currentTab === 'report' && (
          <ReportIssue
            onBack={() => handleNavigate('dashboard')}
            onSuccess={handleReportSuccess}
            prefilledLocation={prefilledLocation}
          />
        )}

        {currentTab === 'details' && selectedIssue && (
          <IssueDetails
            issue={selectedIssue}
            onBack={() => handleNavigate('reports')}
            isAuthorityMode={currentUser?.role === 'AUTHORITY' || currentUser?.role === 'ADMIN'}
            onIssueUpdated={handleIssueUpdated}
          />
        )}

        {currentTab === 'analytics' && (
          <Analytics
            analytics={analytics}
            onSelectIssue={handleSelectIssue}
          />
        )}

        {currentTab === 'qr' && (
          <QuickQR
            onQuickReport={handleQuickReportFromQR}
          />
        )}
      </main>

      {/* Footer with Civic Lifecycle Journey */}
      <Footer onReplayBoot={() => setShowBootScreen(true)} />
      </div>

      {/* Interactive Dual-Path Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        onSuccess={handleAuthSuccess}
        initialRole={authDefaultRole}
        defaultRole={authDefaultRole}
        initialMode={authDefaultMode}
        defaultMode={authDefaultMode}
      />
    </div>
  );
}
