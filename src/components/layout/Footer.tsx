import React from 'react';
import { Compass, CheckCircle2, Shield, Sparkles } from 'lucide-react';
import { Vector12 } from '../common/DecorativeVectors';

interface FooterProps {
  onReplayBoot?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onReplayBoot }) => {
  const lifecycleSteps = [
    'Discover',
    'Report',
    'AI Analyze',
    'Locate',
    'Community Validate',
    'Prioritize',
    'Authority Action',
    'Status Update',
    'Resolve',
  ];

  return (
    <footer className="bg-white border-t border-[#E4E7EC] mt-16 pb-20 md:pb-8 pt-10 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Civic Intelligence Lifecycle Banner */}
        <div className="bg-[#F7F8FA] border border-[#E4E7EC] rounded-xl p-4 relative overflow-hidden">
          {/* Subtle panoramic Vector 12 lifecycle path */}
          <div className="absolute -bottom-3 right-0 w-96 h-16 opacity-15 text-[#123B5D] pointer-events-none hidden md:block">
            <Vector12 className="w-full h-full" />
          </div>
          <div className="flex items-center gap-2 mb-3 text-slate-800 font-semibold text-xs relative z-10">
            <Sparkles className="w-4 h-4 text-[#2F6F8F]" />
            <span>Civic Issue Intelligence Lifecycle</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {lifecycleSteps.map((step, idx) => (
              <React.Fragment key={step}>
                <span className="inline-flex items-center px-2 py-1 rounded bg-white border border-[#E4E7EC] text-[11px] font-medium text-slate-700 shadow-2xs">
                  {step}
                </span>
                {idx < lifecycleSteps.length - 1 && (
                  <span className="text-slate-400 text-[11px]">&rarr;</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Brand & info */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#123B5D] text-white flex items-center justify-center text-xs font-bold">
              <Compass className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-900">Citypulse</span>
            <span className="text-slate-400">|</span>
            <span>Send the signal. See the change.</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            {onReplayBoot && (
              <button
                onClick={onReplayBoot}
                className="hover:text-cyan-600 transition-colors font-mono text-[11px] flex items-center gap-1 cursor-pointer text-slate-500 font-semibold"
                title="Replay System Boot Sequence"
              >
                <span>⚡ Replay Boot Telemetry</span>
              </button>
            )}
            <span className="flex items-center gap-1 text-slate-600">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              Privacy & Anonymous Safe
            </span>
            <span className="flex items-center gap-1 text-slate-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
              Open Community Intelligence
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
