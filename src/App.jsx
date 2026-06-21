import { useEffect, useState, useCallback } from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import SandboxPage from './pages/SandboxPage.jsx'
import ProgressTreePage from './pages/ProgressTreePage.jsx'
import HelpManualModal from './components/common/HelpManualModal.jsx'
import SettingsPanelModal from './components/common/SettingsPanelModal.jsx'
import SplashScreen from './components/splash/SplashScreen.jsx'
import { useGameStore } from './store/gameStore.js'

export default function App() {
  const [assetsReady, setAssetsReady] = useState(false)
  const colorTheme = useGameStore((s) => s.settings?.colorTheme || 'solar-punk')

  // Apply color theme class dynamically to HTML element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', colorTheme)
  }, [colorTheme])

  // Passive drone energy recharge loop (3 energy every 2 seconds)
  useEffect(() => {
    const rechargeInterval = setInterval(() => {
      useGameStore.getState().rechargeEnergy(3)
    }, 2000)
    return () => clearInterval(rechargeInterval)
  }, [])

  const handleSplashComplete = useCallback(() => {
    setAssetsReady(true)
  }, [])

  // Show splash screen until all assets are preloaded
  if (!assetsReady) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sandbox" element={<SandboxPage />} />
        <Route path="/progress-tree" element={<ProgressTreePage />} />
      </Routes>
      <HelpManualModal />
      <SettingsPanelModal />
    </>
  )
}
