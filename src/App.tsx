import { useState, useEffect, useRef } from 'react'
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

const JUMP_CATEGORIES = [
  { label: "Star", items: ["Sun"] },
  { label: "Planets", items: ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"] },
  { label: "Dwarf Planets", items: ["Pluto", "Ceres", "Eris", "Haumea", "Makemake", "Sedna"] },
  { label: "Moons", items: ["Moon", "Phobos", "Deimos", "Io", "Europa", "Ganymede", "Callisto", "Amalthea", "Himalia", "Titan", "Enceladus", "Triton", "Mimas", "Rhea", "Dione", "Tethys", "Iapetus", "Miranda", "Ariel", "Umbriel", "Titania", "Oberon", "Proteus", "Nereid", "Charon"] },
  { label: "Comets & Asteroids", items: ["HalleysComet", "Comet67P", "Vesta", "Pallas", "Hygiea"] }
];

function JumpMenu({ onSelect, currentBody }: { onSelect: (body: string) => void, currentBody: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`jump-menu-container ${isOpen ? 'open' : ''}`}>
      <button className="jump-menu-btn" onClick={() => setIsOpen(!isOpen)}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
          </svg>
          Navigate To...
        </span>
        <span className={`jump-arrow ${isOpen ? 'up' : 'down'}`}>▼</span>
      </button>
      
      {isOpen && (
        <div className="jump-menu-dropdown">
          {JUMP_CATEGORIES.map((cat) => (
            <div key={cat.label} className="jump-menu-group">
              <div className="jump-menu-header">{cat.label}</div>
              <div className="jump-menu-items">
                {cat.items.map(item => {
                  const data = getBodyData(item);
                  return (
                    <button 
                      key={item} 
                      className={`jump-menu-item ${item === currentBody ? 'active' : ''}`}
                      onClick={() => {
                        onSelect(item);
                        setIsOpen(false);
                      }}
                    >
                      {data?.name || item}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function App() {
  const [realisticLighting, setRealisticLighting] = useState(false)
  const [speedIndex, setSpeedIndex] = useState(4) // Default to 1 SEC = 1 DAY
  const [showSettings, setShowSettings] = useState(false)
  const [selectedBody, setSelectedBody] = useState<string | null>(null)
  const [flightTrigger, setFlightTrigger] = useState(0)
  
  const [isMobile, setIsMobile] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [modelReady, setModelReady] = useState(false);

  useEffect(() => {
    const checkState = () => {
      // Professional Mobile Detection:
      // 1. Strict regex for mobile operating systems (ignores generic touch-screen PCs)
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // 2. Feature detection: device primarily uses touch (coarse) and lacks a mouse (hover: none)
      const isTouchOnly = window.matchMedia("(pointer: coarse) and (hover: none)").matches;
      
      // 3. Screen width constraint to prevent tablets from forcing portrait
      const isSmallScreen = window.innerWidth <= 1024;

      const mobile = (isMobileUA || isTouchOnly) && isSmallScreen;
      const portrait = window.innerHeight > window.innerWidth;
      
      setIsMobile(mobile);
      setIsPortrait(portrait);
    };

    checkState();
    window.addEventListener('resize', checkState);
    return () => window.removeEventListener('resize', checkState);
  }, []);

  const hasEnteredFullscreenRef = useRef(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      
      if (isFullscreen) {
        hasEnteredFullscreenRef.current = true;
      } else {
        // If we exited fullscreen AND we had successfully entered it before
        if (hasEnteredFullscreenRef.current) {
          setHasStarted(false); // Force them to see the EXPAND button again
          hasEnteredFullscreenRef.current = false;
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const requestFullscreen = () => {
    const el = document.documentElement as any;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    }
    setHasStarted(true);
  };

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    }
  };

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
    animationSpeed: TIME_PRESETS[4].speed,
  })

  const renderDashboardControls = () => (
    <div className="speed-control-container">
      <div style={{ position: 'relative' }}>
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
      </div>

      <button 
        className={`settings-toggle-btn ${realisticLighting ? 'active' : ''}`}
        onClick={() => setRealisticLighting(!realisticLighting)}
        title={realisticLighting ? "Switch to Enhanced Lighting" : "Switch to Realistic Lighting"}
      >
        {realisticLighting ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 12 6 a 5 5 0 0 0 -5 5 c 0 1.5 1 2.5 2 4 v 2 h 6 v -2 c 1 -1.5 2 -2.5 2 -4 a 5 5 0 0 0 -5 -5 z"></path>
            <path d="M 10 19 h 4"></path>
            <path d="M 11 21 h 2"></path>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 12 6 a 5 5 0 0 0 -5 5 c 0 1.5 1 2.5 2 4 v 2 h 6 v -2 c 1 -1.5 2 -2.5 2 -4 a 5 5 0 0 0 -5 -5 z"></path>
            <path d="M 10 19 h 4"></path>
            <path d="M 11 21 h 2"></path>
            <path d="M 12 1 v 3"></path>
            <path d="M 4 3 l 2 2"></path>
            <path d="M 20 3 l -2 2"></path>
            <path d="M 1 11 h 3"></path>
            <path d="M 20 11 h 3"></path>
          </svg>
        )}
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
  );

  return (
    <div className="app-container">
      <Loader 
        onDownloadComplete={(url) => setModelUrl(url)}
        modelReady={modelReady}
        onLoaded={() => setIsLoaded(true)} 
      />
      
      {isLoaded && isMobile && isPortrait && (
        <div className="orientation-warning">
          <div className="orientation-content">
            <div className="device-icon"></div>
            <h2>Rotate Your Device</h2>
            <p>For the best experience, please tilt your device to landscape mode.</p>
          </div>
        </div>
      )}

      {isLoaded && isMobile && !isPortrait && !hasStarted && (
        <div className="orientation-warning">
          <div className="orientation-content">
            <h2>Ready to Explore</h2>
            <p>Enter fullscreen mode for the best immersive experience.</p>
            <button className="start-btn" onClick={requestFullscreen}>
              ENTER FULLSCREEN
            </button>
          </div>
        </div>
      )}
      
      <div className="ui-layer">
        <header className="header">
          <div className="logo-container">
            <img src="/logo.png" alt="PlanetZero" className="main-logo" />
          </div>
          <div className="header-actions">
            {isMobile && hasStarted && (
              <button className="exit-fullscreen-btn" onClick={exitFullscreen} title="Exit Fullscreen">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
                </svg>
              </button>
            )}
            {selectedBody && (
              <button className="reset-view-btn" onClick={() => setSelectedBody(null)}>
                RESET VIEW
              </button>
            )}
          </div>
        </header>

        <div className={`mid-part ${selectedBody ? 'split-view' : ''}`}>
          {selectedBody && (
            <div className="left-half">
              <div className="info-card-wrapper">
                <div className="info-card">
                  <button className="close-btn" onClick={() => setSelectedBody(null)}>✕</button>
                  <div className="info-card-scroll-area">
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
                    
                    <div className="jump-menu-wrapper">
                      <JumpMenu onSelect={handleSelectBody} currentBody={selectedBody} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="right-half">
            <div className="planet-target-area"></div>
            {selectedBody && (
              <div className="bottom-dashboard inline-dashboard">
                {renderDashboardControls()}
              </div>
            )}
          </div>
        </div>



        {!selectedBody && (
          <div className="bottom-dashboard full-dashboard">
            {renderDashboardControls()}
          </div>
        )}
      </div>



      <SolarSystemViewer 
        url={modelUrl}
        onModelReady={() => setModelReady(true)}
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
