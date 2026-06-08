import './HomePage.css'
import SideNav from '../components/home/SideNav.jsx'
import FarmStatusPanel from '../components/home/FarmStatusPanel.jsx'
import PixiFarmCanvas from '../components/sandbox/PixiFarmCanvas.jsx'
import '../components/home/PixiHomeBackground.css'

/**
 * Home Screen - The main menu / landing page.
 * Features the live farm sandbox background, side navigation, 
 * and a farm status overlay panel.
 */
export default function HomePage() {
  return (
    <div className="home-page">
      {/* Full Screen Live Sandbox Background */}
      <div className="pixi-home-bg">
        <PixiFarmCanvas interactive={false} />
        <div className="pixi-home-bg__overlay" />
      </div>

      {/* Side Navigation */}
      <SideNav />

      {/* Main Content Area */}
      <main className="home-page__main">
        <div className="home-page__status-wrap">
          <FarmStatusPanel />
        </div>
      </main>
    </div>
  )
}
