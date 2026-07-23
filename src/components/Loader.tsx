import { useEffect, useState, useRef } from 'react'

export const globalModelCache = {
  url: '/solar_system_realistic.glb?v=6'
};

// Track preloading globally so React StrictMode or re-renders don't restart it
let isPreloading = false;
let preloadedBlobUrl: string | null = null;
let globalProgress = 0;

export function Loader({ onLoaded }: { onLoaded?: () => void }) {
  const [displayProgress, setDisplayProgress] = useState(globalProgress);
  const [hidden, setHidden] = useState(false);
  const onLoadedRef = useRef(onLoaded);

  useEffect(() => {
    onLoadedRef.current = onLoaded;
  }, [onLoaded]);

  useEffect(() => {
    if (preloadedBlobUrl) {
      setDisplayProgress(100);
      setHidden(true);
      if (onLoadedRef.current) onLoadedRef.current();
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
      } else {
        // Visual bar has caught up to 100%
        setTimeout(() => {
          setHidden(true);
          if (onLoadedRef.current) onLoadedRef.current();
        }, 600);
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
        {Math.min(100, displayProgress).toFixed(0)}% SYNCHRONIZED
      </div>
    </div>
  )
}

