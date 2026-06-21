import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../../store/gameStore.js'
import './SideNav.css'
import MaterialIcon from '../common/MaterialIcon.jsx'

/**
 * Home page side navigation with Continue, New Farm, Settings, and Exit.
 */
export default function SideNav() {
  const navigate = useNavigate()
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <nav className="side-nav glass-panel">
      {/* Header */}
      <div className="side-nav__header">
        <h1 className="side-nav__title font-headline-lg">
          Rural Automation
        </h1>
        <div className="side-nav__version-wrap">
          <span className="side-nav__version font-label-tech pixel-border">
            V 1.0.4 - Solar Punk Edition
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="side-nav__links">
        {/* Active: Continue */}
        <a
          className="side-nav__link side-nav__link--active btn-press top-light-inset"
          onClick={() => navigate('/sandbox')}
        >
          <MaterialIcon icon="play_circle" filled className="side-nav__link-icon" />
          <span className="font-body-lg">Continue</span>
        </a>

        {/* New Farm */}
        <a 
          className="side-nav__link btn-press" 
          onClick={() => setShowConfirm(true)}
        >
          <MaterialIcon icon="add_circle" className="side-nav__link-icon side-nav__link-icon--primary" />
          <span className="font-body-lg">New Farm</span>
        </a>

        {/* Settings */}
        <a 
          className="side-nav__link btn-press" 
          onClick={() => useGameStore.getState().setSettingsOpen(true)}
        >
          <MaterialIcon icon="settings" className="side-nav__link-icon side-nav__link-icon--primary" />
          <span className="font-body-lg">Settings</span>
        </a>

        {/* Exit (pushed to bottom) */}
        <div className="side-nav__spacer" />
        <a className="side-nav__link side-nav__link--exit btn-press" href="#">
          <MaterialIcon icon="power_settings_new" className="side-nav__link-icon" />
          <span className="font-body-lg">Exit</span>
        </a>
      </div>

      {/* Retro Confirmation Modal */}
      {showConfirm && (
        <div className="side-nav__modal-overlay">
          <div className="side-nav__modal-card pixel-border-thick top-light-inset">
            {/* Modal Header */}
            <div className="side-nav__modal-header">
              <MaterialIcon icon="warning" className="side-nav__modal-warn-icon" />
              <h2 className="font-headline-md side-nav__modal-title">INITIALIZE NEW FARM?</h2>
            </div>
            
            {/* Modal Body */}
            <p className="font-body-md side-nav__modal-body">
              Are you sure you want to start a new farm? This action will permanently erase your current drone automation logic, crop resources, research progress, and level milestones.
            </p>
            
            {/* Modal Footer / Buttons */}
            <div className="side-nav__modal-actions">
              <button 
                className="side-nav__modal-btn side-nav__modal-btn--confirm pixel-border btn-press font-label-tech"
                onClick={() => {
                  useGameStore.getState().resetGame()
                  setShowConfirm(false)
                  navigate('/sandbox')
                }}
              >
                CONFIRM
              </button>
              <button 
                className="side-nav__modal-btn side-nav__modal-btn--cancel pixel-border btn-press font-label-tech"
                onClick={() => setShowConfirm(false)}
              >
                ABORT
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
