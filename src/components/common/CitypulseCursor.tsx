import React, { useEffect, useRef } from 'react';

interface OrbitParticle {
  radiusX: number;
  radiusY: number;
  tilt: number;
  speed: number;
  offset: number;
  size: number;
  alpha: number;
}

export const CitypulseCursor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Disable on touch / mobile devices or if reduced motion is preferred
    const isTouch = window.matchMedia('(pointer: coarse)').matches || !window.matchMedia('(hover: hover)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isTouch || prefersReducedMotion) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // Cursor position state
    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;
    let isVisible = false;
    let isHoveringInteractive = false;

    // Short motion trail: max 5 points
    const trail: Array<{ x: number; y: number; alpha: number }> = [];

    // 4 subtle orbiting electron particles
    const orbits: OrbitParticle[] = [
      { radiusX: 13, radiusY: 6, tilt: -0.4, speed: 0.045, offset: 0, size: 1.4, alpha: 0.75 },
      { radiusX: 18, radiusY: 9, tilt: 0.6, speed: -0.038, offset: 1.8, size: 1.3, alpha: 0.7 },
      { radiusX: 23, radiusY: 11, tilt: 1.3, speed: 0.028, offset: 3.4, size: 1.5, alpha: 0.8 },
      { radiusX: 16, radiusY: 7, tilt: -1.0, speed: -0.052, offset: 4.9, size: 1.2, alpha: 0.65 },
    ];

    const handlePointerMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!isVisible) {
        currentX = targetX;
        currentY = targetY;
        isVisible = true;
      }

      // Check if hovering over clickable/interactive element
      const target = e.target as HTMLElement | null;
      if (target) {
        const isClickable = target.closest('button, a, input, textarea, select, [role="button"], .cursor-pointer');
        isHoveringInteractive = Boolean(isClickable);
      }
    };

    const handleMouseLeave = () => {
      isVisible = false;
    };

    const handleMouseEnter = () => {
      isVisible = true;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (isVisible && targetX > 0 && targetY > 0) {
        // Smooth linear interpolation towards target
        const lerp = 0.28;
        currentX += (targetX - currentX) * lerp;
        currentY += (targetY - currentY) * lerp;

        // Add to short trail
        trail.push({ x: currentX, y: currentY, alpha: 0.35 });
        if (trail.length > 5) {
          trail.shift();
        }

        // Draw soft short motion trail
        if (trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(trail[0].x, trail[0].y);
          for (let i = 1; i < trail.length; i++) {
            ctx.lineTo(trail[i].x, trail[i].y);
          }
          ctx.strokeStyle = isHoveringInteractive ? 'rgba(139, 92, 246, 0.45)' : 'rgba(56, 189, 248, 0.32)';
          ctx.lineWidth = isHoveringInteractive ? 2.5 : 1.8;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        }

        // Draw subtle faint orbit paths
        const orbitExpansion = isHoveringInteractive ? 1.25 : 1.0;
        ctx.save();
        orbits.forEach((orbit) => {
          ctx.beginPath();
          const rx = orbit.radiusX * orbitExpansion;
          const ry = orbit.radiusY * orbitExpansion;
          ctx.ellipse(currentX, currentY, rx, ry, orbit.tilt, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(139, 92, 246, 0.14)';
          ctx.lineWidth = 0.75;
          ctx.stroke();
        });
        ctx.restore();

        // Draw orbiting electron particles
        time += 1;
        orbits.forEach((orbit, idx) => {
          const rx = orbit.radiusX * orbitExpansion;
          const ry = orbit.radiusY * orbitExpansion;
          const angle = time * orbit.speed + orbit.offset;

          // Elliptical coordinate calculation with tilt rotation
          const ux = rx * Math.cos(angle);
          const uy = ry * Math.sin(angle);
          const cosT = Math.cos(orbit.tilt);
          const sinT = Math.sin(orbit.tilt);
          const ex = currentX + (ux * cosT - uy * sinT);
          const ey = currentY + (ux * sinT + uy * cosT);

          // Render small electron sphere (alternating cyan & violet)
          ctx.beginPath();
          ctx.arc(ex, ey, orbit.size, 0, Math.PI * 2);
          ctx.fillStyle = idx % 2 === 0 ? `rgba(56, 189, 248, ${orbit.alpha})` : `rgba(168, 85, 247, ${orbit.alpha})`;
          ctx.shadowColor = idx % 2 === 0 ? '#38bdf8' : '#a855f7';
          ctx.shadowBlur = 4;
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        // Draw central Nucleus
        const nucleusRadius = isHoveringInteractive ? 4.5 : 3.5;

        // Subtle glow halo
        ctx.beginPath();
        ctx.arc(currentX, currentY, nucleusRadius + 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(139, 92, 246, 0.28)';
        ctx.fill();

        // Main nucleus sphere
        ctx.beginPath();
        ctx.arc(currentX, currentY, nucleusRadius, 0, Math.PI * 2);
        ctx.fillStyle = isHoveringInteractive ? '#C084FC' : '#818CF8';
        ctx.shadowColor = '#818cf8';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="citypulse-cursor-canvas fixed inset-0 pointer-events-none z-50"
      style={{ pointerEvents: 'none' }}
    />
  );
};
