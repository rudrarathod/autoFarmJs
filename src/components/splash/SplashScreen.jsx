import { useEffect, useState, useRef } from 'react'
import { Application, Container, Sprite, Graphics, Texture } from 'pixi.js'
import { preloadAllAssets } from '../../engine/AssetLoader.js'
import { ASSET_VERSION, BASE_ASSETS, CROPS } from '../../config/assetsConfig.js'
import './SplashScreen.css'

/**
 * Random game tips shown while loading.
 */
const LOADING_TIPS = [
  "💡 Use sensor.isRipe() to check if a crop is ready to harvest",
  "⚡ Always return to (0,0) before your battery runs out!",
  "🌾 Try planting different crops — watermelons give 300 XP!",
  "🔧 Use for loops to automate scanning the entire grid",
  "🤖 Call drone.charge() at the charging pad to recharge",
  "📖 Press the ? button to open the Operator Manual anytime",
  "🗺️ Expand your grid by spending harvested crops",
  "🎯 Write smart scripts to earn XP and unlock upgrades",
  "🌱 Crops grow in real-time — plant seeds and wait for them to ripen",
  "⛏️ Mine copper, iron, and crystal ores for special resources",
]

/** Minimum splash duration in ms (prevents jarring flash on fast loads) */
const MIN_SPLASH_MS = 1500

/**
 * Loads a texture from a URL, crops it, and keys out black or white backgrounds.
 */
async function loadCropAndMakeTransparent(url, cropRect, isWhiteBg = false) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = url
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = cropRect ? cropRect.width : img.width
      canvas.height = cropRect ? cropRect.height : img.height
      const ctx = canvas.getContext('2d')
      
      const sx = cropRect ? cropRect.x : 0
      const sy = cropRect ? cropRect.y : 0
      const sw = canvas.width
      const sh = canvas.height
      
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)
      
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imgData.data
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        
        if (isWhiteBg) {
          if (r > 220 && g > 220 && b > 220) {
            data[i + 3] = 0 // Transparent
          }
        } else {
          if (r < 30 && g < 30 && b < 30) {
            data[i + 3] = 0 // Transparent
          }
        }
      }
      ctx.putImageData(imgData, 0, 0)
      const texture = Texture.from(canvas)
      resolve(texture)
    }
    img.onerror = () => {
      resolve(Texture.EMPTY)
    }
  })
}

/**
 * Loads a texture from a URL and keys out white background.
 */
async function loadUserTileAndMakeTransparent(url) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = url
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imgData.data
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i+1]
        const b = data[i+2]
        if (r > 240 && g > 240 && b > 240) {
          data[i+3] = 0 // transparent
        }
      }
      ctx.putImageData(imgData, 0, 0)
      const texture = Texture.from(canvas)
      resolve(texture)
    }
    img.onerror = () => {
      resolve(Texture.EMPTY)
    }
  })
}

export default function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [total, setTotal] = useState(1)
  const [message, setMessage] = useState('Initializing...')
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * LOADING_TIPS.length))
  const [fadeOut, setFadeOut] = useState(false)
  const [fromCache, setFromCache] = useState(false)

  const canvasContainerRef = useRef(null)
  const startTime = useRef(Date.now())

  // Rotate tips every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % LOADING_TIPS.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  // Asset Loading Preload
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const cached = await preloadAllAssets((loaded, tot, msg) => {
          if (!cancelled) {
            setProgress(loaded)
            setTotal(tot)
            setMessage(msg)
          }
        })

        if (cancelled) return
        setFromCache(cached)

        const elapsed = Date.now() - startTime.current
        const remaining = Math.max(0, MIN_SPLASH_MS - elapsed)
        await new Promise((r) => setTimeout(r, remaining))

        if (cancelled) return

        setFadeOut(true)
        setTimeout(() => {
          if (!cancelled) onComplete()
        }, 650)
      } catch (e) {
        console.error('Asset loading failed:', e)
        if (!cancelled) onComplete()
      }
    }

    load()
    return () => { cancelled = true }
  }, [onComplete])

  // --- Full Screen Procedural Farm Background Sim ---
  useEffect(() => {
    let app = null
    let destroyed = false

    async function initPixiSim() {
      try {
        if (destroyed || !canvasContainerRef.current) return

        app = new Application()
        await app.init({
          resizeTo: window,
          backgroundColor: 0x8cd2ff, // sky-blue river water color
          antialias: false,
          resolution: 1,
          autoDensity: true,
        })

        if (destroyed) {
          try {
            app.destroy(true, { children: true })
          } catch (e) {
            console.warn('Destroy error in check:', e)
          }
          return
        }

        canvasContainerRef.current.appendChild(app.canvas)
        app.canvas.style.imageRendering = 'pixelated'

        // Load all required pixel art textures
        const turfTexture = await loadUserTileAndMakeTransparent(BASE_ASSETS.turf.path)
        const soilTexture = await loadUserTileAndMakeTransparent(BASE_ASSETS.soil.path)
        const seedlingTexture = await loadUserTileAndMakeTransparent(CROPS.wheat.stages.seedling)
        const growingTexture = await loadUserTileAndMakeTransparent(CROPS.wheat.stages.growing)
        const ripeTexture = await loadUserTileAndMakeTransparent(CROPS.wheat.stages.ripe)
        const rockTexture = await loadUserTileAndMakeTransparent(BASE_ASSETS.rock.path)
        const copperTexture = await loadUserTileAndMakeTransparent(BASE_ASSETS.copper_ore.path)
        const ironTexture = await loadUserTileAndMakeTransparent(BASE_ASSETS.iron_ore.path)
        const crystalTexture = await loadUserTileAndMakeTransparent(BASE_ASSETS.crystal_ore.path)
        
        const droneTexture = await loadCropAndMakeTransparent(
          BASE_ASSETS.drone.path,
          BASE_ASSETS.drone.cropRect,
          true
        )

        turfTexture.source.scaleMode = 'nearest'
        soilTexture.source.scaleMode = 'nearest'
        seedlingTexture.source.scaleMode = 'nearest'
        growingTexture.source.scaleMode = 'nearest'
        ripeTexture.source.scaleMode = 'nearest'
        rockTexture.source.scaleMode = 'nearest'
        copperTexture.source.scaleMode = 'nearest'
        ironTexture.source.scaleMode = 'nearest'
        crystalTexture.source.scaleMode = 'nearest'
        droneTexture.source.scaleMode = 'nearest'

        const tileSize = 64
        const cols = Math.ceil(window.innerWidth / tileSize) + 2
        const rows = Math.ceil(window.innerHeight / tileSize) + 2

        const gridContainer = new Container()
        app.stage.addChild(gridContainer)

        // Procedural Landscape Generation (Grass lands, tilled plots, river channels, ores)
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            // 1. Create a diagonal river channel flowing through
            const riverCenter = Math.floor(cols / 2) + Math.sin(r * 0.4) * 3
            if (c >= riverCenter - 1 && c <= riverCenter + 1) {
              // Leave as sky-blue water background
              continue
            }

            // 2. Otherwise draw some land tile
            let tex = turfTexture // Default grass

            // Generate structured patches of soil & crops
            const noiseVal = Math.sin(r * 0.5) * Math.cos(c * 0.5)
            
            if (noiseVal > 0.35) {
              tex = ripeTexture
            } else if (noiseVal > 0.15) {
              tex = soilTexture
            } else if (noiseVal < -0.45) {
              // Rock or Ore blocks
              const randOre = Math.random()
              if (randOre < 0.15) tex = copperTexture
              else if (randOre < 0.3) tex = ironTexture
              else if (randOre < 0.45) tex = crystalTexture
              else tex = rockTexture
            } else if (noiseVal < -0.25) {
              tex = growingTexture
            } else if (Math.random() < 0.08) {
              tex = seedlingTexture
            }

            const sprite = new Sprite(tex)
            sprite.x = c * tileSize
            sprite.y = r * tileSize
            sprite.width = tileSize
            sprite.height = tileSize
            gridContainer.addChild(sprite)
          }
        }

        // Spawn multiple automated drones hovering on the map
        const droneCount = Math.max(2, Math.min(5, Math.floor(cols / 6)))
        const drones = []

        for (let i = 0; i < droneCount; i++) {
          // Shadow
          const shadow = new Graphics()
          shadow.ellipse(0, 0, 24, 7)
          shadow.fill({ color: 0x000000, alpha: 0.4 })
          app.stage.addChild(shadow)

          // Drone
          const drone = new Sprite(droneTexture)
          drone.anchor.set(0.5)
          drone.width = tileSize * 0.85
          drone.height = tileSize * 0.85
          app.stage.addChild(drone)

          // Random start positions away from river center
          const targetCol = Math.floor(Math.random() * (cols - 4)) + 2
          const targetRow = Math.floor(Math.random() * (rows - 4)) + 2
          const startX = targetCol * tileSize + tileSize / 2
          const startY = targetRow * tileSize + tileSize / 2

          drone.x = startX
          drone.y = startY

          drones.push({
            sprite: drone,
            shadow: shadow,
            baseX: startX,
            baseY: startY,
            offsetSpeed: 0.8 + Math.random() * 0.5,
            bobOffset: Math.random() * Math.PI * 2
          })
        }

        // Smooth bobbing animations in the ticker
        app.ticker.add((ticker) => {
          const time = ticker.lastTime / 180

          drones.forEach((d) => {
            // Smooth bobbing effect
            const bobVal = Math.sin(time * d.offsetSpeed + d.bobOffset)
            d.sprite.x = d.baseX + Math.cos(time * 0.3 * d.offsetSpeed) * 8
            d.sprite.y = d.baseY + bobVal * 10
            
            // Align shadow directly below the drone
            d.shadow.x = d.sprite.x
            d.shadow.y = d.baseY + 12
            d.shadow.scale.set(0.85 + bobVal * 0.05)
          })
        })

      } catch (err) {
        console.error('Pixi procedural simulation init error:', err)
      }
    }

    initPixiSim()

    return () => {
      destroyed = true
      if (app) {
        try {
          app.destroy(true, { children: true })
        } catch (e) {
          console.warn('Safely caught Pixi destroy error in cleanup:', e)
        }
      }
    }
  }, [])

  const percent = total > 0 ? Math.round((progress / total) * 100) : 0

  return (
    <div className={`splash-screen ${fadeOut ? 'splash-screen--fade-out' : ''}`}>
      {/* PixiJS Simulation Canvas Holder */}
      <div className="splash-screen__canvas-container" ref={canvasContainerRef} />

      {/* Cinematic Overlay containing Titles & Loading Bar */}
      <div className="splash-screen__overlay">
        
        {/* Title Container (Centered) */}
        <div className="splash-screen__center">
          <h1 className="splash-screen__title-large">Rural Automation</h1>
          <p className="splash-screen__subtitle-large">SOLAR PUNK AUTOMATION SIMULATION</p>
        </div>

        {/* Bottom Panel (Progress & Tips) */}
        <div className="splash-screen__bottom">
          {/* Status Label above progress bar */}
          <div className="splash-screen__status-msg">
            {fromCache && progress === total ? 'READY.' : message.toUpperCase()}
          </div>

          {/* Progress Bar (Retro White Solid Frame) */}
          <div className="splash-screen__bar-outer">
            <div
              className="splash-screen__bar-inner"
              style={{ width: `${percent}%` }}
            />
          </div>

          {/* Tips Section */}
          <div className="splash-screen__tip-text-large">
            {LOADING_TIPS[tipIndex]}
          </div>
        </div>

        {/* Retro Badge (Bottom Right) */}
        <div className="splash-screen__version-badge">
          v{ASSET_VERSION} - SOLAR PUNK EDITION
        </div>

      </div>
    </div>
  )
}
