import { Handle, Position } from '@xyflow/react'
import './TreeNode.css'
import MaterialIcon from '../common/MaterialIcon.jsx'
import skillTree from '../../config/skillTree.json'
import { useGameStore } from '../../store/gameStore.js'

// Pre-build a lookup registry for parent name lookups
const flatNodes = {}
function flatten(node) {
  if (!node) return
  flatNodes[node.id] = { name: node.name, xpCost: node.xpCost }
  if (node.children) {
    Object.values(node.children).forEach(flatten)
  }
}
flatten(skillTree)

/**
 * TreeNode - Custom React Flow Node representing a tech unlock.
 * Renders status-based pixel borders, glow animations, and hover tooltips.
 */
export default function TreeNode({ data }) {
  const {
    icon,
    title,
    status = 'locked',
    description = '',
    xpCost,
    onUnlock,
    color, // branch color (hex)
    parents,
  } = data

  const unlockedNodes = useGameStore((state) => state.unlockedNodes)

  const isUnlocked = status === 'unlocked'
  const isReachable = status === 'reachable'
  const isLocked = status === 'locked'

  // Construct status-specific classes
  const nodeClass = [
    'tree-node pixel-border',
    isUnlocked && 'tree-node--unlocked top-light-inset',
    isReachable && 'tree-node--reachable animate-pulse-glow',
    isLocked && 'tree-node--locked',
  ]
    .filter(Boolean)
    .join(' ')

  // Dynamic style overrides using the branch color
  const nodeStyle = {}
  const iconWrapStyle = {}
  const titleStyle = {}
  const badgeStyle = {}

  if (color) {
    if (isUnlocked) {
      nodeStyle.borderColor = color
      nodeStyle.backgroundColor = `${color}15` // ~8% opacity
      nodeStyle.boxShadow = `0 6px 0 0 ${color}40`
      titleStyle.color = color
    } else if (isReachable) {
      nodeStyle.borderColor = color
      nodeStyle.backgroundColor = `${color}0c` // ~5% opacity
      nodeStyle.boxShadow = `0 6px 0 0 ${color}30`
      titleStyle.color = color
      badgeStyle.backgroundColor = color
      badgeStyle.color = '#fff'
      badgeStyle.borderColor = color
    } else if (isLocked) {
      nodeStyle.borderColor = `${color}25` // faded branch color
      // Maintain desaturated background for locked state
    }

    // Icon Wrap overrides
    if (isUnlocked) {
      iconWrapStyle.backgroundColor = color
      iconWrapStyle.borderColor = color
      iconWrapStyle.color = '#ffffff'
    } else if (isReachable) {
      iconWrapStyle.backgroundColor = `${color}25`
      iconWrapStyle.borderColor = color
      iconWrapStyle.color = color
    } else if (isLocked) {
      iconWrapStyle.borderColor = `${color}35`
    }
  }

  return (
    <div className={nodeClass} style={nodeStyle}>
      {/* Handles for React Flow connections */}
      <Handle type="target" position={Position.Top} className="tree-node__handle" />
      <Handle type="source" position={Position.Bottom} className="tree-node__handle" />

      {/* Status indicator badges */}
      {isReachable && (
        <div className="tree-node__badge tree-node__badge--reachable pixel-border top-light-inset" style={badgeStyle}>
          <MaterialIcon icon="lock_open" filled size="12px" />
        </div>
      )}
      {isLocked && (
        <div className="tree-node__badge tree-node__badge--locked pixel-border">
          <MaterialIcon icon="lock" filled size="12px" />
        </div>
      )}

      {/* Node Icon wrapper */}
      <div
        className={`tree-node__icon-wrap pixel-border top-light-inset ${
          isUnlocked
            ? 'tree-node__icon-wrap--unlocked'
            : isReachable
            ? 'tree-node__icon-wrap--reachable'
            : 'tree-node__icon-wrap--locked'
        }`}
        style={iconWrapStyle}
      >
        <MaterialIcon
          icon={icon}
          filled={isUnlocked}
          className={`tree-node__icon ${isLocked ? 'tree-node__icon--dimmed' : ''}`}
          style={{ color: (isUnlocked && '#fff') || (isReachable && color) || undefined }}
          size="28px"
        />
      </div>

      {/* Node Text & Actions */}
      <div className="tree-node__content">
        <h3 className="tree-node__title font-headline-md" style={titleStyle}>{title}</h3>

        {isUnlocked && xpCost !== undefined && (
          <span className="tree-node__status font-label-tech">Unlocked</span>
        )}

        {(isReachable || isLocked) && xpCost !== undefined && (
          <div className={`tree-node__xp-badge ${isReachable ? 'tree-node__xp-badge--reachable' : ''}`}>
            <MaterialIcon icon="star" filled size="12px" className="tree-node__xp-icon" style={{ color: color || undefined }} />
            <span className="font-label-tech">{xpCost.toLocaleString()} XP</span>
          </div>
        )}

        {isReachable && (
          <button
            className="tree-node__unlock-btn font-label-tech pixel-border top-light-inset btn-press nodrag"
            style={{ backgroundColor: color, color: '#fff', borderColor: color }}
            onClick={(e) => {
              e.stopPropagation()
              onUnlock?.()
            }}
          >
            UNLOCK
          </button>
        )}
      </div>

      {/* Hover Info Tooltip */}
      {description && (
        <div className="tree-node__tooltip pixel-border top-light-inset">
          <div className="tree-node__tooltip-header">
            <span className="tree-node__tooltip-title">{title}</span>
            <span 
              className={`tree-node__tooltip-status tree-node__tooltip-status--${status}`}
              style={{ color: status === 'unlocked' ? '#4caf50' : status === 'reachable' ? '#ff9800' : '#a0a0a0' }}
            >
              {status === 'unlocked' ? 'UNLOCKED' : status === 'reachable' ? 'AVAILABLE' : 'LOCKED'}
            </span>
          </div>

          <div className="tree-node__tooltip-divider" />

          <p className="tree-node__tooltip-desc">{description}</p>

          {parents && parents.length > 0 && (
            <div className="tree-node__tooltip-prereqs">
              <span className="tree-node__tooltip-section-title">PREREQUISITES</span>
              <div className="tree-node__tooltip-prereq-list">
                {parents.map(pId => {
                  const pName = flatNodes[pId]?.name || pId
                  const isParentUnlocked = pId === 'ruralAutomation' || unlockedNodes.includes(pId) || flatNodes[pId]?.xpCost === undefined
                  return (
                    <div key={pId} className="tree-node__tooltip-prereq-item">
                      <span className="tree-node__tooltip-prereq-status">{isParentUnlocked ? '✅' : '❌'}</span>
                      <span className={isParentUnlocked ? 'tree-node__tooltip-prereq-name--unlocked' : 'tree-node__tooltip-prereq-name--locked'}>{pName}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {xpCost !== undefined && (
            <div className="tree-node__tooltip-cost">
              <span className="tree-node__tooltip-section-title">UNLOCK COST</span>
              <div className="tree-node__tooltip-cost-row">
                <MaterialIcon icon="star" filled size="12px" style={{ color: color || '#ff9800' }} />
                <span className="tree-node__tooltip-cost-val font-label-tech">{xpCost.toLocaleString()} XP</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
