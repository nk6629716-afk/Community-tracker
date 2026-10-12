import React from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  FileText, 
  BarChart3, 
  PlusCircle, 
  QrCode, 
  ShieldCheck, 
  Compass,
  AlertCircle,
  LogIn,
  LogOut,
  User,
  ShieldAlert,
  Radio,
  Sun,
  Moon
} from 'lucide-react';
import { AuthUser } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
  currentTab: string;
  onNavigate: (tab: string, issueId?: string) => void;
  currentUser: AuthUser | null;
  onOpenAuth: (role?: 'CITIZEN' | 'AUTHORITY', mode?: 'login' | 'signup') => void;
  onLogout: () => void;
  isAuthorityMode?: boolean;
  onToggleAuthorityMode?: () => void;
  onReplayBoot?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  currentUser,
  onOpenAuth,
  onLogout,
  isAuthorityMode,
  onToggleAuthorityMode,
  onReplayBoot,
}) => {
  const { theme, toggleTheme } = useTheme();
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'map', label: 'Live Map', icon: MapPin },
    { id: 'reports', label: 'Feed', icon: FileText },
    { id: 'analytics', label: 'Stats', icon: BarChart3 },
    { id: 'citizen', label: 'Citizen Hub', icon: User },
    { id: 'authority', label: 'Admin Panel', icon: ShieldAlert },
  ];

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#060713]/85 backdrop-blur-xl border-b border-white/10 shadow-lg transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6">
          <div className="flex items-center justify-between h-16 gap-2">
            {/* Logo & Tagline */}
            <div 
              className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0"
              onClick={() => onNavigate('dashboard')}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 via-violet-600/30 to-cyan-400/20 border border-cyan-400/30 text-white flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-transform group-hover:scale-105 duration-200">
                <Radio className="w-4 h-4 text-cyan-300 animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg sm:text-xl text-white tracking-tight">Citypulse</span>
                <span className="hidden 2xl:inline-flex items-center text-xs text-slate-400 font-medium border-l border-white/10 pl-2">
                  Send the signal. See the change.
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                const isAuthorityUser = currentUser?.role === 'AUTHORITY' || currentUser?.role === 'ADMIN';

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'citizen' && !currentUser) {
                        onOpenAuth('CITIZEN', 'login');
                      } else if (item.id === 'authority' && !isAuthorityUser) {
                        onOpenAuth('AUTHORITY', 'login');
                      } else {
                        onNavigate(item.id);
                      }
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-white/10 text-cyan-300 border border-cyan-400/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    } ${item.id === 'authority' && isAuthorityUser ? 'border border-cyan-500/40 text-cyan-300' : ''}`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.label}</span>
                    {item.id === 'authority' && isAuthorityUser && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right Action Area */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Authenticated User Status or Login/Signup */}
              {currentUser ? (
                <div className="flex items-center gap-1.5">
                  <div 
                    onClick={() => onNavigate(currentUser.role === 'AUTHORITY' || currentUser.role === 'ADMIN' ? 'authority' : 'citizen')}
                    className="glass-pill px-2.5 py-1 rounded-full flex items-center gap-2 border border-white/15 cursor-pointer hover:border-cyan-400/40 transition max-w-[170px]"
                    title={`${currentUser.name} (${currentUser.role})`}
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-400 to-violet-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden sm:block text-left min-w-0">
                      <span className="text-xs font-bold text-white block truncate leading-none">
                        {currentUser.role === 'ADMIN' ? 'Master Admin' : currentUser.name}
                      </span>
                      <span className="text-[10px] text-cyan-300 font-mono block truncate leading-tight mt-0.5">
                        {currentUser.role === 'ADMIN' ? 'Supreme Clear' : currentUser.role === 'AUTHORITY' ? 'Officer' : 'Citizen'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={onLogout}
                    className="p-1.5 sm:p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-slate-300 hover:text-rose-300 transition cursor-pointer shrink-0"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    id="btn-header-login"
                    onClick={() => onOpenAuth('CITIZEN', 'login')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:text-white bg-white/10 hover:bg-white/15 border border-white/20 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <LogIn className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Login</span>
                  </button>

                  <button
                    id="btn-header-signup"
                    onClick={() => onOpenAuth('CITIZEN', 'signup')}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 shadow-md shadow-cyan-500/20 transition cursor-pointer"
                  >
                    Sign Up
                  </button>
                </div>
              )}

              {/* Boot Telemetry Replay Button */}
              {onReplayBoot && (
                <button
                  onClick={onReplayBoot}
                  className="hidden xl:inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-cyan-500/20 bg-cyan-950/20 hover:bg-cyan-950/50 hover:border-cyan-400/40 text-[11px] font-mono-tech text-cyan-300 transition-all cursor-pointer shadow-2xs shrink-0"
                  title="Replay Citypulse Boot Telemetry"
                >
                  <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span className="hidden 2xl:inline tracking-wider">BOOT</span>
                </button>
              )}

              {/* Theme Mode Switcher Button (Compact Icon Button) */}
              <button
                id="btn-theme-toggle"
                onClick={toggleTheme}
                className={`p-2 rounded-lg flex items-center justify-center transition-all cursor-pointer border text-xs font-semibold shadow-sm select-none shrink-0 ${
                  theme === 'dark'
                    ? 'border-white/10 hover:border-amber-400/40 bg-white/5 hover:bg-white/10 text-slate-200'
                    : 'border-slate-300 hover:border-indigo-500/50 bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
                title={theme === 'dark' ? 'Switch to Day / Light Mode' : 'Switch to Cyber / Dark Mode'}
                aria-label="Toggle theme mode"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-300 transition-transform hover:rotate-45" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-600 transition-transform hover:-rotate-12" />
                )}
              </button>

              {/* Report Issue Button */}
              <button
                id="btn-report-issue-header"
                onClick={() => onNavigate('report')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-glass-primary text-white text-xs font-bold shadow-md cursor-pointer group shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5 text-cyan-300 transition-transform group-hover:rotate-90 duration-300" />
                <span className="hidden sm:inline">Lodge Signal</span>
                <span className="sm:hidden">Report</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#060713]/90 backdrop-blur-xl border-t border-white/10 shadow-2xl">
        <div className={`grid ${currentUser?.role === 'AUTHORITY' || currentUser?.role === 'ADMIN' ? 'grid-cols-6' : 'grid-cols-5'} items-center h-14`}>
          {navItems.filter(item => {
            if (item.id === 'authority' && currentUser?.role !== 'AUTHORITY' && currentUser?.role !== 'ADMIN') {
              return false;
            }
            return true;
          }).map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'citizen' && !currentUser) {
                    onOpenAuth('CITIZEN');
                  } else {
                    onNavigate(item.id);
                  }
                }}
                className={`flex flex-col items-center justify-center h-full text-[10px] font-medium transition-colors ${
                  isActive ? 'text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating + Report Button on Mobile */}
      <button
        id="btn-floating-report-mobile"
        onClick={() => onNavigate('report')}
        className="md:hidden fixed bottom-18 right-4 z-40 flex items-center gap-2 px-4 py-3 btn-glass-primary text-white rounded-full shadow-2xl font-bold text-xs active:scale-95 transition-transform"
      >
        <PlusCircle className="w-5 h-5 text-cyan-300" />
        <span>Signal</span>
      </button>
    </>
  );
};
