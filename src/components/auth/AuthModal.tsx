import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  User, 
  ShieldCheck, 
  Mail, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  MapPin,
  Calendar
} from 'lucide-react';
import { api, AuthUser } from '../../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: (user: AuthUser) => void;
  onSuccess?: (user: AuthUser) => void;
  initialRole?: 'CITIZEN' | 'AUTHORITY';
  defaultRole?: 'CITIZEN' | 'AUTHORITY';
  initialMode?: 'login' | 'signup';
  defaultMode?: 'login' | 'signup';
}

type FacialExpression = 'neutral' | 'happy' | 'sad';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  onSuccess,
  initialRole,
  defaultRole = 'CITIZEN',
  initialMode,
  defaultMode = 'login',
}) => {
  const effectiveRole = initialRole || defaultRole;
  const effectiveMode = initialMode || defaultMode;
  const [mode, setMode] = useState<'login' | 'signup'>(effectiveMode);
  const [selectedRole, setSelectedRole] = useState<'CITIZEN' | 'AUTHORITY'>(effectiveRole);
  const [hasChosenRole, setHasChosenRole] = useState<boolean>(true);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [area, setArea] = useState('');
  const [officerCode, setOfficerCode] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expression, setExpression] = useState<FacialExpression>('neutral');

  // Eye tracking coordinates
  const faceRef = useRef<HTMLDivElement | null>(null);
  const [eyeOffset, setEyeOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      const effRole = initialRole || defaultRole;
      const effMode = initialMode || defaultMode;
      setMode(effMode);
      setSelectedRole(effRole);
      setHasChosenRole(true);
      setErrorMessage(null);
      setExpression('neutral');

      // Clear all inputs on open
      setEmail('');
      setPassword('');
      setName('');
      setAge('');
      setArea('');
      setOfficerCode('');
    }
  }, [isOpen, initialRole, defaultRole, initialMode, defaultMode]);

  // Track cursor for the interactive eyes (Section 10)
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!faceRef.current) return;
      const rect = faceRef.current.getBoundingClientRect();
      const faceCenterX = rect.left + rect.width / 2;
      const faceCenterY = rect.top + rect.height / 2;

      const deltaX = e.clientX - faceCenterX;
      const deltaY = e.clientY - faceCenterY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const maxRadius = 6.5; // Keep pupils strictly within eye boundaries

      if (distance === 0) {
        setEyeOffset({ x: 0, y: 0 });
      } else {
        const ratio = Math.min(distance, 180) / 180;
        const angle = Math.atan2(deltaY, deltaX);
        const clampedRadius = ratio * maxRadius;
        setEyeOffset({
          x: Math.cos(angle) * clampedRadius,
          y: Math.sin(angle) * clampedRadius,
        });
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  if (!isOpen) return null;

  const handleSelectRole = (role: 'CITIZEN' | 'AUTHORITY') => {
    setSelectedRole(role);
    setHasChosenRole(true);
    setErrorMessage(null);
    setExpression('neutral');
    setEmail('');
    setPassword('');
    setOfficerCode('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (mode === 'signup') {
        const res = await api.signup({
          email,
          password,
          name,
          role: selectedRole,
          officerCode: selectedRole === 'AUTHORITY' ? officerCode : undefined,
          age: age ? Number(age) : undefined,
          area: area || undefined,
        });

        // SUCCESS EXPRESSION (Section 11)
        setExpression('happy');
        setTimeout(() => {
          setIsLoading(false);
          const notifySuccess = onAuthSuccess || onSuccess;
          if (notifySuccess) {
            notifySuccess(res.user);
          }
          onClose();
        }, 500);
      } else {
        const res = await api.login({
          email,
          password,
          targetRole: selectedRole,
        });

        // SUCCESS EXPRESSION (Section 11)
        setExpression('happy');
        setTimeout(() => {
          setIsLoading(false);
          const notifySuccess = onAuthSuccess || onSuccess;
          if (notifySuccess) {
            notifySuccess(res.user);
          }
          onClose();
        }, 500);
      }
    } catch (err: any) {
      // FAILURE EXPRESSION (Section 11)
      setExpression('sad');
      setIsLoading(false);
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="glass-modal w-full max-w-lg rounded-3xl p-6 sm:p-8 relative border border-violet-500/25 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header with Star Spark */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Citypulse Security Gateway</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {mode === 'login' ? 'Authentication Portal' : 'Create Citizen Account'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Send the signal. See the change.
          </p>
        </div>

        {/* INTERACTIVE CURSOR-FOLLOWING EYES AVATAR (Section 10 & 11) */}
        <div className="flex justify-center mb-6">
          <div
            ref={faceRef}
            className="w-24 h-24 rounded-2xl bg-[#0d1029] border border-violet-500/30 p-2.5 shadow-lg flex flex-col items-center justify-between relative transition-all duration-300"
            style={{
              boxShadow:
                expression === 'happy'
                  ? '0 0 25px 2px rgba(16, 185, 129, 0.4)'
                  : expression === 'sad'
                  ? '0 0 25px 2px rgba(239, 68, 68, 0.4)'
                  : '0 0 20px 0 rgba(139, 92, 246, 0.25)',
            }}
          >
            {/* Top Badge */}
            <span className="text-[9px] font-mono tracking-widest text-violet-300 uppercase">
              {selectedRole}
            </span>

            {/* Eyes Container */}
            <div className="flex items-center justify-center gap-3">
              {/* Left Eye */}
              <div className="w-6 h-6 rounded-full bg-slate-900 border border-violet-400/40 relative overflow-hidden flex items-center justify-center">
                <div
                  className="w-2.5 h-2.5 rounded-full bg-cyan-400 transition-transform duration-75"
                  style={{
                    transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
                    boxShadow: '0 0 6px #38bdf8',
                  }}
                />
              </div>

              {/* Right Eye */}
              <div className="w-6 h-6 rounded-full bg-slate-900 border border-violet-400/40 relative overflow-hidden flex items-center justify-center">
                <div
                  className="w-2.5 h-2.5 rounded-full bg-cyan-400 transition-transform duration-75"
                  style={{
                    transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
                    boxShadow: '0 0 6px #38bdf8',
                  }}
                />
              </div>
            </div>

            {/* Mouth / Facial Expression (Neutral, Happy, Sad) */}
            <div className="h-4 flex items-center justify-center">
              {expression === 'neutral' && (
                <div className="w-6 h-0.5 rounded-full bg-slate-400" />
              )}
              {expression === 'happy' && (
                <div className="w-6 h-2.5 border-b-2 border-emerald-400 rounded-b-full animate-bounce" />
              )}
              {expression === 'sad' && (
                <div className="w-6 h-2 border-t-2 border-rose-400 rounded-t-full" />
              )}
            </div>
          </div>
        </div>

        {/* ROLE SELECTION FOR LOGIN OR SIGNUP */}
        <div className="grid grid-cols-2 gap-2.5 mb-6 p-1 bg-white/5 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => handleSelectRole('CITIZEN')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              selectedRole === 'CITIZEN'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{mode === 'login' ? 'Citizen Login' : 'Citizen Sign Up'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectRole('AUTHORITY')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              selectedRole === 'AUTHORITY'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{mode === 'login' ? 'Officer / Admin' : 'Municipal Officer'}</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              {selectedRole === 'AUTHORITY' && (
                <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 space-y-2">
                  <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-bold">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>Officer Developer Authorization Code</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-cyan-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={officerCode}
                      onChange={(e) => setOfficerCode(e.target.value)}
                      placeholder="Enter developer authorization code"
                      className="glass-input w-full pl-10 pr-4 py-2 rounded-xl text-sm border-cyan-400/40 focus:border-cyan-400"
                    />
                  </div>
                  <p className="text-[11px] text-cyan-200/80">
                    This authorization code was provided by one of our developers.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={selectedRole === 'AUTHORITY' ? "Officer Alex Rivera" : "Alex Rivera"}
                    className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Age
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min="14"
                      max="120"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="28"
                      className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {selectedRole === 'AUTHORITY' ? 'Department / Ward' : 'Neighborhood / Area'}
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder={selectedRole === 'AUTHORITY' ? "Ward 7 - Sanitation" : "North Campus"}
                      className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              {mode === 'login' ? 'Email or Username' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={selectedRole === 'AUTHORITY' ? "Admin (or officer@citypulse.gov)" : "citizen@citypulse.gov"}
                className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-glass-primary w-full py-3 rounded-xl text-white text-sm font-bold shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : mode === 'login' ? (
              <>
                <span>Continue as {selectedRole === 'CITIZEN' ? 'Citizen' : 'Municipal Officer'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>
                  {selectedRole === 'AUTHORITY' 
                    ? 'Verify & Register Municipal Officer' 
                    : 'Complete Citizen Registration'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle between Login and Signup */}
        <div className="mt-6 text-center border-t border-white/10 pt-4 text-xs text-slate-400">
          {mode === 'login' ? (
            <span>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMessage(null);
                  setExpression('neutral');
                }}
                className="text-violet-400 hover:text-violet-300 font-bold underline ml-1 cursor-pointer"
              >
                Sign Up as Citizen
              </button>
            </span>
          ) : (
            <span>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                  setExpression('neutral');
                }}
                className="text-violet-400 hover:text-violet-300 font-bold underline ml-1 cursor-pointer"
              >
                Back to Login
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
