import './HudStats.css'
import MaterialIcon from './MaterialIcon.jsx'
import { useGameStore } from '../../store/gameStore.js'

/**
 * HUD Stats bar showing XP, Wheat harvested, and Energy.
 * Used in TopAppBar across sandbox and progress tree pages.
 */
export default function HudStats() {
  const xp = useGameStore((state) => state.xp)
  const wheat = useGameStore((state) => state.wheat)
  const energy = useGameStore((state) => state.energy)
  const maxEnergy = useGameStore((state) => state.maxEnergy)

  const energyPercentage = Math.round((energy / maxEnergy) * 100)

  return (
    <div className="hud-stats pixel-border top-light-inset">
      <div className="hud-stat" title="Harvest Experience">
        <MaterialIcon icon="star" filled className="hud-stat-icon hud-stat-icon--amber" size="18px" />
        <span className="hud-stat-value font-label-tech">XP: {xp.toLocaleString()}</span>
      </div>
      <div className="hud-divider" />
      <div className="hud-stat" title="Wheat Harvested">
        <MaterialIcon icon="agriculture" filled className="hud-stat-icon hud-stat-icon--blue" size="18px" />
        <span className="hud-stat-value font-label-tech">WHEAT: {wheat}</span>
      </div>
      <div className="hud-divider" />
      <div className="hud-stat" title="Drone Energy">
        <MaterialIcon icon="bolt" filled className="hud-stat-icon hud-stat-icon--green" size="18px" />
        <span className="hud-stat-value font-label-tech">{energyPercentage}%</span>
      </div>
    </div>
  )
}
