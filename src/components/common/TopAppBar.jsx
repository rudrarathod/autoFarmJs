import { useNavigate } from 'react-router-dom'
import './TopAppBar.css'
import HudStats from './HudStats.jsx'
import MaterialIcon from './MaterialIcon.jsx'
import { useGameStore } from '../../store/gameStore.js'

/**
 * Top application bar with title, HUD stats, and action buttons.
 * @param {object} props
 * @param {string} [props.activeTab] - Currently active tab ('farm' | 'progress')
 * @param {boolean} [props.showTabs] - Whether to show the FARM/PROGRESS TREE tabs
 */
export default function TopAppBar({ activeTab = 'farm', showTabs = true }) {
  const navigate = useNavigate()
  const setHelpOpen = useGameStore((s) => s.setHelpOpen)

  return (
    <header className="top-app-bar">
      <div className="top-app-bar__left">
        <h1 className="top-app-bar__title font-headline-lg" onClick={() => navigate('/')}>
          Rural Automation
        </h1>
        <h1 className="top-app-bar__title-mobile font-headline-lg-mobile" onClick={() => navigate('/')}>
          Rural Auto
        </h1>
      </div>

      {showTabs && (
        <div className="top-app-bar__tabs pixel-border">
          <button
            className={`top-app-bar__tab font-label-tech ${activeTab === 'farm' ? 'top-app-bar__tab--active' : ''}`}
            onClick={() => navigate('/sandbox')}
          >
            FARM
          </button>
          <button
            className={`top-app-bar__tab font-label-tech ${activeTab === 'progress' ? 'top-app-bar__tab--active' : ''}`}
            onClick={() => navigate('/progress-tree')}
          >
            PROGRESS TREE
          </button>
        </div>
      )}

      <div className="top-app-bar__right">
        <HudStats />
        <button 
          className="top-app-bar__action"
          onClick={() => useGameStore.getState().setSettingsOpen(true)}
        >
          <MaterialIcon icon="settings" />
        </button>
        <button className="top-app-bar__action" onClick={() => setHelpOpen(true)}>
          <MaterialIcon icon="help" />
        </button>
      </div>
    </header>
  )
}
