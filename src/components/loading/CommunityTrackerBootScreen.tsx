import React, { useState, useEffect, useMemo } from 'react';
import { Radio, CheckCircle2, Navigation, Activity } from 'lucide-react';

interface BootScreenProps {
  onComplete: () => void;
  isDataReady?: boolean;
}

interface TerminalLog {
  time: string;
  tag: string;
  tagColor: string;
  message: string;
}

// City Block representation in the abstract digital network
interface CityBlock {
  id: string;
  sector: string;
  type: 'citizen_signal' | 'active_incident' | 'authority_dispatch' | 'resolved_node' | 'transit_hub' | 'idle_grid';
  label: string;
  latLng: string;
  intensity: number; // 0 to 1
  active: boolean;
}

export const CommunityTrackerBootScreen: React.FC<BootScreenProps> = ({
  onComplete,
  isDataReady = true,
}) => {
  const [progress, setProgress] = useState<number>(12);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [activePacketIndex, setActivePacketIndex] = useState<number>(0);

  // Initialize clock and update every second
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      setCurrentTimeStr(`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // System Terminal Sequence Logs
  const baseTime = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }, []);

  const terminalLogs: TerminalLog[] = useMemo(() => [
    {
      time: `${baseTime}:10`,
      tag: 'INGEST',
      tagColor: 'text-cyan-300 border-cyan-500/40 bg-cyan-950/40',
      message: 'COMMUNITY SIGNAL DETECTED — INITIATING CIVIC HANDSHAKE ...',
    },
    {
      time: `${baseTime}:13`,
      tag: 'TELEMETRY',
      tagColor: 'text-blue-300 border-blue-500/40 bg-blue-950/40',
      message: 'INITIALIZING DIGITAL CITY INFRASTRUCTURE & SECTORS ...',
    },
    {
      time: `${baseTime}:16`,
      tag: 'STREAM',
      tagColor: 'text-teal-300 border-teal-500/40 bg-teal-950/40',
      message: 'CONNECTING LIVE REPORT MESH (SOCKET.IO PROTOCOL) ...',
    },
    {
      time: `${baseTime}:19`,
      tag: 'GEOMAP',
      tagColor: 'text-amber-300 border-amber-500/40 bg-amber-950/40',
      message: 'SYNCHRONIZING 1,420+ GEOSPATIAL NODES & INCIDENT RADAR ...',
    },
    {
      time: `${baseTime}:22`,
      tag: 'AI_TRIAGE',
      tagColor: 'text-cyan-200 border-cyan-400/40 bg-cyan-950/50',
      message: 'AI SEVERITY PIPELINE & MUNICIPAL DISPATCH ENGINE ARMED ...',
    },
    {
      time: `${baseTime}:25`,
      tag: 'READY',
      tagColor: 'text-emerald-300 border-emerald-500/40 bg-emerald-950/40',
      message: 'COMMUNITY NETWORK ONLINE — MUNICIPAL COMMAND SYNCHRONIZED.',
    },
  ], [baseTime]);

  // Digital City Grid Sector Blocks (3x3 grid for optimal spatial balance)
  const [cityBlocks, setCityBlocks] = useState<CityBlock[]>([
    { id: 'b-1', sector: 'SEC-01', type: 'citizen_signal', label: 'Citizen Ingest Hub', latLng: '28.6139° N, 77.2090° E', intensity: 0.9, active: true },
    { id: 'b-2', sector: 'SEC-02', type: 'transit_hub', label: 'Civic Data Corridor', latLng: '28.6180° N, 77.2140° E', intensity: 0.6, active: true },
    { id: 'b-3', sector: 'SEC-03', type: 'active_incident', label: 'Pothole Alert (P1)', latLng: '28.6210° N, 77.2020° E', intensity: 0.95, active: true },
    { id: 'b-4', sector: 'SEC-04', type: 'resolved_node', label: 'Waterline Restored', latLng: '28.6090° N, 77.2190° E', intensity: 0.8, active: true },
    { id: 'b-5', sector: 'SEC-05', type: 'authority_dispatch', label: 'Crew Squad Bravo', latLng: '28.6250° N, 77.2110° E', intensity: 0.85, active: true },
    { id: 'b-6', sector: 'SEC-06', type: 'idle_grid', label: 'South Ward Substation', latLng: '28.6010° N, 77.2050° E', intensity: 0.4, active: false },
    { id: 'b-7', sector: 'SEC-07', type: 'citizen_signal', label: 'Streetlight Signal', latLng: '28.6160° N, 77.2280° E', intensity: 0.75, active: true },
    { id: 'b-8', sector: 'SEC-08', type: 'transit_hub', label: 'Smart Grid Junction', latLng: '28.6290° N, 77.2180° E', intensity: 0.5, active: true },
    { id: 'b-9', sector: 'SEC-09', type: 'resolved_node', label: 'Debris Cleared', latLng: '28.6070° N, 77.2310° E', intensity: 0.9, active: true },
  ]);

  // Handle smooth cinematic exit transition
  const handleExit = () => {
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 1100);
  };

  // Keyboard shortcut: ESC, Space, or Enter to skip/enter immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Drive progressive initialization sequence with deliberate, cinematic pacing
  useEffect(() => {
    const stepDuration = 880; // ms per step for smooth, readable pacing
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next >= terminalLogs.length) {
          setProgress(100);
          clearInterval(interval);
          // Pause smoothly on 100% complete before dissolving into dashboard
          setTimeout(() => {
            handleExit();
          }, 2000);
          return terminalLogs.length - 1;
        }
        setProgress(Math.min(97, Math.round((next / (terminalLogs.length - 1)) * 95)));
        return next;
      });
    }, stepDuration);

    return () => clearInterval(interval);
  }, [terminalLogs.length]);

  // Animate packets flowing between city sectors
  useEffect(() => {
    const packetInterval = setInterval(() => {
      setActivePacketIndex((prev) => (prev + 1) % cityBlocks.length);
      setCityBlocks((prev) =>
        prev.map((block, idx) => {
          if (idx === activePacketIndex) {
            return { ...block, active: true, intensity: Math.min(1, block.intensity + 0.1) };
          }
          return block;
        })
      );
    }, 550);

    return () => clearInterval(packetInterval);
  }, [activePacketIndex, cityBlocks.length]);

  return (
    <div
      className={`fixed inset-0 z-[9999] h-screen max-h-screen w-screen bg-[#07080b] text-[#e2e8f0] font-mono-tech select-none overflow-hidden flex flex-col justify-between transition-all duration-1000 ease-out ${
        isExiting ? 'opacity-0 scale-[1.03] pointer-events-none filter blur-[14px]' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background Engineering Coordinate Grid */}
      <div className="absolute inset-0 bg-tech-grid pointer-events-none opacity-90" />
      
      {/* Subtle CRT / Radar Scanline Overlay */}
      <div className="absolute inset-0 tech-scanlines opacity-35 pointer-events-none" />

      {/* Blueprint Corner Markers */}
      <div className="absolute top-2.5 left-3 text-slate-700 text-[9px] pointer-events-none select-none tracking-tighter">
        +-- CT-SYS-NW --+
      </div>
      <div className="absolute top-2.5 right-3 text-slate-700 text-[9px] pointer-events-none select-none tracking-tighter">
        +-- CT-SYS-NE --+
      </div>
      <div className="absolute bottom-2.5 left-3 text-slate-700 text-[9px] pointer-events-none select-none tracking-tighter">
        +-- CT-SYS-SW --+
      </div>
      <div className="absolute bottom-2.5 right-3 text-slate-700 text-[9px] pointer-events-none select-none tracking-tighter">
        +-- CT-SYS-SE --+
      </div>

      {/* ========================================================================= */}
      {/* 1. TOP HEADER IDENTITY BAR                                                */}
      {/* ========================================================================= */}
      <header className="relative z-10 w-full px-5 sm:px-8 pt-4 pb-3 flex items-center justify-between border-b border-white/[0.06]">
        {/* Left: Minimalist Community Tracker Wordmark */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-6 h-6 rounded border border-cyan-400/60 bg-cyan-950/40 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.3)]">
            <Radio className="w-3 h-3 text-cyan-300 animate-pulse" />
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold tracking-[0.2em] text-white">
                COMMUNITY TRACKER
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.2 text-[8px] font-semibold tracking-wider text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 rounded">
                v2.4 MESH
              </span>
            </div>
            <p className="text-[9px] text-slate-400 tracking-widest hidden md:block">
              SEND THE SIGNAL. SEE THE CHANGE.
            </p>
          </div>
        </div>

        {/* Right: Live Telemetry Status & Skip Action */}
        <div className="flex items-center gap-3 sm:gap-5 text-xs text-slate-400">
          <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="text-slate-500">CLOCK:</span>
            <span className="text-slate-200 font-semibold">{currentTimeStr || '00:00:00'}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-cyan-300 bg-cyan-950/30 border border-cyan-500/30 px-2 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="tracking-wider">
              {progress >= 100 ? 'SYSTEM READY' : 'CALIBRATING'}
            </span>
          </div>

          {/* Interactive Skip Button */}
          <button
            onClick={handleExit}
            className="text-[10px] text-slate-300 hover:text-white border border-white/10 hover:border-cyan-400/50 hover:bg-cyan-950/30 px-2.5 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1"
            title="Press ESC to enter"
          >
            <span>SKIP BOOT</span>
            <span className="text-[8px] text-slate-300 bg-white/10 px-1 rounded">[ESC]</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN SYSTEM COMPOSITION (Two Balanced Columns Side-by-Side)            */}
      {/* ========================================================================= */}
      <main className="relative z-10 flex-1 min-h-0 w-full px-5 sm:px-8 py-3 sm:py-4 grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-8 items-center max-w-7xl mx-auto overflow-y-auto">
        
        {/* --------------------------------------------------------------------- */}
        {/* LEFT COLUMN: Terminal Logs & Stylized ASCII Wireframe Graphic         */}
        {/* --------------------------------------------------------------------- */}
        <div className="md:col-span-6 flex flex-col justify-center space-y-4">
          
          {/* Terminal Stream Feed */}
          <div className="space-y-2 bg-black/40 border border-white/[0.07] rounded-xl p-3 sm:p-4 backdrop-blur-md">
            <div className="flex items-center justify-between text-[9px] text-slate-300 border-b border-white/[0.06] pb-1.5 mb-2">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 inline-block" />
                <span>TERMINAL TELEMETRY STREAM // PROTOCOL: CIVIC_WS</span>
              </span>
              <span className="text-cyan-400/80">LIVE FEED</span>
            </div>

            <div className="space-y-1.5 min-h-[115px]">
              {terminalLogs.slice(0, currentStep + 1).map((log, idx) => {
                const isLatest = idx === currentStep;
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 text-[11px] tracking-tight transition-all duration-300 ${
                      isLatest ? 'text-slate-100 font-medium' : 'text-slate-300'
                    }`}
                  >
                    <span className="text-[10px] text-slate-300 shrink-0 font-mono">
                      {log.time}
                    </span>
                    <span
                      className={`text-[8px] font-bold px-1.5 py-0.2 rounded border shrink-0 tracking-wider ${log.tagColor}`}
                    >
                      {log.tag}
                    </span>
                    <span className="leading-snug break-words">
                      {log.message}
                    </span>
                  </div>
                );
              })}

              {/* Blinking Block Cursor */}
              <div className="flex items-center gap-1.5 pt-0.5 text-cyan-400 text-[11px]">
                <span className="text-slate-400 text-[10px]">{currentTimeStr}</span>
                <span className="text-cyan-400 animate-terminal-cursor font-bold">█</span>
                <span className="text-[9px] text-slate-400 italic">
                  {progress < 100 ? 'ingesting geospatial telemetry...' : 'handshake verified.'}
                </span>
              </div>
            </div>
          </div>

          {/* Large ASCII / Technical Graphic: COMMUNITY TRACKER */}
          <div className="relative border border-white/[0.08] bg-[#090b10]/90 rounded-xl p-3 sm:p-4 shadow-2xl overflow-hidden">
            {/* Blueprint Header Details */}
            <div className="flex items-center justify-between text-[9px] text-slate-300 pb-2 border-b border-white/[0.06] mb-2.5">
              <span className="text-cyan-400 font-semibold tracking-wider">
                [ SYS.ID: CT-2026-CORE ]
              </span>
              <span className="hidden sm:inline-block tracking-widest text-slate-400">
                ZONE: CIVIC-MATRIX-01
              </span>
              <span className="text-slate-300">
                LAT: 28.6139° / LNG: 77.2090°
              </span>
            </div>

            {/* ASCII Wireframe Title Block */}
            <div className="overflow-x-auto py-0.5">
              <pre
                className="text-[8px] sm:text-[9.5px] md:text-[10.5px] lg:text-[11.5px] leading-[1.18] font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-sky-400 select-all font-mono"
                style={{
                  textShadow: '0 0 14px rgba(6,182,212,0.35)',
                }}
              >
{`  ____ ___  __  __ __  __ _   _ _   _ ___ _____ __   __
 / ___/ _ \\|  \\/  |  \\/  | | | | \\ | |_ _|_   _|\\ \\ / /
| |  | | | | |\\/| | |\\/| | | | |  \\| || |  | |   \\ V / 
| |__| |_| | |  | | |  | | |_| | |\\  || |  | |    | |  
 \\____\\___/|_|  |_|_|  |_|\\___/|_| \\_|___| |_|    |_|  
                                                        
 _____ ____     _     ____  _  _______ ____             
|_   _|  _ \\   / \\   / ___|| |/ / ____|  _ \\            
  | | | |_) | / _ \\ | |    | ' /|  _| | |_) |           
  | | |  _ < / ___ \\| |___ | . \\| |___|  _ <            
  |_| |_| \\_/_/   \\_\\____||_|\\_\\_____|_| \\_\\           `}
              </pre>
            </div>

            {/* Wireframe Technical Matrix Footer */}
            <div className="mt-2.5 pt-2 border-t border-white/[0.06] grid grid-cols-3 gap-2 text-[9px] text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>STATE: ARMED</span>
              </div>
              <div className="text-center text-slate-300">
                <span>SECTORS: 09 / 09</span>
              </div>
              <div className="text-right text-cyan-400/90 font-semibold">
                <span>SIGNAL: STABLE</span>
              </div>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------------------- */}
        {/* RIGHT COLUMN: Abstract Animated Digital City Network (3x3 Matrix)     */}
        {/* --------------------------------------------------------------------- */}
        <div className="md:col-span-6 flex flex-col justify-center space-y-3">
          
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-200 font-semibold text-xs">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>DIGITAL CITY TELEMETRY MESH</span>
            </span>
            <span className="text-[9px] text-cyan-400 font-mono">
              [ PKT STREAM: #{activePacketIndex + 104} ]
            </span>
          </div>

          {/* 3x3 Abstract Grid of Digital City Blocks */}
          <div className="grid grid-cols-3 gap-2.5 p-3 sm:p-3.5 bg-black/50 border border-white/[0.08] rounded-xl relative overflow-hidden backdrop-blur-md">
            
            {/* Background Data Bus Grid Lines */}
            <div className="absolute inset-0 bg-tech-grid-dense opacity-30 pointer-events-none" />

            {cityBlocks.map((block, idx) => {
              const isCurrentPacket = idx === activePacketIndex;

              return (
                <div
                  key={block.id}
                  className={`relative p-2.5 rounded-lg border transition-all duration-400 flex flex-col justify-between min-h-[82px] cursor-pointer ${
                    isCurrentPacket
                      ? 'border-cyan-400/80 bg-cyan-950/40 shadow-[0_0_15px_rgba(6,182,212,0.35)] scale-[1.02]'
                      : block.type === 'active_incident'
                      ? 'border-amber-500/30 bg-amber-950/20'
                      : block.type === 'resolved_node'
                      ? 'border-emerald-500/30 bg-emerald-950/20'
                      : block.type === 'citizen_signal'
                      ? 'border-cyan-500/30 bg-cyan-950/20'
                      : 'border-white/[0.06] bg-white/[0.01]'
                  }`}
                  onClick={() => {
                    setActivePacketIndex(idx);
                  }}
                >
                  {/* Sector Badge & Type Marker */}
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="font-mono text-slate-400 text-[8px]">
                      {block.sector}
                    </span>
                    {block.type === 'active_incident' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    )}
                    {block.type === 'citizen_signal' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    )}
                    {block.type === 'resolved_node' && (
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                    )}
                    {block.type === 'authority_dispatch' && (
                      <Navigation className="w-2.5 h-2.5 text-blue-400 animate-pulse" />
                    )}
                  </div>

                  {/* Visual Cell Pixel Matrix / Signal Bars */}
                  <div className="my-1.5 space-y-1">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-xs transition-all duration-300 ${
                            i < Math.round(block.intensity * 5)
                              ? block.type === 'active_incident'
                                ? 'bg-amber-400'
                                : block.type === 'resolved_node'
                                ? 'bg-emerald-400'
                                : 'bg-cyan-400'
                              : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="text-[9px] font-semibold text-slate-200 truncate leading-tight">
                      {block.label}
                    </div>
                  </div>

                  {/* Micro Coordinates */}
                  <div className="text-[7.5px] text-slate-400 font-mono truncate">
                    {block.latLng}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Color Matrix Legend (Civic Technology Palette) */}
          <div className="grid grid-cols-4 gap-2 pt-1 text-[8.5px] text-slate-400 font-mono">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
              <span>CITIZEN</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
              <span>INCIDENT</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
              <span>DISPATCH</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
              <span>RESOLVED</span>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 3. BOTTOM TELEMETRY & PROGRESS ACTION BAR                                  */}
      {/* ========================================================================= */}
      <footer className="relative z-10 w-full px-5 sm:px-8 py-3 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Left: Tagline / Direct Access Link */}
        <button
          onClick={handleExit}
          className="group flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
        >
          <span className="tracking-wider text-[11px]">SEND THE SIGNAL</span>
          <span className="text-cyan-400 transition-transform group-hover:translate-x-1">→</span>
          <span className="tracking-wider text-[11px]">SEE THE CHANGE</span>
          <span className="text-[9px] text-slate-400 ml-1.5 border border-white/10 px-1.5 py-0.2 rounded group-hover:border-cyan-500/40">
            [ ENTER PLATFORM ]
          </span>
        </button>

        {/* Center: Precision Progress Bar & Sector Counter */}
        <div className="w-full sm:max-w-xs space-y-1">
          <div className="flex items-center justify-between text-[9px] text-slate-400">
            <span>CITY TELEMETRY INITIALIZATION</span>
            <span className="text-cyan-300 font-bold">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-sky-400 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Right: Status Spinner / System Ready Notification */}
        <div className="flex items-center gap-2 text-xs font-medium">
          {progress >= 100 ? (
            <div className="flex items-center gap-1.5 text-emerald-400 animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="tracking-wider text-[10px]">INITIALIZATION COMPLETE</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-400">
              <div className="w-3 h-3 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
              <span className="tracking-wider text-[10px] text-slate-300">
                CONNECTING TO LIVE CITY DATA
              </span>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};
