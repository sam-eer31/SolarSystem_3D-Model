import { useState } from 'react'
import { SolarSystemViewer, type ViewerOptions } from './components/SolarSystemViewer'
import { getBodyData } from './data/bodyData'
import { Loader } from './components/Loader'
import './App.css'

const TIME_PRESETS = [
  { label: "PAUSED", speed: 0 },
  { label: "1 SEC = 1 SEC", speed: 1 / 525960 },
  { label: "1 SEC = 1 MIN", speed: 60 / 525960 },
  { label: "1 SEC = 1 HOUR", speed: 3600 / 525960 },
  { label: "1 SEC = 1 DAY", speed: 86400 / 525960 },
  { label: "1 MIN = 1 YEAR", speed: 1.0 },
  { label: "1 SEC = 1 WEEK", speed: 604800 / 525960 },
  { label: "1 SEC = 1 MONTH", speed: 2629800 / 525960 },
  { label: "1 SEC = 1 YEAR", speed: 60.0 },
]

function App() {
  const [realisticLighting, setRealisticLighting] = useState(false)
  const [speedIndex, setSpeedIndex] = useState(5) // Default to 1 MIN = 1 YEAR
  const [showSettings, setShowSettings] = useState(false)
  const [selectedBody, setSelectedBody] = useState<string | null>(null)
  const [flightTrigger, setFlightTrigger] = useState(0)

  const handleSelectBody = (body: string | null) => {
    setSelectedBody(body)
    if (body) setFlightTrigger(f => f + 1)
  }
  
  const [options, setOptions] = useState<ViewerOptions>({
    showOrbits: true,
    showMoons: true,
    showAsteroids: true,
    showAtmospheres: true,
    showRings: true,
    showComets: true,
    animationSpeed: 1.0,
  })

  return (
    <div className="app-container">
      <Loader />
      
      <div className="ui-layer">
        <header className="header">
          <div className="logo-container">
            <img src="/logo.png" alt="Solar System" className="main-logo" />
          </div>
          <div className="header-actions">
            {selectedBody && (
              <button className="reset-view-btn" onClick={() => setSelectedBody(null)}>
                RESET VIEW
              </button>
            )}
            <button 
              className={`toggle-btn ${realisticLighting ? 'realistic' : ''}`}
              onClick={() => setRealisticLighting(!realisticLighting)}
            >
              <div className="toggle-indicator"></div>
              {realisticLighting ? 'REALISTIC' : 'ENHANCED'}
            </button>
          </div>
        </header>

        {selectedBody && (
          <div className="info-card">
            <button className="close-btn" onClick={() => setSelectedBody(null)}>✕</button>
            <h2>{getBodyData(selectedBody).name}</h2>
            <span className="body-type">{getBodyData(selectedBody).type}</span>
            <p className="body-desc">{getBodyData(selectedBody).description}</p>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Mass</span>
                <span className="stat-value">{getBodyData(selectedBody).mass}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Radius</span>
                <span className="stat-value">{getBodyData(selectedBody).radius}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Temp</span>
                <span className="stat-value">{getBodyData(selectedBody).temp}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Gravity</span>
                <span className="stat-value">{getBodyData(selectedBody).gravity}</span>
              </div>
            </div>
          </div>
        )}

        {showSettings && (
          <div className="settings-panel">
            <h3>Visibility</h3>
            <label>
              <input type="checkbox" checked={options.showOrbits} onChange={(e) => setOptions({...options, showOrbits: e.target.checked})} />
              Orbit Paths
            </label>
            <label>
              <input type="checkbox" checked={options.showMoons} onChange={(e) => setOptions({...options, showMoons: e.target.checked})} />
              Moons
            </label>
            <label>
              <input type="checkbox" checked={options.showAsteroids} onChange={(e) => setOptions({...options, showAsteroids: e.target.checked})} />
              Asteroids & Trojans
            </label>
            <label>
              <input type="checkbox" checked={options.showAtmospheres} onChange={(e) => setOptions({...options, showAtmospheres: e.target.checked})} />
              Atmospheres & Clouds
            </label>
            <label>
              <input type="checkbox" checked={options.showRings} onChange={(e) => setOptions({...options, showRings: e.target.checked})} />
              Planetary Rings
            </label>
            <label>
              <input type="checkbox" checked={options.showComets} onChange={(e) => setOptions({...options, showComets: e.target.checked})} />
              Comets & Tails
            </label>
          </div>
        )}

        <div className="bottom-dashboard">

          <div className="speed-control-container">
            <button 
              className={`settings-toggle-btn ${showSettings ? 'active' : ''}`}
              onClick={() => setShowSettings(!showSettings)}
              title="Toggle Visibility"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
            
            <div className="speed-slider-wrapper">
              <label>{TIME_PRESETS[speedIndex].label}</label>
              <input 
                type="range" 
                min="0" 
                max={TIME_PRESETS.length - 1} 
                step="1" 
                value={speedIndex} 
                onChange={(e) => {
                  const idx = parseInt(e.target.value);
                  setSpeedIndex(idx);
                  setOptions({...options, animationSpeed: TIME_PRESETS[idx].speed});
                }}
              />
            </div>
          </div>
        </div>
      </div>



      <SolarSystemViewer 
        realisticLighting={realisticLighting} 
        options={options} 
        selectedBody={selectedBody}
        flightTrigger={flightTrigger}
        onSelectBody={handleSelectBody}
      />
    </div>
  )
}

export default App
