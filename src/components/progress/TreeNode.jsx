import './TreeNode.css'
import MaterialIcon from '../common/MaterialIcon.jsx'

/**
 * A single node in the progress tree.
 * @param {object} props
 * @param {string} props.icon - Material icon name
 * @param {string} props.title - Node title
 * @param {'unlocked' | 'reachable' | 'locked'} props.status - Node unlock state
 * @param {string} [props.description] - Tooltip description
 * @param {number} [props.xpCost] - XP required to unlock
 * @param {object} [props.style] - Position styles (top, left)
 */
export default function TreeNode({
  icon,
  title,
  status = 'locked',
  description = '',
  xpCost,
  style = {},
  onUnlock,
}) {
  const isUnlocked = status === 'unlocked'
  const isReachable = status === 'reachable'
  const isLocked = status === 'locked'

  const nodeClass = [
    'tree-node pixel-border',
    isUnlocked && 'tree-node--unlocked top-light-inset',
    isReachable && 'tree-node--reachable animate-pulse-glow',
    isLocked && 'tree-node--locked',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={nodeClass} style={style}>
      {/* Status badge */}
      {isReachable && (
        <div className="tree-node__badge tree-node__badge--reachable pixel-border top-light-inset">
          <MaterialIcon icon="lock_open" filled size="14px" />
        </div>
      )}
      {isLocked && (
        <div className="tree-node__badge tree-node__badge--locked pixel-border">
          <MaterialIcon icon="lock" filled size="14px" />
        </div>
      )}

      {/* Icon */}
      <div
        className={`tree-node__icon-wrap pixel-border top-light-inset ${
          isUnlocked
            ? 'tree-node__icon-wrap--unlocked'
            : isReachable
            ? 'tree-node__icon-wrap--reachable'
            : 'tree-node__icon-wrap--locked'
        }`}
      >
        <MaterialIcon
          icon={icon}
          filled={isUnlocked}
          className={`tree-node__icon ${isLocked ? 'tree-node__icon--dimmed' : ''}`}
          size="36px"
        />
      </div>

      {/* Content */}
      <div className="tree-node__content">
        <h3 className="tree-node__title font-headline-md">{title}</h3>

        {isUnlocked && (
          <p className="tree-node__status font-label-tech">Unlocked</p>
        )}

        {(isReachable || isLocked) && xpCost && (
          <div className={`tree-node__xp-badge ${isReachable ? 'tree-node__xp-badge--reachable' : ''}`}>
            <MaterialIcon icon="star" filled size="14px" className="tree-node__xp-icon" />
            <span className="font-label-tech">{xpCost.toLocaleString()} XP</span>
          </div>
        )}

        {isReachable && (
          <button 
            className="tree-node__unlock-btn font-label-tech pixel-border top-light-inset btn-press"
            onClick={onUnlock}
          >
            UNLOCK
          </button>
        )}
      </div>

      {/* Tooltip */}
      {description && (
        <div className="tree-node__tooltip pixel-border top-light-inset font-label-tech">
          {description}
        </div>
      )}
    </div>
  )
}
