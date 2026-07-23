import { useProgress } from '@react-three/drei'
import { useEffect, useState } from 'react'

export function Loader({ onLoaded }: { onLoaded?: () => void }) {
  const { progress, total } = useProgress()
  const [displayProgress, setDisplayProgress] = useState(0)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    // Ensure progress only goes up, never drops down dynamically
    setDisplayProgress(p => Math.max(p, progress))
    
    // Only finish if we have actually loaded items (total > 0)
    if (progress === 100 && total > 0) {
      const timer = setTimeout(() => {
        setHidden(true)
        if (onLoaded) onLoaded()
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [progress, total, onLoaded])

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
        {displayProgress.toFixed(0)}% SYNCHRONIZED
      </div>
    </div>
  )
}
