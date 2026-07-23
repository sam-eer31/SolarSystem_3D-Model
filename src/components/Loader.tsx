import { useEffect, useState, useRef } from 'react'

export const globalModelCache = {
  url: '/solar_system_realistic.glb?v=7'
};

// Track preloading globally so React StrictMode or re-renders don't restart it
let isPreloading = false;
let preloadedBlobUrl: string | null = null;
let globalProgress = 0;

export function Loader({ onDownloadComplete, modelReady, onLoaded }: { onDownloadComplete?: (url: string) => void, modelReady?: boolean, onLoaded?: () => void }) {
  const [displayProgress, setDisplayProgress] = useState(globalProgress);
  const [hidden, setHidden] = useState(false);
  const onLoadedRef = useRef(onLoaded);
  const onDownloadCompleteRef = useRef(onDownloadComplete);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    onLoadedRef.current = onLoaded;
  }, [onLoaded]);

  useEffect(() => {
    onDownloadCompleteRef.current = onDownloadComplete;
  }, [onDownloadComplete]);

  // Handle final fade out when BOTH visual progress is 100 AND model is fully parsed/ready
  useEffect(() => {
    if (modelReady && displayProgress >= 100 && !isDone) {
      setIsDone(true);
      setTimeout(() => {
        setHidden(true);
        if (onLoadedRef.current) onLoadedRef.current();
      }, 600);
    }
  }, [modelReady, displayProgress, isDone]);

  useEffect(() => {
    if (preloadedBlobUrl) {
      setDisplayProgress(100);
      if (onDownloadCompleteRef.current) onDownloadCompleteRef.current(preloadedBlobUrl);
      return;
    }

    let animationFrameId: number;
    let currentProgress = displayProgress;

    const smoothAnimate = () => {
      currentProgress += (globalProgress - currentProgress) * 0.15;
      if (Math.abs(globalProgress - currentProgress) < 0.1) {
        currentProgress = globalProgress;
      }
      setDisplayProgress(currentProgress);
      if (currentProgress < 100) {
        animationFrameId = requestAnimationFrame(smoothAnimate);
      }
    };
    
    animationFrameId = requestAnimationFrame(smoothAnimate);

    if (!isPreloading) {
      isPreloading = true;
      const xhr = new XMLHttpRequest();
      xhr.open('GET', '/solar_system_realistic.glb?v=6', true);
      xhr.responseType = 'blob';

      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          globalProgress = (event.loaded / event.total) * 100;
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 304) {
          preloadedBlobUrl = URL.createObjectURL(xhr.response);
          globalModelCache.url = preloadedBlobUrl;
          if (onDownloadCompleteRef.current) onDownloadCompleteRef.current(preloadedBlobUrl);
        }
        globalProgress = 100;
      };

      xhr.onerror = () => {
        globalProgress = 100;
      };

      xhr.send();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []); // Empty dependency array ensures it mounts only once

  let displayContent: React.ReactNode = `${Math.min(100, displayProgress).toFixed(0)}% SYNCHRONIZED`;
  if (displayProgress >= 100) {
    if (!modelReady) {
      displayContent = (
        <>
          PARSING SYSTEM
          <span className="loading-dots">
            <span>.</span><span>.</span><span>.</span>
          </span>
        </>
      );
    } else {
      displayContent = "SYSTEM READY...";
    }
  }

  return (
    <div className={`loader-container ${hidden ? 'hidden' : ''}`}>
      <img src="/logo-main.png" alt="PlanetZero" className="loader-logo" />
      <div className="progress-bar-container">
        <div 
          className="progress-bar" 
          style={{ width: `${displayProgress}%` }} 
        />
      </div>
      <div className="progress-text">
        {displayContent}
      </div>
    </div>
  );
}
