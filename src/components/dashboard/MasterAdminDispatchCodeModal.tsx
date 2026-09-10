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
  Users
} from 'lucide-react';
import { api, AuthUser } from '../../services/api';

interface MasterAdminDispatchCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  activeCodes: any[];
  onRefreshCodes: () => void;
  nowTimestamp: number;
}

export const MasterAdminDispatchCodeModal: React.FC<MasterAdminDispatchCodeModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  activeCodes,
  onRefreshCodes,
  nowTimestamp,
}) => {
  const [assignedEmail, setAssignedEmail] = useState('authority@citypulse.gov');
  const [note, setNote] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [latestCode, setLatestCode] = useState<{
    code: string;
    assignedToEmail: string;
    assignedToName?: string;
    expiresAt: string;
    expiresInSeconds: number;
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
            This 10-minute dispatch code generator dialogue is restricted exclusively to Master Administrators.
          </p>
          <button onClick={onClose} className="btn-glass-primary px-6 py-2 rounded-xl text-xs font-bold text-white w-full">
            Close
          </button>
        </div>
      </div>
    );
  }

  const formatTimeRemaining = (expiresAtMs: number) => {
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
      const res = await api.generateDispatchCode(assignedEmail.trim().toLowerCase(), note.trim() || undefined);
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

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl animate-fade-in"
        onClick={onClose} 
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-[#140e24] via-[#0c0a17] to-[#060713] border border-purple-500/40 shadow-[0_0_80px_rgba(147,51,234,0.25)] text-white animate-scale-up space-y-6">
        
        {/* Header with Close Button */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-purple-600 p-0.5 shadow-lg shadow-purple-500/30">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-300">
                <Key className="w-6 h-6 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  MASTER ADMIN EXCLUSIVE
                </span>
                <span className="text-[11px] text-purple-300 font-mono">SUPREME CIVIC AUTHORITY</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                10-Minute Officer Dispatch Code Generator
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
          Municipal Officers cannot broadcast city-wide alerts directly. Issue a 
          <strong className="text-amber-300"> 10-minute single-use passcode </strong> 
          assigned <strong className="text-cyan-300">exclusively to the officer's registered email</strong>. The code will only be visible to that designated officer and will expire immediately upon dispatch.
        </p>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-bold">
            {errorMsg}
          </div>
        )}

        {/* Code Generator Form */}
        <form onSubmit={handleGenerate} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
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
            <span className="text-[11px] text-slate-400 block mt-1">
              Only the account registered with this email will be able to see and use this authorization code.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Squad / Mission Note (Optional):
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Flash Flood Unit Sector 4 Dispatch"
              className="glass-input w-full px-4 py-2.5 rounded-xl text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>{isGenerating ? 'Generating Exclusive Clearance...' : '⚡ Issue 10-Minute Authorization Code'}</span>
          </button>
        </form>

        {/* Newly Generated Code Callout Card */}
        {latestCode && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-purple-950/60 border border-amber-400/60 shadow-2xl space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Newly Issued Dispatch Passcode</span>
              </span>
              <span className="text-[11px] font-mono font-bold text-amber-400 bg-black/40 px-2.5 py-0.5 rounded-md border border-amber-400/30">
                ⏱️ {formatTimeRemaining(new Date(latestCode.expiresAt).getTime())}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-black/60 rounded-xl border border-white/10">
              <div>
                <span className="font-mono text-2xl sm:text-3xl font-black text-amber-300 tracking-widest block">
                  {latestCode.code}
                </span>
                <span className="text-[11px] text-slate-300 mt-1 block">
                  👤 Assigned Exclusively to: <strong className="text-cyan-300">{latestCode.assignedToName || latestCode.assignedToEmail}</strong> ({latestCode.assignedToEmail})
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Single-use only • Expires automatically immediately upon dispatch or after 10 minutes
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
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Live Active Authorization Codes ({activeCodes.length})</span>
            </h4>
            <button
              onClick={onRefreshCodes}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          {activeCodes.length === 0 ? (
            <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-center text-xs text-slate-400">
              No active 10-minute dispatch codes currently live. Use the generator above to issue a temporary passcode for a specific Municipal Officer.
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {activeCodes.map((c) => {
                const timeLeft = formatTimeRemaining(c.expiresAt);
                const isExpired = timeLeft === 'Expired';
                return (
                  <div
                    key={c.code}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-amber-300 text-sm">{c.code}</span>
                      <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                        isExpired ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {timeLeft}
                      </span>
                      <div className="text-[11px] text-slate-300">
                        <span className="text-cyan-300 font-semibold">{c.assignedToEmail}</span>
                        {c.note && <span className="text-[10px] text-slate-400 block">{c.note}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(c.code);
                          alert(`Code "${c.code}" copied to clipboard!`);
                        }}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
                        title="Copy code"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRevoke(c.code)}
                        className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition"
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
