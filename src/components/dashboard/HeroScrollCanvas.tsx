import React, { useEffect, useRef, useState, useCallback } from 'react';

export const TOTAL_HERO_FRAMES = 72;

// Singleton cache so 72 images are preloaded and shared across all canvas instances
let cachedImages: HTMLImageElement[] | null = null;
let preloadPromise: Promise<HTMLImageElement[]> | null = null;
const progressCallbacks: Set<(loadedCount: number, images: HTMLImageElement[]) => void> = new Set();

export const getOrPreloadFrames = (): {
  promise: Promise<HTMLImageElement[]>;
  images: HTMLImageElement[];
  isLoaded: boolean;
} => {
  if (cachedImages && cachedImages.length === TOTAL_HERO_FRAMES) {
    return { promise: Promise.resolve(cachedImages), images: cachedImages, isLoaded: true };
  }

  if (!cachedImages) {
    cachedImages = [];
    for (let i = 1; i <= TOTAL_HERO_FRAMES; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(3, '0');
      img.src = `/scrollanimation/ezgif-frame-${frameNum}.jpg`;
      cachedImages.push(img);
    }
  }

  if (!preloadPromise) {
    preloadPromise = new Promise((resolve) => {
      let loaded = 0;
      const total = TOTAL_HERO_FRAMES;

      cachedImages!.forEach((img) => {
        const handleDone = () => {
          loaded++;
          progressCallbacks.forEach((cb) => cb(loaded, cachedImages!));
          if (loaded >= total) {
            resolve(cachedImages!);
          }
        };

        if (img.complete && img.naturalWidth > 0) {
          handleDone();
        } else {
          img.addEventListener('load', handleDone, { once: true });
          img.addEventListener('error', handleDone, { once: true });
        }
      });
    });
  }

  return {
    promise: preloadPromise,
    images: cachedImages,
    isLoaded: cachedImages.every((img) => img.complete && img.naturalWidth > 0),
  };
};

interface HeroScrollCanvasProps {
  className?: string;
  progress?: number; // Controlled scroll progress from 0.0 to 1.0
  onProgressChange?: (progress: number, frameIndex: number) => void;
  fitMode?: 'cover' | 'contain';
}

export const HeroScrollCanvas: React.FC<HeroScrollCanvasProps> = ({
  className = '',
  progress: controlledProgress,
  onProgressChange,
  fitMode = 'cover',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const currentFrameRef = useRef<number>(0);
  const targetFrameRef = useRef<number>(0);
  const [isFirstFrameReady, setIsFirstFrameReady] = useState<boolean>(false);
  const animFrameIdRef = useRef<number | null>(null);

  // Render a specific frame onto the canvas
  const renderFrame = useCallback(
    (frameIndex: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { images } = getOrPreloadFrames();
      const img = images[frameIndex];
      if (!img || !img.complete || img.naturalWidth === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      if (width === 0 || height === 0) return;

      if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const imgRatio = img.naturalWidth / img.naturalHeight;
      const canvasRatio = width / height;

      let drawWidth: number;
      let drawHeight: number;
      let offsetX = 0;
      let offsetY = 0;

      if (fitMode === 'cover') {
        if (canvasRatio > imgRatio) {
          drawWidth = width;
          drawHeight = width / imgRatio;
          offsetY = (height - drawHeight) / 2;
        } else {
          drawHeight = height;
          drawWidth = height * imgRatio;
          offsetX = (width - drawWidth) / 2;
        }
      } else {
        // contain mode
        if (canvasRatio > imgRatio) {
          drawHeight = height;
          drawWidth = height * imgRatio;
          offsetX = (width - drawWidth) / 2;
        } else {
          drawWidth = width;
          drawHeight = width / imgRatio;
          offsetY = (height - drawHeight) / 2;
        }
      }

      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      ctx.restore();
    },
    [fitMode]
  );

  // Preload and initialize first frame
  useEffect(() => {
    const { images } = getOrPreloadFrames();

    const checkFirst = () => {
      if (images[0] && images[0].complete && images[0].naturalWidth > 0) {
        setIsFirstFrameReady(true);
        renderFrame(currentFrameRef.current);
      }
    };

    if (images[0] && images[0].complete) {
      checkFirst();
    } else if (images[0]) {
      images[0].addEventListener('load', checkFirst, { once: true });
    }

    const handleBatch = (count: number) => {
      if (count >= 1 && !isFirstFrameReady) {
        checkFirst();
      }
    };

    progressCallbacks.add(handleBatch);
    return () => {
      progressCallbacks.delete(handleBatch);
    };
  }, [renderFrame, isFirstFrameReady]);

  // Update target frame when controlledProgress changes
  useEffect(() => {
    if (controlledProgress !== undefined) {
      const clamped = Math.max(0, Math.min(1, controlledProgress));
      const targetIdx = Math.min(TOTAL_HERO_FRAMES - 1, Math.floor(clamped * (TOTAL_HERO_FRAMES - 1)));
      targetFrameRef.current = targetIdx;

      if (onProgressChange) {
        onProgressChange(clamped, targetIdx);
      }
    }
  }, [controlledProgress, onProgressChange]);

  // Fallback internal scroll handling if controlledProgress is not supplied
  useEffect(() => {
    if (controlledProgress !== undefined) return;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight || 800;
      const scrollDistance = windowHeight * 0.8;
      const progress = Math.max(0, Math.min(1, -rect.top / scrollDistance));
      const frameIdx = Math.min(TOTAL_HERO_FRAMES - 1, Math.floor(progress * (TOTAL_HERO_FRAMES - 1)));
      targetFrameRef.current = frameIdx;

      if (onProgressChange) {
        onProgressChange(progress, frameIdx);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [controlledProgress, onProgressChange]);

  // Smooth lerp loop for 60fps frame scrubbing
  useEffect(() => {
    const loop = () => {
      const cur = currentFrameRef.current;
      const target = targetFrameRef.current;

      if (cur !== target) {
        const diff = target - cur;
        // Snappy but smooth step
        const step = Math.abs(diff) <= 2 
          ? (diff > 0 ? 1 : -1) 
          : (diff > 0 ? Math.ceil(diff * 0.35) : Math.floor(diff * 0.35));
        const next = cur + step;
        currentFrameRef.current = next;
        renderFrame(next);
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [renderFrame]);

  // Re-render on window resize
  useEffect(() => {
    const handleResize = () => {
      renderFrame(currentFrameRef.current);
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [renderFrame]);

  return (
    <div ref={containerRef} className={`relative w-full h-full overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover pointer-events-none transition-opacity duration-300"
        style={{ opacity: isFirstFrameReady ? 1 : 0.4 }}
      />
    </div>
  );
};
