import { useEffect, useState, useRef } from 'react'
import { useGameStore } from '../../store/gameStore.js'
import './HelpManualModal.css'
import MaterialIcon from './MaterialIcon.jsx'

/**
 * A beautiful, retro-styled manual/guide overlay that teaches players
 * how to play, explains the game rules, grid tiles, energy systems, tech tree, and lists all APIs.
 */
export default function HelpManualModal() {
  const isHelpOpen = useGameStore((s) => s.isHelpOpen)
  const setHelpOpen = useGameStore((s) => s.setHelpOpen)
  const [activeTab, setActiveTab] = useState('basics') // 'basics' | 'tiles' | 'energy' | 'tech' | 'api'
  const cardRef = useRef(null)

  // Listen for Escape key to close the modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setHelpOpen(false)
      }
    }
    if (isHelpOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isHelpOpen, setHelpOpen])

  // Click outside to close
  const handleOverlayClick = (e) => {
    if (cardRef.current && !cardRef.current.contains(e.target)) {
      setHelpOpen(false)
    }
  }

  if (!isHelpOpen) return null

  return (
    <div className="help-manual-overlay" onClick={handleOverlayClick}>
      <div className="help-manual-card pixel-border-thick" ref={cardRef}>
        
        {/* Header */}
        <header className="help-manual-header">
          <div className="help-manual-title-wrapper">
            <MaterialIcon icon="menu_book" />
            <h2 className="help-manual-title font-headline-lg">OPERATOR MANUAL</h2>
          </div>
          <button 
            className="help-manual-close-btn pixel-border-thick" 
            onClick={() => setHelpOpen(false)}
            title="Close Manual"
          >
            ❌
          </button>
        </header>

        {/* Content Body */}
        <div className="help-manual-body">
          
          {/* Navigation Sidebar */}
          <nav className="help-manual-sidebar">
            <button 
              className={`help-manual-nav-btn ${activeTab === 'basics' ? 'help-manual-nav-btn--active' : ''}`}
              onClick={() => setActiveTab('basics')}
            >
              <MaterialIcon icon="sports_esports" />
              <span>Basics</span>
            </button>
            <button 
              className={`help-manual-nav-btn ${activeTab === 'tiles' ? 'help-manual-nav-btn--active' : ''}`}
              onClick={() => setActiveTab('tiles')}
            >
              <MaterialIcon icon="grid_view" />
              <span>Grid Tiles</span>
            </button>
            <button 
              className={`help-manual-nav-btn ${activeTab === 'energy' ? 'help-manual-nav-btn--active' : ''}`}
              onClick={() => setActiveTab('energy')}
            >
              <MaterialIcon icon="bolt" />
              <span>Energy System</span>
            </button>
            <button 
              className={`help-manual-nav-btn ${activeTab === 'tech' ? 'help-manual-nav-btn--active' : ''}`}
              onClick={() => setActiveTab('tech')}
            >
              <MaterialIcon icon="account_tree" />
              <span>Progress Tree</span>
            </button>
            <button 
              className={`help-manual-nav-btn ${activeTab === 'api' ? 'help-manual-nav-btn--active' : ''}`}
              onClick={() => setActiveTab('api')}
            >
              <MaterialIcon icon="code" />
              <span>API Reference</span>
            </button>
          </nav>

          {/* Tab Pages */}
          <main className="help-manual-content top-light-inset">
            
            {/* BASICS TAB */}
            {activeTab === 'basics' && (
              <div>
                <h2>🎮 Basics of Rural Automation</h2>
                <p>
                  Welcome to <strong>Rural Automation</strong>, a programming game where you automate farming using scripts to build the ultimate self-sufficient agricultural estate!
                </p>
                
                <div className="help-manual-grid">
                  <div className="help-manual-feature-box">
                    <h3>🌾 Crop Cycle</h3>
                    <p style={{ fontSize: '15px', margin: 0 }}>
                      Soil starts as <strong>Turf</strong>. Use the drone to <strong>Till</strong> it into soil, plant seeds, and wait for crops to grow. Harvest crops when they are <strong>Ripe</strong> to earn wheat and XP!
                    </p>
                  </div>
                  <div className="help-manual-feature-box">
                    <h3>🚀 Expanding Grid</h3>
                    <p style={{ fontSize: '15px', margin: 0 }}>
                      Spend harvested crops to buy <strong>Grid Expansions</strong> (e.g. 4x4, 5x5, etc.) in the side panel. Larger grid sizes yield more resources but require smarter pathing!
                    </p>
                  </div>
                </div>

                <div className="help-manual-section-title">
                  <MaterialIcon icon="mouse" /> Controlling the View
                </div>
                <p>
                  You can drag the farm grid to pan around. Use the zoom controls (<kbd className="help-manual-key">+</kbd> and <kbd className="help-manual-key">-</kbd>) at the bottom of the canvas or scroll your mouse wheel to zoom in and out.
                </p>

                <div className="help-manual-alert">
                  <strong>🎯 Core Goal:</strong> Harvest crops and mine ores to accumulate resources, unlock nodes in the <strong>Progress Tree</strong>, and scale your automation to infinity!
                </div>
              </div>
            )}

            {/* GRID TILES TAB */}
            {activeTab === 'tiles' && (
              <div>
                <h2>🌾 Grid Tile Dictionary</h2>
                <p>
                  Your farm is comprised of various tiles. The drone's <code>sensor</code> can scan these tile properties to decide the next programming step. Here are all the tiles in the game:
                </p>

                <div className="help-manual-tile-list">
                  
                  {/* Turf Tile */}
                  <div className="help-manual-tile-card">
                    <div className="help-manual-tile-img-container">
                      <img src="/assets/farm_tiles/grass.png" alt="Turf" className="help-manual-tile-img" />
                    </div>
                    <div className="help-manual-tile-info">
                      <div className="help-manual-tile-name">
                        <span>Turf</span>
                        <span className="help-manual-tile-type-tag">turf</span>
                      </div>
                      <p className="help-manual-tile-desc">
                        Raw, un-tilled grass. Plants cannot grow here. Run <code>drone.till();</code> to turn it into soil.
                      </p>
                    </div>
                  </div>

                  {/* Soil Tile */}
                  <div className="help-manual-tile-card">
                    <div className="help-manual-tile-img-container">
                      <img src="/assets/farm_tiles/freshly_tilled.png" alt="Soil" className="help-manual-tile-img" />
                    </div>
                    <div className="help-manual-tile-info">
                      <div className="help-manual-tile-name">
                        <span>Tilled Soil</span>
                        <span className="help-manual-tile-type-tag">soil</span>
                      </div>
                      <p className="help-manual-tile-desc">
                        Ground that is ready for planting. Use <code>drone.plant("wheat");</code> to plant seeds.
                      </p>
                    </div>
                  </div>

                  {/* Seedling / Growing Tile */}
                  <div className="help-manual-tile-card">
                    <div className="help-manual-tile-img-container">
                      <img src="/assets/farm_tiles/wheat_seeded.png" alt="Growing Crop" className="help-manual-tile-img" />
                    </div>
                    <div className="help-manual-tile-info">
                      <div className="help-manual-tile-name">
                        <span>Seeded & Growing</span>
                        <span className="help-manual-tile-type-tag">seedling / growing</span>
                      </div>
                      <p className="help-manual-tile-desc">
                        Seeds that have been planted. They grow dynamically over time. Checked by <code>sensor.isGrowing()</code>.
                      </p>
                    </div>
                  </div>

                  {/* Ripe Tile */}
                  <div className="help-manual-tile-card">
                    <div className="help-manual-tile-img-container">
                      <img src="/assets/farm_tiles/wheat_ready.png" alt="Ripe Crop" className="help-manual-tile-img" />
                    </div>
                    <div className="help-manual-tile-info">
                      <div className="help-manual-tile-name">
                        <span>Ripe Crop</span>
                        <span className="help-manual-tile-type-tag">ripe</span>
                      </div>
                      <p className="help-manual-tile-desc">
                        A mature crop that is ready to be harvested. Call <code>drone.harvest();</code> to gather resources and gain XP. Checked by <code>sensor.isRipe()</code>.
                      </p>
                    </div>
                  </div>

                  {/* Copper Ore */}
                  <div className="help-manual-tile-card">
                    <div className="help-manual-tile-img-container">
                      <img src="/assets/farm_tiles/copper_ore.png" alt="Copper Ore" className="help-manual-tile-img" />
                    </div>
                    <div className="help-manual-tile-info">
                      <div className="help-manual-tile-name">
                        <span>Copper Ore</span>
                        <span className="help-manual-tile-type-tag">copper_ore</span>
                      </div>
                      <p className="help-manual-tile-desc">
                        A block of raw copper. Use <code>drone.harvest();</code> to mine it. Checked by <code>sensor.isOre()</code>.
                      </p>
                    </div>
                  </div>

                  {/* Iron Ore */}
                  <div className="help-manual-tile-card">
                    <div className="help-manual-tile-img-container">
                      <img src="/assets/farm_tiles/iron_ore.png" alt="Iron Ore" className="help-manual-tile-img" />
                    </div>
                    <div className="help-manual-tile-info">
                      <div className="help-manual-tile-name">
                        <span>Iron Ore</span>
                        <span className="help-manual-tile-type-tag">iron_ore</span>
                      </div>
                      <p className="help-manual-tile-desc">
                        A block of raw iron. Collect with <code>drone.harvest();</code>. Checked by <code>sensor.isOre()</code>.
                      </p>
                    </div>
                  </div>

                  {/* Crystal Ore */}
                  <div className="help-manual-tile-card">
                    <div className="help-manual-tile-img-container">
                      <img src="/assets/farm_tiles/crystal_ore_soil.png" alt="Crystal Ore" className="help-manual-tile-img" />
                    </div>
                    <div className="help-manual-tile-info">
                      <div className="help-manual-tile-name">
                        <span>Crystal Ore</span>
                        <span className="help-manual-tile-type-tag">crystal_ore</span>
                      </div>
                      <p className="help-manual-tile-desc">
                        A crystal ore block. Mine it with <code>drone.harvest();</code> to get rare crystals. Checked by <code>sensor.isOre()</code>.
                      </p>
                    </div>
                  </div>

                  {/* Charging Pad */}
                  <div className="help-manual-tile-card">
                    <div className="help-manual-tile-img-container" style={{ position: 'relative' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: '2px solid #98c379',
                        display: 'flex',
                        alignItems: 'center',
                        justifycontent: 'center',
                        backgroundColor: '#1e1e2e',
                        color: '#98c379',
                        boxShadow: '0 0 8px #98c379'
                      }}>
                        <MaterialIcon icon="bolt" style={{ fontSize: '20px', display: 'block', margin: 'auto' }} />
                      </div>
                    </div>
                    <div className="help-manual-tile-info">
                      <div className="help-manual-tile-name">
                        <span>Charging Pad</span>
                        <span className="help-manual-tile-type-tag">charging_station</span>
                      </div>
                      <p className="help-manual-tile-desc">
                        Located permanently at coordinate <strong>(0,0)</strong>. Position your drone here and call <code>drone.charge();</code> to recharge the battery.
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ENERGY TAB */}
            {activeTab === 'energy' && (
              <div>
                <h2>⚡ Energy & Charging Mechanics</h2>
                <p>
                  Your drone operates on battery power. Every activity—including movement, tilling, planting, and harvesting—consumes battery life.
                </p>

                <div className="help-manual-grid">
                  <div className="help-manual-feature-box">
                    <h3>🔌 Energy Limits & Cost</h3>
                    <p style={{ fontSize: '15px', margin: 0 }}>
                      The drone has a 100% capacity limit. Moving cost is 1 energy per tile (based on Manhattan distance). Operations like tilling, mining, and harvesting cost 5 energy each.
                    </p>
                  </div>
                  <div className="help-manual-feature-box">
                    <h3>🏡 Recharging</h3>
                    <p style={{ fontSize: '15px', margin: 0 }}>
                      Coordinates <strong>(0,0)</strong> is home to a permanent metallic <strong>Charging Pad</strong>. Move there and call <code>drone.charge();</code> in your script to recharge.
                    </p>
                  </div>
                </div>

                <div className="help-manual-section-title">
                  <MaterialIcon icon="warning" /> Avoiding Stranded Drones
                </div>
                <p>
                  If the drone runs completely out of energy, execution halts and the engine throws an error. 
                  Always write a check in your script to inspect current energy level and return to charge:
                </p>
                <pre style={{ background: '#11111b', padding: '12px', borderRadius: '6px', fontFamily: 'JetBrains Mono', fontSize: '15px', color: '#f5c2e7' }}>
{`if (sensor.getEnergy() < 15) {
  Serial.println("🔋 Returning to base!");
  drone.moveTo(0, 0);
  drone.charge();
}`}
                </pre>

                <div className="help-manual-alert">
                  <strong>💡 Rescue Button:</strong> If your drone gets stuck/stranded during test runs, click the <strong>RECALL & CHARGE</strong> button in the editor toolbar to teleport the drone back to base at 100% energy.
                </div>
              </div>
            )}

            {/* TECH TREE TAB */}
            {activeTab === 'tech' && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <h2>🔬 Research & Progress Tree</h2>
                <div style={{ fontSize: '48px', margin: '20px 0' }}>
                  <span className="coming-soon__gear-spin" style={{ display: 'inline-block' }}>⚙️</span>
                </div>
                <div className="coming-soon-badge-manual">COMING SOON</div>
                <p>
                  We are compiling advanced logic processors and tuning the drone's energy transducers. Soon you will be able to spend **Experience Points (XP)** from harvesting crops and ores to unlock advanced coding capabilities (like loops, variables) and hardware efficiency upgrades!
                </p>
                <div className="help-manual-alert">
                  <strong>🔧 System Calibration:</strong> The Progress Tree station is currently calibrating. Stay tuned for future expansions!
                </div>
              </div>
            )}

            {/* API TAB */}
            {activeTab === 'api' && (
              <div>
                <h2>💻 Complete API Commands</h2>
                <p>
                  Write commands in the Monaco editor. Standard autocomplete will suggest parameters and return types as you type.
                </p>

                <div className="help-manual-code-list">
                  <div className="help-manual-code-item">
                    <code>drone.moveNext()</code>
                    <p className="help-manual-code-desc">Moves the drone one step forward in a grid pattern. Wraps around grid borders.</p>
                  </div>
                  <div className="help-manual-code-item">
                    <code>drone.moveTo(row, col)</code>
                    <p className="help-manual-code-desc">Directly flies the drone to grid coordinate (row, col). Consumes Manhattan-distance energy.</p>
                  </div>
                  <div className="help-manual-code-item">
                    <code>drone.till()</code>
                    <p className="help-manual-code-desc">Tills the ground under the drone, transforming Turf into soil.</p>
                  </div>
                  <div className="help-manual-code-item">
                    <code>drone.plant(cropName)</code>
                    <p className="help-manual-code-desc">Plants a seed of the specified type (e.g. <code>"wheat"</code>, <code>"carrot"</code>) on tilled soil.</p>
                  </div>
                  <div className="help-manual-code-item">
                    <code>drone.harvest()</code>
                    <p className="help-manual-code-desc">Harvests ripe crops or mines ore tiles under the drone, yielding resources.</p>
                  </div>
                  <div className="help-manual-code-item">
                    <code>drone.charge()</code>
                    <p className="help-manual-code-desc">Charges the drone. Must be positioned on the charging pad at (0,0).</p>
                  </div>
                  <div className="help-manual-code-item">
                    <code>delay(ms)</code>
                    <p className="help-manual-code-desc">Pauses the drone for a specified duration in milliseconds.</p>
                  </div>
                  <div className="help-manual-code-item">
                    <code>Serial.println(message)</code>
                    <p className="help-manual-code-desc">Prints a message (with a newline) to the drone console.</p>
                  </div>
                  <div className="help-manual-code-item">
                    <code>sensor.getEnergy()</code>
                    <p className="help-manual-code-desc">Synchronously returns the current drone energy (0-100).</p>
                  </div>
                  <div className="help-manual-code-item">
                    <code>sensor.isRipe() / sensor.isTurf() / sensor.isSoil()</code>
                    <p className="help-manual-code-desc">Query properties of the tile currently beneath the drone (returns true/false).</p>
                  </div>
                  <div className="help-manual-code-item">
                    <code>sensor.gridSize()</code>
                    <p className="help-manual-code-desc">Returns the dimension size of the current farm (e.g. 4 for 4x4 grid).</p>
                  </div>
                </div>
              </div>
            )}
            
          </main>
        </div>

      </div>
    </div>
  )
}
