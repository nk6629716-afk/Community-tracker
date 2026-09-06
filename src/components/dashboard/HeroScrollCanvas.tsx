import React, { useEffect, useRef, useState } from 'react';

interface HeroScrollCanvasProps {
  className?: string;
  onProgressChange?: (progress: number, frameIndex: number) => void;
}

const TOTAL_FRAMES = 72;

export const HeroScrollCanvas: React.FC<HeroScrollCanvasProps> = ({
  className = '',
  onProgressChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef<number>(0);
  const targetFrameRef = useRef<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Preload all 72 frames
  useEffect(() => {
    let loadedCount = 0;
    const images: HTMLImageElement[] = [];

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(3, '0');
      img.src = `/scrollanimation/ezgif-frame-${frameNum}.jpg`;

      img.onload = () => {
        loadedCount++;
        // Render first frame immediately once loaded
        if (i === 1 && canvasRef.current) {
          renderFrame(0);
        }
        if (loadedCount >= Math.min(20, TOTAL_FRAMES)) {
          setIsLoaded(true);
        }
      };

      images.push(img);
    }

    imagesRef.current = images;
  }, []);

  // Render a specific frame on canvas with aspect ratio centering
  const renderFrame = (frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imagesRef.current[frameIndex];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Compute aspect-fit / aspect-cover centered
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = width / height;

    let drawWidth: number;
    let drawHeight: number;
    let offsetX = 0;
    let offsetY = 0;

    if (canvasRatio > imgRatio) {
      drawWidth = width;
      drawHeight = width / imgRatio;
      offsetY = (height - drawHeight) / 2;
    } else {
      drawHeight = height;
      drawWidth = height * imgRatio;
      offsetX = (width - drawWidth) / 2;
    }

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    ctx.restore();
  };

  // Listen to scroll to compute animation frame progress
  useEffect(() => {
    let animId: number;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight || 800;

      // Start when container enters viewport, complete when scrolled through
      // Progress 0 when top is near window top, 1 when scrolled through hero
      const scrollDistance = windowHeight * 0.8;
      const progress = Math.max(0, Math.min(1, -rect.top / scrollDistance));

      const frameIdx = Math.min(TOTAL_FRAMES - 1, Math.floor(progress * (TOTAL_FRAMES - 1)));
      targetFrameRef.current = frameIdx;

      if (onProgressChange) {
        onProgressChange(progress, frameIdx);
      }
    };

    // Smooth animation loop for frame transitions
    const loop = () => {
      const cur = currentFrameRef.current;
      const target = targetFrameRef.current;

      if (cur !== target) {
        const step = target > cur ? Math.ceil((target - cur) * 0.25) : Math.floor((target - cur) * 0.25);
        const next = cur + step;
        currentFrameRef.current = next;
        renderFrame(next);
      }

      animId = requestAnimationFrame(loop);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();
    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      cancelAnimationFrame(animId);
    };
  }, [onProgressChange]);

  return (
    <div ref={containerRef} className={`relative w-full h-full overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover pointer-events-none transition-opacity duration-500"
        style={{ opacity: isLoaded ? 1 : 0.7 }}
      />
    </div>
  );
};
