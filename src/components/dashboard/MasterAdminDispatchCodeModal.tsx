import React, { useState } from 'react';
import { 
  X, 
  Key, 
  Copy, 
  Check, 
  Clock, 
  ShieldAlert, 
  Sparkles, 
  Trash2, 
  Radio, 
  Lock,
  RefreshCw,
  Users,
  Infinity as InfinityIcon,
  Timer,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { api, AuthUser } from '../../services/api';

interface MasterAdminDispatchCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  activeCodes: any[];
  onRefreshCodes: () => void;
  nowTimestamp: number;
  officers?: AuthUser[];
}

export const MasterAdminDispatchCodeModal: React.FC<MasterAdminDispatchCodeModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  activeCodes,
  onRefreshCodes,
  nowTimestamp,
  officers = [],
}) => {
  const [assignedEmail, setAssignedEmail] = useState('authority@citypulse.gov');
  const [note, setNote] = useState('');
  const [codeType, setCodeType] = useState<'TIMER' | 'PERMANENT'>('TIMER');
  const [usageType, setUsageType] = useState<'SINGLE_USE' | 'MULTI_USE'>('SINGLE_USE');
  const [filterTab, setFilterTab] = useState<'all' | 'timer' | 'permanent'>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [latestCode, setLatestCode] = useState<{
    code: string;
    assignedToEmail: string;
    assignedToName?: string;
    expiresAt: string | null;
    expiresInSeconds: number | null;
    codeType: 'TIMER' | 'PERMANENT';
    usageType: 'SINGLE_USE' | 'MULTI_USE';
    isPermanent: boolean;
    generatedBy: string;
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isMasterAdmin = currentUser.role === 'ADMIN' || currentUser.id === 'admin_master_001' || currentUser.email === 'admin@citypulse.gov';

  if (!isMasterAdmin) {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
        <div className="relative glass-card bg-slate-950 border border-rose-500/50 p-6 rounded-3xl max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Master Admin Access Required</h3>
          <p className="text-xs text-slate-300">
            Emergency dispatch code generation is restricted exclusively to Master Administrators.
          </p>
          <button onClick={onClose} className="btn-glass-primary px-6 py-2 rounded-xl text-xs font-bold text-white w-full">
            Close
          </button>
        </div>
      </div>
    );
  }

  const formatTimeRemaining = (expiresAtMs: number | null | undefined, cType?: string) => {
    if (cType === 'PERMANENT' || !expiresAtMs) return '♾️ Permanent (No Time Limit)';
    const diff = Math.max(0, Math.floor((expiresAtMs - nowTimestamp) / 1000));
    if (diff <= 0) return 'Expired';
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes}m ${seconds < 10 ? '0' : ''}${seconds}s`;
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!assignedEmail.trim()) {
      setErrorMsg('Please enter the registered email address of the Municipal Officer.');
      return;
    }

    try {
      setIsGenerating(true);
      setErrorMsg(null);
      const res = await api.generateDispatchCode(
        assignedEmail.trim().toLowerCase(), 
        note.trim() || undefined,
        codeType,
        usageType
      );
      setLatestCode(res);
      setIsCopied(false);
      setNote('');
      onRefreshCodes();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate dispatch authorization code');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevoke = async (code: string) => {
    try {
      await api.revokeDispatchCode(code);
      onRefreshCodes();
      if (latestCode && latestCode.code === code) {
        setLatestCode(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to revoke code');
    }
  };

  // Filtered active codes based on tab
  const filteredCodes = activeCodes.filter((c) => {
    const isPerm = c.codeType === 'PERMANENT' || c.expiresAt === null;
    if (filterTab === 'permanent') return isPerm;
    if (filterTab === 'timer') return !isPerm;
    return true;
  });

  const timerCount = activeCodes.filter((c) => c.codeType !== 'PERMANENT' && c.expiresAt !== null).length;
  const permCount = activeCodes.filter((c) => c.codeType === 'PERMANENT' || c.expiresAt === null).length;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl animate-fade-in"
        onClick={onClose} 
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl rounded-3xl p-6 sm:p-8 glass-modal bg-gradient-to-b from-[#140e24] via-[#0c0a17] to-[#060713] border border-purple-500/40 shadow-2xl text-white animate-scale-up space-y-6 my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Header with Close Button */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-purple-600 p-0.5 shadow-lg shadow-purple-500/30 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-300">
                <Key className="w-6 h-6 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  MASTER ADMIN EXCLUSIVE
                </span>
                <span className="text-[11px] text-purple-300 font-mono">EMERGENCY CLEARANCE HUB</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                Officer Dispatch Code Generator
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Municipal Officers require Master Admin authorization to broadcast city-wide emergency alerts. You can generate either a <strong className="text-amber-300">10-minute timer code</strong> or a <strong className="text-emerald-300">permanent code (no time limit)</strong> bound exclusively to an officer's registered email. Both codes can be separately generated for different users.
        </p>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-bold">
            {errorMsg}
          </div>
        )}

        {/* Code Generator Form */}
        <form onSubmit={handleGenerate} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
          
          {/* Option Selection: Timer vs Permanent */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              Select Clearance Code Type *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: 10-Minute Timer */}
              <button
                type="button"
                onClick={() => setCodeType('TIMER')}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer relative ${
                  codeType === 'TIMER'
                    ? 'bg-amber-950/50 border-amber-400/80 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Timer className={`w-4 h-4 ${codeType === 'TIMER' ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
                    <span className={`text-xs font-black uppercase tracking-wider ${codeType === 'TIMER' ? 'text-amber-300' : 'text-slate-300'}`}>
                      10-Minute Timer
                    </span>
                  </div>
                  {codeType === 'TIMER' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Active 10-minute countdown timer. Single-use, automatically expires upon broadcast or after 10 minutes.
                </p>
              </button>

              {/* Option 2: Permanent Code (No Time Limit) */}
              <button
                type="button"
                onClick={() => setCodeType('PERMANENT')}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer relative ${
                  codeType === 'PERMANENT'
                    ? 'bg-cyan-950/50 border-cyan-400/80 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <InfinityIcon className={`w-4 h-4 ${codeType === 'PERMANENT' ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span className={`text-xs font-black uppercase tracking-wider ${codeType === 'PERMANENT' ? 'text-cyan-300' : 'text-slate-300'}`}>
                      Permanent Code
                    </span>
                  </div>
                  {codeType === 'PERMANENT' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  No time limit to use this code. Works indefinitely until used by the designated officer.
                </p>
              </button>
            </div>
          </div>

          {/* Usage Rule Selector (Single-Use vs Standing Multi-Use) */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-slate-200 block">Usage Consumption Policy:</span>
              <span className="text-[11px] text-slate-400">
                {usageType === 'SINGLE_USE'
                  ? 'Passcode is consumed & completed upon first emergency broadcast.'
                  : 'Standing permanent authority. Can be reused for multiple broadcasts until revoked.'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setUsageType('SINGLE_USE')}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  usageType === 'SINGLE_USE'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Single-Use
              </button>
              <button
                type="button"
                onClick={() => setUsageType('MULTI_USE')}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  usageType === 'MULTI_USE'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Multi-Use Standing
              </button>
            </div>
          </div>

          {/* Officer Email Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Recipient Municipal Officer Registered Email *
            </label>
            <input
              type="email"
              required
              value={assignedEmail}
              onChange={(e) => setAssignedEmail(e.target.value)}
              placeholder="e.g. authority@citypulse.gov"
              className="glass-input w-full px-4 py-2.5 rounded-xl text-xs"
            />
            
            {/* Quick Officer Suggestion Chips if officers provided */}
            {officers.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] text-slate-400 font-semibold mr-1">Quick select officer:</span>
                {officers.slice(0, 4).map((officer) => (
                  <button
                    key={officer.id || officer.email}
                    type="button"
                    onClick={() => setAssignedEmail(officer.email)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition cursor-pointer border ${
                      assignedEmail.toLowerCase() === officer.email.toLowerCase()
                        ? 'bg-purple-500/30 text-purple-200 border-purple-400/50 font-bold'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                    }`}
                  >
                    {officer.name} ({officer.email})
                  </button>
                ))}
              </div>
            )}

            <span className="text-[11px] text-slate-400 block mt-1">
              Only the account registered with this email will be able to see and use this authorization code.
            </span>
          </div>

          {/* Squad / Mission Note */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Squad / Mission Note (Optional):
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Flash Flood Unit Sector 4 Dispatch or Standing Field Authority"
              className="glass-input w-full px-4 py-2.5 rounded-xl text-xs"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isGenerating}
            className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-lg disabled:opacity-50 ${
              codeType === 'PERMANENT'
                ? 'bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/20'
                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-slate-950 shadow-amber-500/20'
            }`}
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>
              {isGenerating 
                ? 'Generating Exclusive Clearance...' 
                : codeType === 'PERMANENT'
                  ? '♾️ Issue Permanent Authorization Code (No Time Limit)'
                  : '⚡ Issue 10-Minute Authorization Code'}
            </span>
          </button>
        </form>

        {/* Newly Generated Code Callout Card */}
        {latestCode && (
          <div className={`p-5 rounded-2xl border shadow-2xl space-y-3 animate-fade-in ${
            latestCode.isPermanent
              ? 'bg-gradient-to-r from-cyan-950/70 via-slate-900 to-teal-950/70 border-cyan-400/60 shadow-cyan-500/20'
              : 'bg-gradient-to-r from-amber-950/60 via-slate-900 to-purple-950/60 border-amber-400/60 shadow-amber-500/20'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                latestCode.isPermanent ? 'text-cyan-300' : 'text-amber-300'
              }`}>
                <Radio className={`w-3.5 h-3.5 animate-pulse ${latestCode.isPermanent ? 'text-cyan-400' : 'text-amber-400'}`} />
                <span>
                  {latestCode.isPermanent ? '♾️ Newly Issued Permanent Dispatch Passcode' : '⏱️ Newly Issued 10-Minute Passcode'}
                </span>
              </span>
              
              <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md border ${
                latestCode.isPermanent
                  ? 'text-cyan-300 bg-cyan-950/80 border-cyan-400/50'
                  : 'text-amber-400 bg-black/40 border-amber-400/30'
              }`}>
                {latestCode.isPermanent 
                  ? '♾️ NO TIME LIMIT' 
                  : `⏱️ ${formatTimeRemaining(latestCode.expiresAt ? new Date(latestCode.expiresAt).getTime() : null, 'TIMER')}`}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-black/60 rounded-xl border border-white/10">
              <div>
                <span className={`font-mono text-2xl sm:text-3xl font-black tracking-widest block ${
                  latestCode.isPermanent ? 'text-cyan-300' : 'text-amber-300'
                }`}>
                  {latestCode.code}
                </span>
                <span className="text-[11px] text-slate-300 mt-1 block">
                  👤 Assigned Exclusively to: <strong className="text-cyan-300">{latestCode.assignedToName || latestCode.assignedToEmail}</strong> ({latestCode.assignedToEmail})
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {latestCode.usageType === 'MULTI_USE' 
                    ? 'Standing Multi-Use • Reusable until manually revoked' 
                    : latestCode.isPermanent 
                      ? 'Permanent Single-Use • No time limit • Consumes upon dispatch' 
                      : 'Single-use • Expires automatically after 10 minutes or upon dispatch'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(latestCode.code);
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 2500);
                }}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${
                  isCopied
                    ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                    : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                }`}
              >
                {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{isCopied ? 'Copied to Clipboard!' : 'Copy Passcode'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Active Codes Ledger */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Live Active Authorization Codes ({activeCodes.length})</span>
            </h4>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-[11px]">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`px-2.5 py-0.5 rounded-lg font-bold transition cursor-pointer ${
                  filterTab === 'all' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({activeCodes.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('timer')}
                className={`px-2.5 py-0.5 rounded-lg font-bold transition cursor-pointer ${
                  filterTab === 'timer' ? 'bg-amber-500/30 text-amber-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                ⏱️ Timed ({timerCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('permanent')}
                className={`px-2.5 py-0.5 rounded-lg font-bold transition cursor-pointer ${
                  filterTab === 'permanent' ? 'bg-cyan-500/30 text-cyan-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                ♾️ Permanent ({permCount})
              </button>
              <button
                type="button"
                onClick={onRefreshCodes}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer ml-1"
                title="Refresh ledger"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>

          {filteredCodes.length === 0 ? (
            <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-center text-xs text-slate-400">
              No active authorization codes found for this view. Use the generator above to issue passcodes for Municipal Officers.
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {filteredCodes.map((c) => {
                const isPerm = c.codeType === 'PERMANENT' || c.expiresAt === null;
                const timeLeft = formatTimeRemaining(c.expiresAt, c.codeType);
                const isExpired = !isPerm && timeLeft === 'Expired';
                return (
                  <div
                    key={c.code}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-xs hover:bg-white/10 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-mono font-bold text-sm ${isPerm ? 'text-cyan-300' : 'text-amber-300'}`}>
                        {c.code}
                      </span>
                      
                      <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                        isPerm 
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                          : isExpired 
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {timeLeft}
                      </span>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-300 border border-white/10">
                        {c.usageType === 'MULTI_USE' ? 'Multi-Use' : 'Single-Use'}
                      </span>

                      <div className="text-[11px] text-slate-300">
                        <span className="text-cyan-300 font-semibold">{c.assignedToEmail}</span>
                        {c.note && <span className="text-[10px] text-slate-400 block">{c.note}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(c.code);
                          alert(`Code "${c.code}" copied to clipboard!`);
                        }}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
                        title="Copy code"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRevoke(c.code)}
                        className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition cursor-pointer"
                        title="Revoke code immediately"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-white/10">
          <span>Master Administrator Clearance Verified</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition cursor-pointer"
          >
            Done / Close
          </button>
        </div>
      </div>
    </div>
  );
};
