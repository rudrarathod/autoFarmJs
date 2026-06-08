import { useNavigate } from 'react-router-dom'
import './TabToggle.css'

/**
 * Floating tab toggle between FARM and PROGRESS TREE views.
 * @param {object} props
 * @param {'farm' | 'progress'} props.active - Currently active tab
 */
export default function TabToggle({ active = 'farm' }) {
  const navigate = useNavigate()

  return (
    <div className="tab-toggle pixel-border top-light-inset">
      <button
        className={`tab-toggle__btn font-label-tech ${active === 'farm' ? '' : 'tab-toggle__btn--inactive'}`}
        onClick={() => navigate('/sandbox')}
      >
        FARM
      </button>
      <button
        className={`tab-toggle__btn font-label-tech ${active === 'progress' ? 'tab-toggle__btn--active' : 'tab-toggle__btn--inactive'}`}
        onClick={() => navigate('/progress-tree')}
      >
        PROGRESS TREE
      </button>
    </div>
  )
}
