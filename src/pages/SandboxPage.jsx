import { useState } from 'react'
import './SandboxPage.css'
import TopAppBar from '../components/common/TopAppBar.jsx'
import BottomNavBar from '../components/common/BottomNavBar.jsx'
import PixiFarmCanvas from '../components/sandbox/PixiFarmCanvas.jsx'
import DroneLogicPanel from '../components/sandbox/DroneLogicPanel.jsx'
import MaterialIcon from '../components/common/MaterialIcon.jsx'
import { useGameStore, CROP_CONFIGS } from '../store/gameStore.js'
import { EXPANSION_COSTS } from '../config/assetsConfig.js'

/**
 * Sandbox Page - Farm view with PixiJS canvas and drone logic panel.
 * The main gameplay screen combining the farm canvas and code editor.
 */
export default function SandboxPage() {
  const selectedCrop = useGameStore((state) => state.selectedCrop)
  const setSelectedCrop = useGameStore((state) => state.setSelectedCrop)
  const inventory = useGameStore((state) => state.inventory)
  const gridSize = useGameStore((state) => state.grid.length)

  const [showExpandConfirm, setShowExpandConfirm] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isTouchInteractive, setIsTouchInteractive] = useState(true)

  return (
    <div className="sandbox-page">
      {/* Top App Bar */}
      <TopAppBar activeTab="farm" showTabs={true} />

      {/* Main Workspace */}
      <div className="sandbox-page__workspace">
        {/* Farm Canvas with floating tools */}
        <div className="sandbox-page__canvas-area">
          <PixiFarmCanvas interactive={isTouchInteractive} />

          {/* Floating Crop Selector Bar */}
          <div className="sandbox-page__crop-selector pixel-border top-light-inset">
            <span className="font-label-tech sandbox-page__selector-title">SELECT SEED</span>
            <div className="sandbox-page__crop-buttons">
              {Object.entries(CROP_CONFIGS).map(([name, cfg]) => {
                const isSelected = selectedCrop === name
                return (
                  <button
                    key={name}
                    onClick={() => setSelectedCrop(name)}
                    className={`sandbox-page__crop-btn pixel-border btn-press ${isSelected ? 'sandbox-page__crop-btn--active' : ''}`}
                    title={`Cost: ${cfg.cost} Energy, Reward: ${cfg.xp} XP`}
                  >
                    <span className="crop-btn-name">{name.toUpperCase()}</span>
                    <span className="crop-btn-cost">{cfg.cost}⚡</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Floating Inventory HUD Panel */}
          <div className="sandbox-page__inventory pixel-border top-light-inset">
            <span className="font-label-tech sandbox-page__inventory-title">HARVESTS</span>
            <div className="sandbox-page__inventory-list">
              {Object.entries(inventory).map(([crop, count]) => {
                const emojis = {
                  wheat: '🌾',
                  carrot: '🥕',
                  beetroot: '🍠',
                  potato: '🥔',
                  watermelon: '🍉',
                  grass: '🌿',
                  copper_ore: '🧱',
                  iron_ore: '🪨',
                  crystal_ore: '💎'
                }
                return (
                  <div key={crop} className="sandbox-page__inventory-item" title={`${crop.toUpperCase()}: ${count}`}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="sandbox-page__inventory-emoji">{emojis[crop] || '🌱'}</span>
                      <span className="crop-btn-name" style={{ color: '#3c2a21' }}>{crop.replace('_', ' ').toUpperCase()}</span>
                    </div>
                    <span className="sandbox-page__inventory-count font-label-tech">{count}</span>
                  </div>
                )
              })}
            </div>

            {gridSize < 6 && (
              <>
                <div style={{ margin: '8px 0', height: '2px', backgroundColor: 'rgba(60, 42, 33, 0.12)' }} />
                <button
                  onClick={() => {
                    setErrorMessage('')
                    setShowExpandConfirm(true)
                  }}
                  className="sandbox-page__expand-btn pixel-border btn-press font-label-tech"
                >
                  EXPAND ({gridSize + 1}x{gridSize + 1})
                </button>
              </>
            )}
          </div>

          {/* Floating Mobile Tools */}
          <div className="sandbox-page__canvas-tools">
            <button 
              className={`sandbox-page__tool-btn pixel-border btn-press ${!isTouchInteractive ? 'sandbox-page__tool-btn--disabled' : ''}`}
              onClick={() => setIsTouchInteractive(!isTouchInteractive)}
              title={isTouchInteractive ? "Disable Touch Interaction" : "Enable Touch Interaction"}
            >
              <MaterialIcon icon={isTouchInteractive ? "touch_app" : "do_not_touch"} />
            </button>
            <button 
              className="sandbox-page__tool-btn pixel-border btn-press"
              onClick={() => useGameStore.getState().zoomIn()}
              title="Zoom In"
            >
              <MaterialIcon icon="zoom_in" />
            </button>
            <button 
              className="sandbox-page__tool-btn pixel-border btn-press"
              onClick={() => useGameStore.getState().resetZoom()}
              title="Reset Zoom"
            >
              <MaterialIcon icon="center_focus_strong" />
            </button>
            <button 
              className="sandbox-page__tool-btn pixel-border btn-press"
              onClick={() => useGameStore.getState().zoomOut()}
              title="Zoom Out"
            >
              <MaterialIcon icon="zoom_out" />
            </button>
          </div>
        </div>

        {/* Drone Logic Panel */}
        <DroneLogicPanel />
      </div>

      {/* Mobile Bottom Nav */}
      <BottomNavBar activeItem="machines" />

      {/* Retro Custom Grid Expansion Modal */}
      {showExpandConfirm && (
        <div className="sandbox-page__modal-overlay">
          <div className="sandbox-page__modal-card pixel-border-thick top-light-inset">
            {/* Modal Header */}
            <div className="sandbox-page__modal-header">
              <MaterialIcon icon="grid_view" className="sandbox-page__modal-icon" />
              <h2 className="font-headline-md sandbox-page__modal-title">EXPAND REGION?</h2>
            </div>
            
            {/* Modal Body */}
            <div className="sandbox-page__modal-body">
              <p className="font-body-md" style={{ marginBottom: '16px' }}>
                Clear outer land blockades to expand the active farming grid to <strong style={{ color: '#002204' }}>{gridSize + 1}x{gridSize + 1}</strong>.
              </p>
              
              <div className="sandbox-page__modal-requirements">
                <span className="font-label-tech" style={{ color: '#5c4335', display: 'block', marginBottom: '8px' }}>REQUIRED HARVESTS:</span>
                {Object.entries(EXPANSION_COSTS[gridSize + 1] || {}).map(([crop, reqCount]) => {
                  const currentCount = inventory[crop] || 0
                  const isEnough = currentCount >= reqCount
                  const emojis = {
                    wheat: '🌾',
                    carrot: '🥕',
                    beetroot: '🍠',
                    potato: '🥔',
                    watermelon: '🍉'
                  }
                  return (
                    <div key={crop} className="sandbox-page__modal-req-item font-body-md" style={{ color: isEnough ? '#2e7d32' : '#ba1a1a' }}>
                      <span>{emojis[crop] || '🌱'} {crop.toUpperCase()}:</span>
                      <strong>{currentCount} / {reqCount}</strong>
                    </div>
                  )
                })}
              </div>
            </div>
            
            {/* Error Message */}
            {errorMessage && (
              <p className="font-label-tech" style={{ color: '#ba1a1a', margin: '0', textAlign: 'center' }}>
                {errorMessage}
              </p>
            )}

            {/* Modal Footer / Actions */}
            <div className="sandbox-page__modal-actions">
              <button 
                className="sandbox-page__modal-btn sandbox-page__modal-btn--confirm pixel-border btn-press font-label-tech"
                onClick={() => {
                  const success = useGameStore.getState().expandGrid()
                  if (success) {
                    setShowExpandConfirm(false)
                    setErrorMessage('')
                  } else {
                    setErrorMessage('Insufficient harvests to purchase expansion!')
                  }
                }}
              >
                BUY REGION
              </button>
              <button 
                className="sandbox-page__modal-btn sandbox-page__modal-btn--cancel pixel-border btn-press font-label-tech"
                onClick={() => {
                  setShowExpandConfirm(false)
                  setErrorMessage('')
                }}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
