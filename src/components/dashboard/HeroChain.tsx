import React, { useState, useRef, useId, useEffect } from 'react';
import { 
  PlusCircle, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  ArrowRight, 
  ShieldCheck, 
  LogIn, 
  ShieldAlert,
  ChevronDown,
  ChevronsDown,
  RotateCcw
} from 'lucide-react';
import { AnalyticsData } from '../../types';
import { Vector1, Vector4 } from '../common/DecorativeVectors';
import { HeroScrollCanvas, TOTAL_HERO_FRAMES } from './HeroScrollCanvas';

interface HeroChainProps {
  analytics: AnalyticsData | null;
  isLoading: boolean;
  onNavigate: (tab: string, issueId?: string) => void;
  onOpenAuth?: (role?: 'CITIZEN' | 'AUTHORITY', mode?: 'login' | 'signup') => void;
}

interface ChainNode {
  id: string;
  stage: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  xPct: number;
  yPct: number;
}

const CHAIN_STAGES: ChainNode[] = [
  {
    id: 'report',
    stage: '01',
    title: 'ONE REPORT',
    desc: 'Citizen signal logged',
    icon: PlusCircle,
    xPct: 5,
    yPct: 65,
  },
  {
    id: 'analyze',
    stage: '02',
    title: 'ANALYZE',
    desc: 'AI severity triage',
    icon: Sparkles,
    xPct: 20,
    yPct: 35,
  },
  {
    id: 'locate',
    stage: '03',
    title: 'LOCATE',
    desc: 'Geospatial pin lock',
    icon: MapPin,
    xPct: 35,
    yPct: 62,
  },
  {
    id: 'validate',
    stage: '04',
    title: 'VALIDATE',
    desc: 'Community upvotes',
    icon: CheckCircle2,
    xPct: 50,
    yPct: 38,
  },
  {
    id: 'prioritize',
    stage: '05',
    title: 'PRIORITIZE',
    desc: 'Urgency scored 1-100',
    icon: Layers,
    xPct: 65,
    yPct: 64,
  },
  {
    id: 'action',
    stage: '06',
    title: 'ACTION',
    desc: 'Municipal squad sent',
    icon: ArrowRight,
    xPct: 80,
    yPct: 36,
  },
  {
    id: 'resolve',
    stage: '07',
    title: 'CHANGE',
    desc: 'Verified resolution',
    icon: ShieldCheck,
    xPct: 95,
    yPct: 58,
  },
];

export const HeroChain: React.FC<HeroChainProps> = ({
  analytics,
  isLoading,
  onNavigate,
  onOpenAuth,
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string>('report');
  const [userHoveredNode, setUserHoveredNode] = useState<boolean>(false);
  const [curveOffset, setCurveOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [parallaxOffset, setParallaxOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Controlled scroll animation progress (0.0 to 1.0)
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const pathGradientId = useId();

  // Track-based pinned scroll trigger calculation
  useEffect(() => {
    const handleScroll = () => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const pinTop = 72; // Header height padding
      
      // Total scrollable height inside this pinned track
      const scrollableDistance = rect.height - window.innerHeight;
      if (scrollableDistance <= 0) return;

      const scrolledFromPin = pinTop - rect.top;
      const rawProgress = scrolledFromPin / scrollableDistance;
      const clampedProgress = Math.max(0, Math.min(1, rawProgress));

      setScrollProgress(clampedProgress);

      const frameIdx = Math.min(
        TOTAL_HERO_FRAMES - 1,
        Math.max(0, Math.floor(clampedProgress * (TOTAL_HERO_FRAMES - 1)))
      );
      setCurrentFrame(frameIdx);

      // Unless user is manually hovering over a specific node, synchronize active node with scroll progress
      if (!userHoveredNode) {
        const stageIdx = Math.min(
          CHAIN_STAGES.length - 1,
          Math.max(0, Math.floor(clampedProgress * CHAIN_STAGES.length))
        );
        setActiveNodeId(CHAIN_STAGES[stageIdx].id);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [userHoveredNode]);

  // Jump/Skip past pinned hero to dashboard metrics
  const handleSkipToNextSection = () => {
    const metricsElem = document.getElementById('dashboard-metrics');
    if (metricsElem) {
      metricsElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (trackRef.current) {
      const targetY = window.scrollY + trackRef.current.getBoundingClientRect().bottom - 60;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }
  };

  // Subtle interactive spring shift on cursor movement
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;

    setCurveOffset({ x: (relX - 0.5) * 16, y: (relY - 0.5) * 20 });
    setParallaxOffset({ x: (relX - 0.5) * 12, y: (relY - 0.5) * 12 });
  };

  const handlePointerLeave = () => {
    setCurveOffset({ x: 0, y: 0 });
    setParallaxOffset({ x: 0, y: 0 });
    setUserHoveredNode(false);
  };

  const oy = curveOffset.y;
  const pathData = `
    M 60 ${130 + oy * 0.4}
    C 135 ${40 + oy * 0.9}, 145 ${60 + oy * 0.8}, 210 ${75 + oy * 0.7}
    C 285 ${90 + oy * 0.6}, 295 ${135 + oy * 0.8}, 360 ${125 + oy * 0.6}
    C 435 ${115 + oy * 0.5}, 445 ${65 + oy * 0.7}, 510 ${78 + oy * 0.5}
    C 585 ${90 + oy * 0.6}, 595 ${140 + oy * 0.8}, 660 ${130 + oy * 0.6}
    C 735 ${120 + oy * 0.5}, 745 ${60 + oy * 0.7}, 810 ${72 + oy * 0.5}
    C 875 ${84 + oy * 0.4}, 900 ${120 + oy * 0.5}, 940 ${116 + oy * 0.3}
  `;

  const isAnimationFinished = scrollProgress >= 0.98;
  const currentStageIndex = Math.min(
    CHAIN_STAGES.length - 1,
    Math.max(0, Math.floor(scrollProgress * CHAIN_STAGES.length))
  );
  const currentStageObj = CHAIN_STAGES[currentStageIndex];

  return (
    // Outer scroll track container creates the scroll travel distance for the pin
    <div 
      ref={trackRef} 
      className="relative min-h-[240vh] sm:min-h-[270vh] w-full"
      id="hero-scroll-track"
    >
      {/* Pinned Sticky Wrapper: keeps the hero card fixed in viewport while scrolling */}
      <div className="sticky top-20 sm:top-24 z-20 w-full">
        <div
          ref={cardRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className="glass-card rounded-3xl border border-white/15 p-5 sm:p-8 lg:p-10 relative overflow-hidden transition-all duration-300 select-none shadow-[0_15px_60px_rgba(0,0,0,0.85)]"
        >
          {/* Full-width Canvas Background for Scroll Animation (72 frames synchronized) */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-45 overflow-hidden">
            <HeroScrollCanvas
              progress={scrollProgress}
              className="w-full h-full scale-105 filter brightness-110 contrast-105"
            />
            {/* Soft radial scrim to ensure text legibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#060713]/95 via-[#060713]/80 to-[#060713]/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060713] via-transparent to-transparent" />
          </div>

          {/* Ambient background glows */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 -right-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Decorative ambient vector sheets */}
          <div 
            aria-hidden="true" 
            className="absolute -top-10 -right-10 w-48 h-48 opacity-10 text-cyan-400 pointer-events-none hidden md:block"
            style={{
              transform: `translate3d(${parallaxOffset.x * 1.5}px, ${parallaxOffset.y * 1.5}px, 0)`,
              transition: 'transform 300ms ease-out',
            }}
          >
            <Vector1 className="w-full h-full" />
          </div>

          <div 
            aria-hidden="true" 
            className="absolute bottom-2 left-6 w-40 h-28 opacity-10 text-violet-400 pointer-events-none hidden lg:block"
            style={{
              transform: `translate3d(${-parallaxOffset.x}px, ${-parallaxOffset.y}px, 0)`,
              transition: 'transform 300ms ease-out',
            }}
          >
            <Vector4 className="w-full h-full" />
          </div>

          {/* Main 2-Column Hero Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center relative z-10">
            {/* Left Side: Editorial & CTAs (7 cols) */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6">
              {/* Badge: "CIVIC TECH FOR A BETTER TOMORROW" & Frame Counter */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/80 border border-white/25 backdrop-blur-xl shadow-lg">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[11px] font-bold text-cyan-200 tracking-wider uppercase">
                  Civic Tech for a Better Tomorrow
                </span>
                <span className="text-[10px] text-violet-300 font-mono border-l border-white/20 pl-2">
                  FRAME {currentFrame + 1}/72
                </span>
                <span className="text-[10px] text-cyan-400 font-mono border-l border-white/20 pl-2 hidden sm:inline">
                  {Math.round(scrollProgress * 100)}%
                </span>
              </div>

              {/* Master Headline */}
              <div>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
                  One Report <br className="hidden sm:inline" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-violet-300">
                    Starts a Chain.
                  </span>
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-slate-100 font-medium mt-3 max-w-xl leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.95)]">
                  Report what matters. Scroll through the orbital sequence to see how your civic signal moves from community report to automated AI triage, squad dispatch, and verified municipal resolution.
                </p>
              </div>

              {/* Primary & Secondary Glass CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  id="btn-report-hero"
                  onClick={() => onNavigate('report')}
                  className="btn-glass-primary inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white text-xs sm:text-sm font-bold shadow-xl cursor-pointer group"
                >
                  <PlusCircle className="w-4 h-4 text-cyan-300 transition-transform group-hover:rotate-90 duration-300" />
                  <span>Report an issue</span>
                  <ArrowRight className="w-4 h-4 text-white transition-transform group-hover:translate-x-1 duration-200" />
                </button>

                <button
                  id="btn-view-map-hero"
                  onClick={() => onNavigate('map')}
                  className="btn-glass-secondary inline-flex items-center justify-center gap-2 px-4.5 py-3 rounded-xl text-white text-xs sm:text-sm font-bold shadow-md cursor-pointer group border-white/20 bg-white/10 hover:bg-white/20"
                >
                  <MapPin className="w-4 h-4 text-cyan-300 transition-transform group-hover:scale-110 duration-200" />
                  <span>Explore the map</span>
                </button>

                {onOpenAuth && (
                  <div className="flex items-center gap-2 pl-1">
                    <button
                      onClick={() => onOpenAuth('CITIZEN', 'login')}
                      className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <LogIn className="w-3.5 h-3.5 text-violet-300" />
                      <span>Citizen Login</span>
                    </button>
                    <button
                      onClick={() => onOpenAuth('AUTHORITY', 'login')}
                      className="px-3 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-xs font-bold text-cyan-200 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-cyan-300" />
                      <span>Authority Portal</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Interactive Scroll-Scrubbed Orbital Globe Showcase (5 cols) */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="relative w-full max-w-[340px] sm:max-w-[420px] aspect-video rounded-3xl overflow-hidden border border-cyan-400/40 shadow-[0_0_50px_rgba(6,182,212,0.35)] bg-slate-950/80 group">
                {/* Embedded Scroll Frame Player driven by controlled progress */}
                <HeroScrollCanvas
                  progress={scrollProgress}
                  className="w-full h-full"
                />

                {/* Stage Tag Overlay */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/85 border border-white/20 text-[10px] font-bold text-cyan-300 backdrop-blur-md flex items-center gap-1.5 shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span>Scroll-Driven Orbital Telemetry</span>
                </div>

                {/* Scroll Progress Bar at Bottom of Canvas Frame */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-500 transition-all duration-100"
                    style={{ width: `${Math.round(scrollProgress * 100)}%` }}
                  />
                </div>

                {/* Floating Live Telemetry HUD Card */}
                <div className="absolute bottom-3.5 right-3.5 glass-card rounded-xl p-2 sm:p-2.5 border border-white/25 shadow-2xl backdrop-blur-xl flex items-center gap-2 sm:gap-2.5 bg-black/70">
                  <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor] animate-ping ${
                    isAnimationFinished ? 'bg-emerald-400 text-emerald-400' : 'bg-cyan-400 text-cyan-400'
                  }`} />
                  <div>
                    <div className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">
                      Stage {currentStageObj.stage}: {currentStageObj.title}
                    </div>
                    <div className="text-[11px] font-black text-white">
                      {isAnimationFinished ? 'Sequence Complete (100%)' : `${Math.round(scrollProgress * 100)}% Synced`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CONTINUOUS VISUAL CHAIN STORY */}
          <div className="relative mt-8 pt-5 border-t border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                Civic Chain Transmission Sequence
              </span>
              <span className="text-xs font-medium text-slate-200 hidden sm:inline-block">
                Scroll to scrub sequence • Stage {currentStageObj.stage} active
              </span>
            </div>

            {/* Desktop & Tablet: Continuous Interactive Vector Path Canvas */}
            <div className="hidden md:block relative h-36 lg:h-40 w-full">
              <svg
                viewBox="0 0 1000 200"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full pointer-events-none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id={pathGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.9" />
                    <stop offset="35%" stopColor="#06b6d4" stopOpacity="0.8" />
                    <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.95" />
                  </linearGradient>
                </defs>

                <path
                  d={pathData}
                  fill="none"
                  stroke="#ffffff20"
                  strokeWidth="10"
                  strokeLinecap="round"
                />

                <path
                  d={pathData}
                  fill="none"
                  stroke={`url(#${pathGradientId})`}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="1000"
                  strokeDashoffset={Math.max(0, 1000 * (1 - scrollProgress))}
                  className="transition-all duration-150"
                />
              </svg>

              {/* Interactive Nodes Placed Along The Dynamic Path */}
              {CHAIN_STAGES.map((node, index) => {
                const Icon = node.icon;
                const isActive = activeNodeId === node.id;
                const isPassed = index <= currentStageIndex;

                return (
                  <div
                    key={node.id}
                    style={{
                      left: `${node.xPct}%`,
                      top: `${node.yPct}%`,
                      transform: `translate(-50%, -50%) translate3d(${parallaxOffset.x * 0.5}px, ${parallaxOffset.y * 0.5}px, 0)`,
                      transition: 'all 250ms ease-out',
                    }}
                    className="absolute z-20"
                    onMouseEnter={() => {
                      setUserHoveredNode(true);
                      setActiveNodeId(node.id);
                    }}
                  >
                    <div className="flex flex-col items-center group cursor-pointer">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md ${
                          isActive
                            ? 'bg-gradient-to-tr from-cyan-500 to-violet-500 text-white scale-125 ring-4 ring-cyan-400/40 shadow-[0_0_25px_rgba(6,182,212,0.8)]'
                            : isPassed
                            ? 'bg-slate-800/90 border border-cyan-400/50 text-cyan-200'
                            : 'bg-slate-900/90 border border-white/20 text-slate-300 hover:border-cyan-400/50 hover:text-white hover:scale-110'
                        }`}
                      >
                        <Icon className="w-4.5 h-4.5 transition-transform duration-300 group-hover:rotate-6" />
                      </div>

                      <div className="mt-1.5 text-center pointer-events-none">
                        <span className={`text-[10px] font-mono font-bold block tracking-wider ${
                          isActive ? 'text-cyan-300' : 'text-slate-400'
                        }`}>
                          {node.stage}
                        </span>
                        <span className="text-xs font-black text-white tracking-tight block whitespace-nowrap drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                          {node.title}
                        </span>
                        <span
                          className={`text-[10px] transition-opacity duration-200 block whitespace-nowrap drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] ${
                            isActive ? 'opacity-100 text-cyan-200 font-semibold' : 'opacity-70 text-slate-300'
                          }`}
                        >
                          {node.desc}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Horizontal Carousel */}
            <div className="md:hidden flex gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-none">
              {CHAIN_STAGES.map((node, index) => {
                const Icon = node.icon;
                const isActive = activeNodeId === node.id;
                const isPassed = index <= currentStageIndex;

                return (
                  <div
                    key={node.id}
                    onClick={() => {
                      setUserHoveredNode(true);
                      setActiveNodeId(node.id);
                    }}
                    className={`shrink-0 w-32 p-2.5 rounded-2xl border transition-all ${
                      isActive
                        ? 'border-cyan-400/60 bg-cyan-500/20 shadow-lg'
                        : isPassed
                        ? 'border-cyan-500/30 bg-white/10 text-white'
                        : 'border-white/10 bg-white/5 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-mono font-bold text-cyan-300">
                        {node.stage}
                      </span>
                      <div className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-300">
                        <Icon className="w-3 h-3" />
                      </div>
                    </div>
                    <div className="text-xs font-bold text-white truncate">{node.title}</div>
                    <div className="text-[9px] text-slate-300 truncate">{node.desc}</div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Scrubber & Section Transition Control HUD */}
            <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              {/* Left: Interactive Status Message */}
              <div className="flex items-center gap-2">
                {isAnimationFinished ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-semibold animate-pulse">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Sequence Complete • Keep scrolling for Dashboard</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 font-medium">
                    <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
                    <span>Scroll to drive telemetry animation ({Math.round(scrollProgress * 100)}%)</span>
                  </span>
                )}
              </div>

              {/* Right: Quick Skip / Advance Button */}
              <button
                type="button"
                onClick={handleSkipToNextSection}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 hover:text-white font-medium text-xs transition cursor-pointer shadow-sm group"
              >
                <span>{isAnimationFinished ? 'Explore Live Dashboard' : 'Skip to Dashboard'}</span>
                <ChevronsDown className="w-3.5 h-3.5 text-cyan-300 transition-transform group-hover:translate-y-0.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
