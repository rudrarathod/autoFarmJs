import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../../store/gameStore.js'
import './SettingsPanelModal.css'
import MaterialIcon from './MaterialIcon.jsx'

/**
 * A beautiful retro-parchment settings panel modal that configures
 * audio volumes, grid overlays, color themes, and code editor preferences.
 */
export default function SettingsPanelModal() {
  const isSettingsOpen = useGameStore((s) => s.isSettingsOpen)
  const setSettingsOpen = useGameStore((s) => s.setSettingsOpen)
  const settings = useGameStore((s) => s.settings) || {}
  const updateSetting = useGameStore((s) => s.updateSetting)
  const resetGame = useGameStore((s) => s.resetGame)

  const [showConfirmReset, setShowConfirmReset] = useState(false)
  const modalRef = useRef(null)

  // Escape key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSettingsOpen(false)
        setShowConfirmReset(false)
      }
    }
    if (isSettingsOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSettingsOpen, setSettingsOpen])

  // Click outside overlay to close modal
  const handleOverlayClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      setSettingsOpen(false)
      setShowConfirmReset(false)
    }
  }

  // Hook up HTML data-theme attribute based on game state
  useEffect(() => {
    const theme = settings.colorTheme || 'solar-punk'
    document.documentElement.setAttribute('data-theme', theme)
  }, [settings.colorTheme])

  if (!isSettingsOpen) return null

  const volumeMaster = settings.volumeMaster ?? 80
  const volumeBgm = settings.volumeBgm ?? 70
  const volumeSfx = settings.volumeSfx ?? 70
  const mute = settings.mute ?? false
  const gridOverlay = settings.gridOverlay ?? true
  const editorTheme = settings.editorTheme ?? 'drone-dark'
  const colorTheme = settings.colorTheme ?? 'solar-punk'

  return (
    <div className="settings-overlay" onClick={handleOverlayClick}>
      <div className="settings-card pixel-border-thick" ref={modalRef}>
        
        {/* Header */}
        <header className="settings-header">
          <div className="settings-title-wrap">
            <MaterialIcon icon="settings" />
            <h2 className="settings-title font-headline-lg">GAME CONFIGURATION</h2>
          </div>
          <button 
            className="settings-close-btn pixel-border btn-press"
            onClick={() => {
              setSettingsOpen(false)
              setShowConfirmReset(false)
            }}
            title="Close Settings"
          >
            <MaterialIcon icon="close" size="18px" style={{ color: '#3c2a21' }} />
          </button>
        </header>

        {/* Scrollable Settings Content */}
        <div className="settings-body top-light-inset">
          
          {/* Audio Section */}
          <section className="settings-section">
            <div className="settings-section-header">
              <MaterialIcon icon="volume_up" />
              <h3>AUDIO CONTROLS</h3>
            </div>
            
            <div className="settings-row settings-row--mute">
              <span className="settings-label">Mute All Sound</span>
              <label className="pixel-checkbox-container">
                <input 
                  type="checkbox" 
                  checked={mute} 
                  onChange={(e) => updateSetting('mute', e.target.checked)} 
                />
                <span className="pixel-checkmark"></span>
              </label>
            </div>

            <div className={`settings-sliders ${mute ? 'settings-sliders--disabled' : ''}`}>
              {/* Master Volume */}
              <div className="settings-slider-group">
                <div className="settings-slider-header">
                  <span className="settings-label">Master Volume</span>
                  <span className="settings-value">{mute ? '0' : volumeMaster}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={volumeMaster} 
                  disabled={mute}
                  onChange={(e) => updateSetting('volumeMaster', parseInt(e.target.value))} 
                  className="pixel-slider"
                />
              </div>

              {/* Music BGM Volume */}
              <div className="settings-slider-group">
                <div className="settings-slider-header">
                  <span className="settings-label">Background Music (BGM)</span>
                  <span className="settings-value">{mute ? '0' : volumeBgm}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={volumeBgm} 
                  disabled={mute}
                  onChange={(e) => updateSetting('volumeBgm', parseInt(e.target.value))} 
                  className="pixel-slider"
                />
              </div>

              {/* Sound Effects SFX Volume */}
              <div className="settings-slider-group">
                <div className="settings-slider-header">
                  <span className="settings-label">Sound Effects (SFX)</span>
                  <span className="settings-value">{mute ? '0' : volumeSfx}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={volumeSfx} 
                  disabled={mute}
                  onChange={(e) => updateSetting('volumeSfx', parseInt(e.target.value))} 
                  className="pixel-slider"
                />
              </div>
            </div>
          </section>

          {/* Interface & Overlay Section */}
          <section className="settings-section">
            <div className="settings-section-header">
              <MaterialIcon icon="grid_on" />
              <h3>INTERFACE & DISPLAYS</h3>
            </div>

            {/* Grid Overlay Toggle */}
            <div className="settings-row">
              <div className="settings-row-info">
                <span className="settings-label">Grid Coordinate Overlay</span>
                <p className="settings-sublabel">Shows tiny coordinate tags like (r,c) in tile corners to assist in scripting</p>
              </div>
              <label className="pixel-checkbox-container">
                <input 
                  type="checkbox" 
                  checked={gridOverlay} 
                  onChange={(e) => updateSetting('gridOverlay', e.target.checked)} 
                />
                <span className="pixel-checkmark"></span>
              </label>
            </div>

            {/* Color Palette Theme */}
            <div className="settings-row">
              <div className="settings-row-info">
                <span className="settings-label">Game Visual Theme</span>
                <p className="settings-sublabel">Overrides game system colors, borders, and backgrounds</p>
              </div>
              <div className="pixel-select-wrapper">
                <select 
                  value={colorTheme} 
                  onChange={(e) => updateSetting('colorTheme', e.target.value)}
                  className="pixel-select"
                >
                  <option value="solar-punk">SOLAR PUNK (Default)</option>
                  <option value="cyber-punk">CYBER PUNK (Neon)</option>
                  <option value="classic-amber">AMBER CRT (Classic)</option>
                  <option value="alabaster-light">ALABASTER (Light)</option>
                </select>
                <div className="pixel-select-arrow">▼</div>
              </div>
            </div>
          </section>

          {/* Code Editor Section */}
          <section className="settings-section">
            <div className="settings-section-header">
              <MaterialIcon icon="code" />
              <h3>CODE EDITOR</h3>
            </div>

            {/* Code Editor Theme */}
            <div className="settings-row">
              <div className="settings-row-info">
                <span className="settings-label">Monaco Theme</span>
                <p className="settings-sublabel">Choose the style of the drone scripting console</p>
              </div>
              <div className="pixel-select-wrapper">
                <select 
                  value={editorTheme} 
                  onChange={(e) => updateSetting('editorTheme', e.target.value)}
                  className="pixel-select"
                >
                  <option value="drone-dark">DRONE DARK (Cozy)</option>
                  <option value="vs-light">MONACO LIGHT (Clean)</option>
                  <option value="hc-black">HIGH CONTRAST (Accessibility)</option>
                </select>
                <div className="pixel-select-arrow">▼</div>
              </div>
            </div>
          </section>

          {/* Danger Zone Section */}
          <section className="settings-section settings-section--danger">
            <div className="settings-section-header">
              <MaterialIcon icon="warning" />
              <h3>DANGER ZONE</h3>
            </div>
            
            <div className="settings-row settings-row--danger">
              <div className="settings-row-info">
                <span className="settings-label">Reset Farm Progress</span>
                <p className="settings-sublabel">Permanently erases all resources, unlocked nodes, inventory, and logic scripts</p>
              </div>
              
              {!showConfirmReset ? (
                <button 
                  className="settings-reset-btn settings-reset-btn--trigger pixel-border btn-press font-label-tech"
                  onClick={() => setShowConfirmReset(true)}
                >
                  WIPE DATA
                </button>
              ) : (
                <div className="settings-reset-confirm-box">
                  <span className="settings-reset-warning-text">CONFIRM WIPE? THIS CANNOT BE UNDONE!</span>
                  <div className="settings-reset-actions">
                    <button 
                      className="settings-reset-btn settings-reset-btn--confirm pixel-border btn-press font-label-tech"
                      onClick={() => {
                        resetGame()
                        setShowConfirmReset(false)
                        setSettingsOpen(false)
                        window.location.reload()
                      }}
                    >
                      CONFIRM WIPE
                    </button>
                    <button 
                      className="settings-reset-btn settings-reset-btn--abort pixel-border btn-press font-label-tech"
                      onClick={() => setShowConfirmReset(false)}
                    >
                      ABORT
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Footer */}
        <footer className="settings-footer">
          <button 
            className="settings-save-btn pixel-border btn-press font-label-tech"
            onClick={() => setSettingsOpen(false)}
          >
            SAVE & CLOSE
          </button>
        </footer>

      </div>
    </div>
  )
}
