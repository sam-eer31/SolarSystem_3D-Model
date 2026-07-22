import { useProgress } from '@react-three/drei'
import { useEffect, useState } from 'react'

export function Loader() {
  const { progress } = useProgress()
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (progress === 100) {
      const timer = setTimeout(() => setHidden(true), 800)
      return () => clearTimeout(timer)
    }
  }, [progress])

  return (
    <div className={`loader-container ${hidden ? 'hidden' : ''}`}>
      <h2 className="loader-title">SOLAR<span>SYSTEM</span></h2>
      <div className="progress-bar-container">
        <div 
          className="progress-bar" 
          style={{ width: `${progress}%` }} 
        />
      </div>
      <div className="progress-text">
        {progress.toFixed(0)}% SYNCHRONIZED
      </div>
    </div>
  )
}
