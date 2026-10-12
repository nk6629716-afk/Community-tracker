import React, { useEffect } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Radio, 
  Clock, 
  UserCheck, 
  Building2, 
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { EmergencyBroadcastPayload } from '../../services/socket';

interface EmergencyAlertModalProps {
  alert: EmergencyBroadcastPayload | null;
  onClose: () => void;
}

export const EmergencyAlertModal: React.FC<EmergencyAlertModalProps> = ({ alert, onClose }) => {
  useEffect(() => {
    if (!alert) return;

    // Trigger gentle civic emergency alert chime safely via Web Audio API
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        // Beep 1
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(alert.severity === 'critical' ? 880 : 660, now);
        gain1.gain.setValueAtTime(0.12, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.35);

        // Beep 2 (civic high pitch chime)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(alert.severity === 'critical' ? 1046.5 : 880, now + 0.18);
        gain2.gain.setValueAtTime(0.14, now + 0.18);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.18);
        osc2.stop(now + 0.55);
      }
    } catch (e) {
      // Audio playback might be silenced by browser policy before user interaction
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [alert, onClose]);

  if (!alert) return null;

  const isCritical = alert.severity === 'critical';
  const formattedTime = new Date(alert.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const formattedDate = new Date(alert.timestamp).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Dynamic Pulsing Backdrop Strobe */}
      <div 
        className={`fixed inset-0 backdrop-blur-xl transition-all duration-500 ${
          isCritical 
            ? 'bg-rose-950/80 animate-pulse' 
            : 'bg-amber-950/80'
        }`}
        onClick={onClose}
      />

      {/* Flashing Ambient Glow Rays */}
      <div 
        className={`fixed inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] ${
          isCritical 
            ? 'from-red-600/40 via-rose-900/20 to-transparent animate-pulse' 
            : 'from-amber-500/30 via-orange-950/20 to-transparent'
        }`} 
      />

      {/* Modal Dialog Card */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="emergency-modal-title"
        className={`relative w-full max-w-2xl rounded-3xl p-6 sm:p-9 shadow-[0_0_80px_rgba(0,0,0,0.8)] border transition-all duration-300 transform scale-100 ${
          isCritical
            ? 'bg-gradient-to-b from-[#1c080b] via-[#120507] to-[#0a0203] border-red-500/60 shadow-red-500/20'
            : 'bg-gradient-to-b from-[#1c1205] via-[#120b03] to-[#0a0601] border-amber-500/60 shadow-amber-500/20'
        }`}
      >
        {/* Animated Warning Beacon Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div 
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg animate-bounce ${
                isCritical 
                  ? 'bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-red-500/40' 
                  : 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-amber-500/40'
              }`}
            >
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span 
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${
                    isCritical
                      ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  <Radio className="w-3 h-3 animate-spin" />
                  <span>{isCritical ? 'CRITICAL EMERGENCY SIGNAL' : 'HIGH CIVIC ADVISORY'}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">LIVE MESH BROADCAST</span>
              </div>
              <h2 id="emergency-modal-title" className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                City-Wide Emergency Dispatch
              </h2>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between text-right text-xs text-slate-400">
            <div className="flex items-center gap-1 text-slate-300 font-mono font-semibold">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{formattedTime}</span>
            </div>
            <span className="text-[11px] text-slate-400">{formattedDate}</span>
          </div>
        </div>

        {/* Advisory Message Text Container */}
        <div className="my-6">
          <div 
            className={`p-5 sm:p-6 rounded-2xl border backdrop-blur-md ${
              isCritical
                ? 'bg-red-950/40 border-red-500/30 text-red-50 shadow-inner shadow-red-950/60'
                : 'bg-amber-950/40 border-amber-500/30 text-amber-50 shadow-inner shadow-amber-950/60'
            }`}
          >
            <p className="text-base sm:text-lg font-bold leading-relaxed tracking-wide whitespace-pre-wrap select-text">
              {alert.message}
            </p>
          </div>
        </div>

        {/* Dispatched By & Authority Verification Block */}
        <div className="rounded-2xl p-4 bg-white/5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
              <span>Official Transmission Metadata</span>
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 border border-cyan-800/60 px-2 py-0.5 rounded-md">
              VERIFIED DISPATCH
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Sender Name & Role */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-start gap-2.5">
              <UserCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                  Dispatched By
                </span>
                <span className="font-bold text-white text-sm block">
                  {(() => {
                    const raw = alert.author || 'Master Administrator';
                    const cleaned = raw
                      .replace(/\(?\s*nikhil11237y\s*\)?/gi, '')
                      .replace(/\([^)]*nikhil11237y[^)]*\)/gi, '')
                      .replace(/\s+/g, ' ')
                      .trim();
                    if (!cleaned || cleaned.toLowerCase().includes('master admin')) {
                      return 'Master Administrator';
                    }
                    return cleaned;
                  })()}
                </span>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-cyan-200 border border-white/10">
                  {alert.authorRole || '👑 Master Administrator'}
                </span>
              </div>
            </div>

            {/* Department & Clearance Level */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-start gap-2.5">
              <Building2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                  Jurisdiction / Department
                </span>
                <span className="font-medium text-slate-200 block text-xs truncate">
                  {alert.authorDepartment || 'Executive City Operations Division'}
                </span>
                <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  <ShieldCheck className="w-3 h-3 text-purple-300" />
                  <span>Verified Executive Clearance</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button: OK, I Understand */}
        <div className="mt-7 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer shadow-xl ${
              isCritical
                ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 text-white shadow-red-600/30 border border-red-400/50 hover:scale-[1.02] active:scale-95'
                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-500/30 border border-amber-300/60 hover:scale-[1.02] active:scale-95'
            }`}
          >
            <CheckCircle2 className={`w-5 h-5 stroke-[2.5] ${isCritical ? 'text-white' : 'text-slate-950'}`} />
            <span>OK, I Understand</span>
          </button>
        </div>
      </div>
    </div>
  );
};
