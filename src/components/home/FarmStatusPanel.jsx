import './FarmStatusPanel.css'
import MaterialIcon from '../common/MaterialIcon.jsx'
import { useGameStore } from '../../store/gameStore.js'

/**
 * Farm Status overlay panel showing energy, yield, and sync button.
 */
export default function FarmStatusPanel() {
  const energy = useGameStore((state) => state.energy)
  const maxEnergy = useGameStore((state) => state.maxEnergy)
  const inventory = useGameStore((state) => state.inventory)

  const energyPercent = Math.round((energy / maxEnergy) * 100)
  const totalYield = Object.values(inventory).reduce((sum, count) => sum + count, 0)

  return (
    <div className="farm-status pixel-border">
      {/* Background tint */}
      <div className="farm-status__bg-tint" />

      <div className="farm-status__content">
        {/* Header */}
        <div className="farm-status__header">
          <h3 className="farm-status__title font-headline-md">
            <MaterialIcon icon="spa" className="farm-status__title-icon" />
            Farm Status
          </h3>
          <span className="farm-status__indicator" />
        </div>

        {/* Stats Grid */}
        <div className="farm-status__grid">
          <div className="farm-status__stat">
            <span className="farm-status__stat-label font-label-tech">Energy</span>
            <span className="farm-status__stat-value farm-status__stat-value--primary font-headline-md">{energyPercent}%</span>
          </div>
          <div className="farm-status__stat">
            <span className="farm-status__stat-label font-label-tech">Total Yield</span>
            <span className="farm-status__stat-value farm-status__stat-value--amber font-headline-md">{totalYield}</span>
          </div>
        </div>

        {/* Sync Button */}
        <button className="farm-status__sync-btn btn-press top-light-inset pixel-border">
          <MaterialIcon icon="sync" size="18px" />
          Sync Drones
        </button>
      </div>
    </div>
  )
}
