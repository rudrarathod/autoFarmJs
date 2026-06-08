import { useEffect, useRef } from 'react'
import './ProgressTreePage.css'
import TopAppBar from '../components/common/TopAppBar.jsx'
import BottomNavBar from '../components/common/BottomNavBar.jsx'
import TabToggle from '../components/common/TabToggle.jsx'
import TreeNode from '../components/progress/TreeNode.jsx'
import TreeConnections from '../components/progress/TreeConnections.jsx'
import { useGameStore } from '../store/gameStore.js'

/**
 * Progress Tree Page - Skill/tech tree for automation upgrades.
 * Features three upgrade paths: Logic, Efficiency, and Expansion.
 * Supports drag-to-scroll panning.
 */

// Node definitions for the progress tree
const TREE_NODES = {
  root: {
    icon: 'terminal',
    title: 'Basic Logic',
    status: 'unlocked',
    description: 'Enables basic sequential drone operations and pathing.',
    style: { top: 50, left: 600 },
  },
  // PATH 1: LOGIC
  loops: {
    icon: 'all_inclusive',
    title: 'Loops',
    status: 'unlocked',
    description: 'Allows drones to repeat tasks without manual resets.',
    style: { top: 250, left: 200 },
  },
  variables: {
    icon: 'data_object',
    title: 'Variables',
    status: 'locked',
    description: 'Store and recall values for dynamic script execution.',
    xpCost: 1200,
    style: { top: 450, left: 200 },
  },
  functions: {
    icon: 'function',
    title: 'Functions',
    status: 'locked',
    description: 'Create reusable code blocks for complex operations.',
    xpCost: 3000,
    style: { top: 650, left: 200 },
  },
  logicPro: {
    icon: 'memory',
    title: 'Logic Pro',
    status: 'locked',
    description: 'Master-level logic enabling AI-driven decisions.',
    xpCost: 7500,
    style: { top: 850, left: 200 },
  },
  // PATH 2: EFFICIENCY
  advancedSensors: {
    icon: 'sensors',
    title: 'Advanced Sensors',
    status: 'reachable',
    description: 'Detect crop moisture and nutrient levels instantly.',
    xpCost: 500,
    style: { top: 250, left: 600 },
  },
  fasterHarvesting: {
    icon: 'speed',
    title: 'Faster Harvesting',
    status: 'locked',
    description: 'Increases drone gathering speed by 25%.',
    xpCost: 1200,
    style: { top: 450, left: 600 },
  },
  energyEfficiency: {
    icon: 'battery_charging_full',
    title: 'Energy Efficiency',
    status: 'locked',
    description: 'Reduces overall drone energy consumption.',
    xpCost: 3000,
    style: { top: 650, left: 600 },
  },
  // PATH 3: EXPANSION
  landExpansion1: {
    icon: 'landscape',
    title: 'Land Expansion I',
    status: 'reachable',
    description: 'Unlocks the adjacent Eastern plot for farming.',
    xpCost: 500,
    style: { top: 250, left: 1000 },
  },
  landExpansion2: {
    icon: 'terrain',
    title: 'Land Expansion II',
    status: 'locked',
    description: 'Expands farmable area across the river.',
    xpCost: 1200,
    style: { top: 450, left: 1000 },
  },
  multiDrone: {
    icon: 'hub',
    title: 'Multi-Drone Control',
    status: 'locked',
    description: 'Coordinate tasks across multiple drones simultaneously.',
    xpCost: 3000,
    style: { top: 650, left: 1000 },
  },
}

export default function ProgressTreePage() {
  const canvasRef = useRef(null)
  const getNodeStatus = useGameStore((state) => state.getNodeStatus)
  const unlockNode = useGameStore((state) => state.unlockNode)

  // Drag-to-scroll panning
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let isDown = false
    let startX, startY, scrollLeft, scrollTop

    const onMouseDown = (e) => {
      isDown = true
      canvas.style.cursor = 'grabbing'
      startX = e.pageX - canvas.offsetLeft
      startY = e.pageY - canvas.offsetTop
      scrollLeft = canvas.scrollLeft
      scrollTop = canvas.scrollTop
    }

    const onMouseLeave = () => {
      isDown = false
      canvas.style.cursor = 'default'
    }

    const onMouseUp = () => {
      isDown = false
      canvas.style.cursor = 'default'
    }

    const onMouseMove = (e) => {
      if (!isDown) return
      e.preventDefault()
      const x = e.pageX - canvas.offsetLeft
      const y = e.pageY - canvas.offsetTop
      const walkX = (x - startX) * 1.5
      const walkY = (y - startY) * 1.5
      canvas.scrollLeft = scrollLeft - walkX
      canvas.scrollTop = scrollTop - walkY
    }

    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mouseleave', onMouseLeave)
    canvas.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('mousemove', onMouseMove)

    // Center on load
    canvas.scrollLeft = (canvas.scrollWidth - canvas.clientWidth) / 2

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mouseleave', onMouseLeave)
      canvas.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  return (
    <div className="progress-tree-page">
      {/* Top App Bar */}
      <TopAppBar activeTab="progress" showTabs={true} />

      {/* Main Workspace with Coming Soon banner */}
      <div className="progress-tree-page__workspace">
        <main className="progress-tree-page__canvas grid-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          
          <div className="progress-tree-page__coming-soon pixel-border-thick">
            <div className="coming-soon__icon">
              <span className="coming-soon__gear-spin">⚙️</span>
              <span className="coming-soon__tool">🔧</span>
            </div>
            <h2>Progress Tree</h2>
            <div className="coming-soon__badge font-label-tech">COMING SOON</div>
            <p>
              We are compiling advanced logic processors and tuning the drone's energy transducers. Soon you will be able to upgrade your drone hardware, unlock complex programming functions, and expand your land size!
            </p>
            <div className="coming-soon__status">
              <span className="coming-soon__pulse"></span>
              <span className="font-label-tech" style={{ color: '#98c379', fontWeight: 700 }}>SYSTEM CALIBRATION IN PROGRESS</span>
            </div>
          </div>

        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <BottomNavBar activeItem="research" />
    </div>
  )
}
