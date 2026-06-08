import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import SandboxPage from './pages/SandboxPage.jsx'
import ProgressTreePage from './pages/ProgressTreePage.jsx'
import HelpManualModal from './components/common/HelpManualModal.jsx'
import { useGameStore } from './store/gameStore.js'

export default function App() {
  // Passive drone energy recharge loop (3 energy every 2 seconds)
  useEffect(() => {
    const rechargeInterval = setInterval(() => {
      useGameStore.getState().rechargeEnergy(3)
    }, 2000)
    return () => clearInterval(rechargeInterval)
  }, [])

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sandbox" element={<SandboxPage />} />
        <Route path="/progress-tree" element={<ProgressTreePage />} />
      </Routes>
      <HelpManualModal />
    </>
  )
}
