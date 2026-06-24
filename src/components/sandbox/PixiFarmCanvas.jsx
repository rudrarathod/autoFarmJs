import { useEffect, useRef, useState } from 'react'
import { Application, Graphics, Text, TextStyle, Container, Sprite, Texture, TilingSprite, Assets } from 'pixi.js'
import './PixiFarmCanvas.css'
import { useGameStore } from '../../store/gameStore.js'
import { BASE_ASSETS, CROPS } from '../../config/assetsConfig.js'
import { getAssetUrl } from '../../engine/AssetLoader.js'

/**
 * Loads a texture from a URL, crops it to the specified rect, and filters out 
 * background colors (black or white) to create a clean transparent pixel art texture.
 */
async function loadCropAndMakeTransparent(url, cropRect, isWhiteBg = false) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = url
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = cropRect.width
      canvas.height = cropRect.height
      const ctx = canvas.getContext('2d')
      
      // Draw cropped portion from source image
      ctx.drawImage(
        img,
        cropRect.x, cropRect.y, cropRect.width, cropRect.height, // Source
        0, 0, cropRect.width, cropRect.height // Destination
      )
      
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imgData.data
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i+1]
        const b = data[i+2]
        
        if (isWhiteBg) {
          // Filter out bright white/light backgrounds
          if (r > 220 && g > 220 && b > 220) {
            data[i+3] = 0 // Transparent
          }
        } else {
          // Filter out dark/black backgrounds
          if (r < 30 && g < 30 && b < 30) {
            data[i+3] = 0 // Transparent
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
 * Loads a user-provided tile texture, draws it on a canvas, and filters out solid white 
 * backgrounds/borders (r,g,b > 240) to make the padding surrounding the tile transparent.
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
        
        // Convert white borders/backgrounds (r, g, b > 240) to transparent
        if (r > 240 && g > 240 && b > 240) {
          data[i+3] = 0 // alpha = 0
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
 * 3x3 Tile-based Sandbox rendering using PixiJS.
 * Integrates simple pixel art textures for turf, soil, crops, and the drone,
 * along with a tiled background using the turf asset.
 */
export default function PixiFarmCanvas({ interactive = true }) {
  const canvasRef = useRef(null)
  const appRef = useRef(null)
  const [isReady, setIsReady] = useState(false)
  const gridSize = useGameStore((state) => state.grid.length)

  useEffect(() => {
    let app = null
    let destroyed = false
    let unsubscribeStore = null
    let unsubscribeZoom = null
    let unsubscribeDrone = null
    let growInterval = null
    let resizeObserver = null
    let handlePanelResize = null

    async function initPixi() {
      const newApp = new Application()

      await newApp.init({
        resizeTo: canvasRef.current,
        backgroundColor: 0xa0e0ff, // Solid cozy sky-blue water color
        antialias: false,
        resolution: 1,
        autoDensity: true,
      })

      if (destroyed) {
        newApp.destroy(true, { children: true })
        return
      }

      app = newApp
      canvasRef.current.appendChild(app.canvas)
      app.canvas.style.imageRendering = 'pixelated'
      appRef.current = app

      // Load base tiles from configuration (using pre-cached blob URLs when available)
      const turfTexture = await loadUserTileAndMakeTransparent(getAssetUrl(BASE_ASSETS.turf.path))
      const soilTexture = await loadUserTileAndMakeTransparent(getAssetUrl(BASE_ASSETS.soil.path))
      const rockTexture = await loadUserTileAndMakeTransparent(getAssetUrl(BASE_ASSETS.rock.path))
      const copperOreTexture = await loadUserTileAndMakeTransparent(getAssetUrl(BASE_ASSETS.copper_ore.path))
      const ironOreTexture = await loadUserTileAndMakeTransparent(getAssetUrl(BASE_ASSETS.iron_ore.path))
      const crystalOreTexture = await loadUserTileAndMakeTransparent(getAssetUrl(BASE_ASSETS.crystal_ore.path))
      
      // Ensure pixel art remains sharp
      turfTexture.source.scaleMode = 'nearest'
      soilTexture.source.scaleMode = 'nearest'
      rockTexture.source.scaleMode = 'nearest'
      copperOreTexture.source.scaleMode = 'nearest'
      ironOreTexture.source.scaleMode = 'nearest'
      crystalOreTexture.source.scaleMode = 'nearest'

      const droneTexture = await loadCropAndMakeTransparent(
        getAssetUrl(BASE_ASSETS.drone.path), 
        BASE_ASSETS.drone.cropRect, 
        true
      )
      droneTexture.source.scaleMode = 'nearest'

      const textures = {
        turf: turfTexture,
        soil: soilTexture,
        rock: rockTexture,
        copper_ore: copperOreTexture,
        iron_ore: ironOreTexture,
        crystal_ore: crystalOreTexture,
        drone: droneTexture,
      }

      // Load all crop growth stages dynamically from configuration
      for (const [cropKey, cropData] of Object.entries(CROPS)) {
        const seedlingPath = getAssetUrl(cropData.stages.seedling)
        const growingPath = getAssetUrl(cropData.stages.growing)
        const ripePath = getAssetUrl(cropData.stages.ripe)

        const seeded = await loadUserTileAndMakeTransparent(seedlingPath)
        const growing = await loadUserTileAndMakeTransparent(growingPath)
        const ready = await loadUserTileAndMakeTransparent(ripePath)

        seeded.source.scaleMode = 'nearest'
        growing.source.scaleMode = 'nearest'
        ready.source.scaleMode = 'nearest'

        textures[`${cropKey}_seedling`] = seeded
        textures[`${cropKey}_growing`] = growing
        textures[`${cropKey}_ripe`] = ready
      }

      // ---- Draw the tile sandbox ----
      const initialGrid = useGameStore.getState().grid
      const sandbox = drawTileSandbox(app, textures, initialGrid, interactive)

      // Initialize zoom scale from store
      const initialZoom = useGameStore.getState().zoom || 1.0
      if (sandbox.viewportContainer) {
        sandbox.viewportContainer.scale.set(initialZoom)
      }

      // Initialize visible-area center alignment based on panel dimensions
      let lastPanelWidth = (() => {
        const saved = localStorage.getItem('drone-logic-panel-width')
        return saved ? parseInt(saved, 10) : 520
      })()
      let lastPanelHeight = (() => {
        const saved = localStorage.getItem('drone-logic-panel-height')
        return saved ? parseInt(saved, 10) : Math.floor(window.innerHeight * 0.5)
      })()

      if (sandbox.viewportContainer) {
        if (window.innerWidth >= 1024) {
          sandbox.viewportContainer.x = app.screen.width / 2 - lastPanelWidth / 2
          sandbox.viewportContainer.y = app.screen.height / 2
        } else {
          sandbox.viewportContainer.x = app.screen.width / 2
          sandbox.viewportContainer.y = app.screen.height / 2 - lastPanelHeight / 2
        }
      }
      
      // Subscribe to store state changes to update textures dynamically
      unsubscribeStore = useGameStore.subscribe((state) => {
        sandbox.update(state.grid)
      })

      // Subscribe to zoom level changes dynamically
      unsubscribeZoom = useGameStore.subscribe((state) => {
        if (sandbox.viewportContainer) {
          sandbox.viewportContainer.scale.set(state.zoom || 1.0)
          if (state.zoom === 1.0 && app) {
            if (window.innerWidth >= 1024) {
              sandbox.viewportContainer.x = app.screen.width / 2 - lastPanelWidth / 2
              sandbox.viewportContainer.y = app.screen.height / 2
            } else {
              sandbox.viewportContainer.x = app.screen.width / 2
              sandbox.viewportContainer.y = app.screen.height / 2 - lastPanelHeight / 2
            }
          }
        }
      })

      // Subscribe to drone position and message changes to animate the drone and update message bubble
      let prevDroneRow = useGameStore.getState().droneRow
      let prevDroneCol = useGameStore.getState().droneCol
      let prevDroneMessage = useGameStore.getState().droneMessage || 'Idle'
      
      sandbox.moveDroneTo(prevDroneRow, prevDroneCol)
      sandbox.updateDroneMessage(prevDroneMessage)

      unsubscribeDrone = useGameStore.subscribe((state) => {
        if (state.droneRow !== prevDroneRow || state.droneCol !== prevDroneCol) {
          prevDroneRow = state.droneRow
          prevDroneCol = state.droneCol
          sandbox.moveDroneTo(state.droneRow, state.droneCol)
        }
        if (state.droneMessage !== prevDroneMessage) {
          prevDroneMessage = state.droneMessage || 'Idle'
          sandbox.updateDroneMessage(prevDroneMessage)
        }
      })

      // Growth cycle tick (every 5 seconds)
      growInterval = setInterval(() => {
        useGameStore.getState().growCrops()
      }, 5000)

      // Set up ResizeObserver to keep viewportContainer centered in visible area when window/container resizes
      let lastWidth = canvasRef.current ? canvasRef.current.clientWidth : 0
      let lastHeight = canvasRef.current ? canvasRef.current.clientHeight : 0

      resizeObserver = new ResizeObserver(() => {
        if (canvasRef.current && sandbox.viewportContainer) {
          const currentWidth = canvasRef.current.clientWidth
          const currentHeight = canvasRef.current.clientHeight
          const deltaX = currentWidth - lastWidth
          const deltaY = currentHeight - lastHeight

          sandbox.viewportContainer.x += deltaX / 2
          sandbox.viewportContainer.y += deltaY / 2

          lastWidth = currentWidth
          lastHeight = currentHeight
        }
      })
      if (canvasRef.current) {
        resizeObserver.observe(canvasRef.current)
      }

      // Handle custom panel resize event to dynamically shift viewport center
      handlePanelResize = (e) => {
        if (sandbox.viewportContainer) {
          const { width: newPanelWidth, height: newPanelHeight } = e.detail
          
          if (window.innerWidth >= 1024) {
            const deltaPanelWidth = newPanelWidth - lastPanelWidth
            sandbox.viewportContainer.x -= deltaPanelWidth / 2
          } else {
            const deltaPanelHeight = newPanelHeight - lastPanelHeight
            sandbox.viewportContainer.y -= deltaPanelHeight / 2
          }
          
          lastPanelWidth = newPanelWidth
          lastPanelHeight = newPanelHeight
        }
      }
      window.addEventListener('drone-panel-resize', handlePanelResize)

      setIsReady(true)
    }

    initPixi()

    return () => {
      destroyed = true
      if (unsubscribeStore) unsubscribeStore()
      if (unsubscribeZoom) unsubscribeZoom()
      if (unsubscribeDrone) unsubscribeDrone()
      if (growInterval) clearInterval(growInterval)
      if (resizeObserver) resizeObserver.disconnect()
      if (handlePanelResize) {
        window.removeEventListener('drone-panel-resize', handlePanelResize)
      }
      if (app) {
        app.destroy(true, { children: true })
      }
    }
  }, [gridSize, interactive])

  return (
    <div className="pixi-farm-canvas bg-grid-pattern" ref={canvasRef}>
      {!isReady && (
        <div className="pixi-farm-canvas__loading">
          <span className="font-label-tech">Loading sandbox...</span>
        </div>
      )}
    </div>
  )
}

/**
 * Renders the dynamic grid and setups interactive drone movement using custom textures.
 */
function drawTileSandbox(app, textures, initialGrid, interactive = true) {
  const { width, height } = app.screen
  const tileSize = 144
  const gridSize = initialGrid.length

  const gridStartX = Math.floor(width / 2 - (tileSize * gridSize) / 2)
  const gridStartY = Math.floor(height / 2 - (tileSize * gridSize) / 2)

  // Target coordinates for drone
  let targetDroneX = width / 2
  let targetDroneY = height / 2 - 20 * (tileSize / 96)

  // Store references to dynamically update textures/colors on state changes
  const tileSprites = Array.from({ length: gridSize }, () => Array(gridSize).fill(null))
  const tileBaseSprites = Array.from({ length: gridSize }, () => Array(gridSize).fill(null))
  const tileFallbacks = Array.from({ length: gridSize }, () => Array(gridSize).fill(null))
  const progressTexts = Array.from({ length: gridSize }, () => Array(gridSize).fill(null))
  const tileCoords = Array.from({ length: gridSize }, () => Array(gridSize).fill(null))

  // Create viewport container to hold all visual elements for centralized zoom scaling
  const viewportContainer = new Container()
  viewportContainer.x = width / 2
  viewportContainer.y = height / 2
  viewportContainer.pivot.set(width / 2, height / 2)
  app.stage.addChild(viewportContainer)

  // Draw a solid dark background underlay
  const gridUnderlay = new Graphics()
  gridUnderlay.rect(gridStartX, gridStartY, tileSize * gridSize, tileSize * gridSize)
  gridUnderlay.fill({ color: 0x3c2a21 })
  viewportContainer.addChild(gridUnderlay)

  // Draw a thin, elegant pixel-art stone border around the play area
  const borderContainer = new Container()
  const borderThickness = 16
  const gw = tileSize * gridSize
  const gh = tileSize * gridSize

  const createBorderStrip = (x, y, w, h) => {
    if (textures.rock && textures.rock !== Texture.EMPTY) {
      const ts = new TilingSprite({
        texture: textures.rock,
        width: w,
        height: h
      })
      ts.x = x
      ts.y = y
      ts.tileScale.set(0.2)
      return ts
    } else {
      const fallback = new Graphics()
      fallback.rect(x, y, w, h)
      fallback.fill({ color: 0x4e342e })
      return fallback
    }
  }

  // Top border strip (including corners)
  borderContainer.addChild(createBorderStrip(
    gridStartX - borderThickness,
    gridStartY - borderThickness,
    gw + borderThickness * 2,
    borderThickness
  ))

  // Bottom border strip (including corners)
  borderContainer.addChild(createBorderStrip(
    gridStartX - borderThickness,
    gridStartY + gh,
    gw + borderThickness * 2,
    borderThickness
  ))

  // Left border strip
  borderContainer.addChild(createBorderStrip(
    gridStartX - borderThickness,
    gridStartY,
    borderThickness,
    gh
  ))

  // Right border strip
  borderContainer.addChild(createBorderStrip(
    gridStartX + gw,
    gridStartY,
    borderThickness,
    gh
  ))

  viewportContainer.addChild(borderContainer)

  // Helper to determine texture for soil types
  const getSoilTexture = (tType) => {
    if (tType === 'soil') return textures.soil
    if (tType === 'copper_ore') return textures.copper_ore
    if (tType === 'iron_ore') return textures.iron_ore
    if (tType === 'crystal_ore') return textures.crystal_ore
    if (tType === 'turf') return textures.turf
    return null
  }

  // Render Tiles
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const config = initialGrid[r][c]
      const tileX = gridStartX + c * tileSize
      const tileY = gridStartY + r * tileSize

      const tileContainer = new Container()
      tileContainer.x = tileX
      tileContainer.y = tileY
      
      if (interactive) {
        tileContainer.eventMode = 'static'
        tileContainer.cursor = 'pointer'

        tileContainer.on('pointerdown', (event) => {
          const startX = event.global.x
          const startY = event.global.y

          const onPointerUp = (e) => {
            const endX = e.global.x
            const endY = e.global.y
            const dist = Math.hypot(endX - startX, endY - startY)

            // Only trigger action if the pointer was clicked without significant movement (threshold < 8px)
            if (dist < 8) {
              const currentGrid = useGameStore.getState().grid
              const currentTile = currentGrid[r]?.[c]
              if (currentTile) {
                if (currentTile.type === 'turf') {
                  useGameStore.getState().tillTile(r, c)
                } else if (currentTile.type === 'soil') {
                  useGameStore.getState().plantCrop(r, c)
                } else if (currentTile.type === 'ripe') {
                  useGameStore.getState().harvestCrop(r, c)
                } else if (['copper_ore', 'iron_ore', 'crystal_ore'].includes(currentTile.type)) {
                  useGameStore.getState().harvestOre(r, c)
                }
              }
            }

            tileContainer.off('pointerup', onPointerUp)
            tileContainer.off('pointerupoutside', onPointerUp)
          }

          tileContainer.on('pointerup', onPointerUp)
          tileContainer.on('pointerupoutside', onPointerUp)
        })
      }

      // Draw base tile sprite first (turf, soil, or ore soil)
      const baseType = config.baseType || (config.type === 'turf' ? 'turf' : 'soil')
      const baseTex = getSoilTexture(baseType)
      let baseSprite = null

      if (baseType === 'charging_station') {
        const chargingPad = drawChargingStationGraphics(tileSize)
        tileContainer.addChild(chargingPad)
      } else if (baseTex && baseTex !== Texture.EMPTY) {
        baseSprite = new Sprite(baseTex)
        baseSprite.width = tileSize + 2
        baseSprite.height = tileSize + 2
        baseSprite.x = -1
        baseSprite.y = -1
        tileContainer.addChild(baseSprite)
        tileBaseSprites[r][c] = baseSprite
      }

      // Draw crop overlay
      const tileSprite = new Sprite(Texture.EMPTY)
      tileSprite.width = tileSize + 2
      tileSprite.height = tileSize + 2
      tileSprite.x = -1
      tileSprite.y = -1
      tileSprite.visible = false

      if (config.type !== 'turf' && config.type !== 'soil' && config.type !== 'iron_ore' && config.type !== 'crystal_ore') {
        const crop = config.crop || 'wheat'
        const textureKey = `${crop}_${config.type}`
        const tex = textures[textureKey]
        if (tex && tex !== Texture.EMPTY) {
          tileSprite.texture = tex
          tileSprite.visible = true
        }
      }
      tileContainer.addChild(tileSprite)
      tileSprites[r][c] = tileSprite

      // Fallback graphics if sprites are empty
      if (!baseSprite && !tileSprite) {
        const baseGraphics = new Graphics()
        baseGraphics.rect(0, 0, tileSize, tileSize)
        let fallbackColor = 0x8d6e63
        if (config.type === 'turf') fallbackColor = 0x8bc34a
        else if (config.type === 'seedling') fallbackColor = 0xa78bfa
        else if (config.type === 'growing') fallbackColor = 0x4caf50
        else if (config.type === 'ripe') fallbackColor = 0xffeb3b
        baseGraphics.fill({ color: fallbackColor })
        tileContainer.addChild(baseGraphics)
        tileFallbacks[r][c] = baseGraphics
      }

      // Small text overlay for growth progress
      let pText = null
      if (interactive) {
        const textStyle = new TextStyle({
          fontFamily: 'Pixel Operator',
          fontSize: 15,
          fill: 0xffffff,
          fontWeight: 'bold',
          stroke: { color: 0x000000, width: 3 }
        })
        pText = new Text({ text: '', style: textStyle })
        pText.anchor.set(0.5)
        pText.x = tileSize / 2
        pText.y = tileSize / 2
        pText.visible = false
        tileContainer.addChild(pText)
        progressTexts[r][c] = pText
      }

      // Subtle grid coordinate text label
      const gridOverlayEnabled = useGameStore.getState().settings?.gridOverlay !== false
      const coordText = new Text({
        text: `(${r},${c})`,
        style: new TextStyle({
          fontFamily: 'Pixel Operator Mono',
          fontSize: 14,
          fill: 0x3c2a21,
          fontWeight: '500',
        })
      })
      coordText.alpha = 0.25
      coordText.x = 8
      coordText.y = 8
      coordText.visible = gridOverlayEnabled
      tileContainer.addChild(coordText)
      tileCoords[r][c] = coordText

      tileContainer.on('pointerover', () => {
        targetDroneX = tileX + tileSize / 2
        targetDroneY = tileY + tileSize / 2

        const currentGrid = useGameStore.getState().grid
        const currentTile = currentGrid[r]?.[c]
        if (currentTile && (currentTile.type === 'seedling' || currentTile.type === 'growing') && pText) {
          const prog = currentTile.progress !== undefined ? currentTile.progress : (currentTile.type === 'growing' ? 50 : 0)
          pText.text = `${Math.min(100, prog)}%`
          pText.visible = true
        }
      })

      tileContainer.on('pointerout', () => {
        if (pText) pText.visible = false
      })

      viewportContainer.addChild(tileContainer)
    }
  }

  // ---- Drone ----
  const droneContainer = new Container()
  droneContainer.eventMode = 'none'
  droneContainer.interactiveChildren = false
  droneContainer.x = width / 2
  droneContainer.y = height / 2 - 20 * (tileSize / 96)

  // Drop shadow — positioned directly under drone center so the drone
  // sprite overlaps it, creating a top-down hovering illusion.
  // Only the bottom edge of the shadow peeks out beneath the drone body.
  const droneScale = tileSize / 96
  const droneSpriteSize = 82 * droneScale  // ~85% of tile size
  const shadow = new Graphics()
  shadow.ellipse(0, droneSpriteSize * 0.32, droneSpriteSize * 0.55, droneSpriteSize * 0.32)
  shadow.fill({ color: 0x000000, alpha: 0.5 })
  droneContainer.addChild(shadow)

  // Drone Sprite — sized to nearly fill one tile
  let droneSprite = null
  if (textures.drone !== Texture.EMPTY) {
    droneSprite = new Sprite(textures.drone)
    droneSprite.width = droneSpriteSize
    droneSprite.height = droneSpriteSize
    droneSprite.anchor.set(0.5)
    droneContainer.addChild(droneSprite)
  } else {
    const droneBody = new Graphics()
    droneBody.rect(-12, -8, 24, 16)
    droneBody.fill({ color: 0x37474f })
    droneContainer.addChild(droneBody)
  }

  // Label (repositioned above larger drone)
  const labelOffsetY = -(droneSpriteSize / 2) - 10 * droneScale
  const labelBg = new Graphics()
  labelBg.roundRect(-45, labelOffsetY - 4, 90, 24, 4)
  labelBg.fill({ color: 0xf4faff })
  labelBg.setStrokeStyle({ width: 2, color: 0x3c2a21 })
  labelBg.stroke()
  droneContainer.addChild(labelBg)

  const labelStyle = new TextStyle({
    fontFamily: 'Pixel Operator',
    fontSize: 15,
    fill: 0x006e1c,
    fontWeight: '500',
  })
  const labelText = new Text({ text: 'Idle', style: labelStyle })
  labelText.x = -38
  labelText.y = labelOffsetY - 2
  droneContainer.addChild(labelText)

  viewportContainer.addChild(droneContainer)

  // Smooth movement and hover animations
  let time = 0
  app.ticker.add((ticker) => {
    time += ticker.deltaTime * 0.04

    droneContainer.x += (targetDroneX - droneContainer.x) * 0.1
    droneContainer.y += (targetDroneY - 20 * (tileSize / 96) - droneContainer.y) * 0.1

    droneContainer.y += Math.sin(time) * 0.5

    if (droneSprite) {
      const dx = targetDroneX - droneContainer.x
      droneSprite.rotation = dx * 0.005
    }
  })

  // Set up click-and-drag camera panning on interactive sandbox viewports
  if (interactive) {
    app.stage.eventMode = 'static'
    app.stage.hitArea = app.screen

    let isDragging = false
    let dragStart = { x: 0, y: 0 }
    let containerStart = { x: 0, y: 0 }

    app.stage.on('pointerdown', (e) => {
      isDragging = true
      dragStart = { x: e.global.x, y: e.global.y }
      containerStart = { x: viewportContainer.x, y: viewportContainer.y }
    })

    app.stage.on('pointermove', (e) => {
      if (isDragging) {
        const dx = e.global.x - dragStart.x
        const dy = e.global.y - dragStart.y
        viewportContainer.x = containerStart.x + dx
        viewportContainer.y = containerStart.y + dy
      }
    })

    const stopDrag = () => {
      isDragging = false
    }

    app.stage.on('pointerup', stopDrag)
    app.stage.on('pointerupoutside', stopDrag)
  }

  return {
    viewportContainer,
    moveDroneTo(row, col) {
      const tileX = gridStartX + col * tileSize + tileSize / 2
      const tileY = gridStartY + row * tileSize + tileSize / 2
      targetDroneX = tileX
      targetDroneY = tileY
    },
    updateDroneMessage(msg) {
      labelText.text = msg
      labelText.x = -labelText.width / 2

      const paddingX = 8
      const paddingY = 2
      const bgWidth = Math.max(60, labelText.width + paddingX * 2)
      const bgHeight = 18

      labelBg.clear()
      labelBg.roundRect(-bgWidth / 2, labelOffsetY - paddingY, bgWidth, bgHeight, 4)
      labelBg.fill({ color: 0xf4faff })
      labelBg.setStrokeStyle({ width: 2, color: 0x3c2a21 })
      labelBg.stroke()
    },
    update(grid) {
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          const tile = grid[r]?.[c]
          if (!tile) continue

          const baseSprite = tileBaseSprites[r][c]
          const sprite = tileSprites[r][c]
          const fallback = tileFallbacks[r][c]

          // 1. Update the base texture (turf, soil, iron_ore, crystal_ore)
          if (baseSprite) {
            const currentBase = tile.baseType || (tile.type === 'turf' ? 'turf' : 'soil')
            const tex = getSoilTexture(currentBase)
            if (tex) baseSprite.texture = tex
          }

          // 2. Update the crop overlay texture
          if (sprite) {
            if (['seedling', 'growing', 'ripe'].includes(tile.type)) {
              const crop = tile.crop || 'wheat'
              const textureKey = `${crop}_${tile.type}`
              const tex = textures[textureKey]
              if (tex) {
                sprite.texture = tex
                sprite.visible = true
              }
            } else {
              sprite.visible = false
            }
          }

          // 3. Fallback coloring
          if (fallback) {
            let fallbackColor = 0x8d6e63
            if (tile.type === 'turf') fallbackColor = 0x8bc34a
            else if (tile.type === 'seedling') fallbackColor = 0xa78bfa
            else if (tile.type === 'growing') fallbackColor = 0x4caf50
            else if (tile.type === 'ripe') fallbackColor = 0xffeb3b
            fallback.clear()
            fallback.rect(0, 0, tileSize, tileSize)
            fallback.fill({ color: fallbackColor })
          }

          // 4. Update the hover text percentage
          const pText = progressTexts[r][c]
          if (pText && pText.visible) {
            if (tile.type === 'seedling' || tile.type === 'growing') {
              const prog = tile.progress !== undefined ? tile.progress : (tile.type === 'growing' ? 50 : 0)
              pText.text = `${Math.min(100, prog)}%`
            } else {
              pText.visible = false
            }
          }

          // 5. Update coordinate label visibility
          const coordText = tileCoords[r]?.[c]
          if (coordText) {
            const gridOverlay = useGameStore.getState().settings?.gridOverlay !== false
            coordText.visible = gridOverlay
          }
        }
      }
    }
  }
}

function drawChargingStationGraphics(tileSize) {
  const g = new Graphics()
  
  // 1. Dark steel background
  g.rect(0, 0, tileSize, tileSize)
  g.fill({ color: 0x2b2d35 })
  
  // 2. Inner panel border
  g.rect(6, 6, tileSize - 12, tileSize - 12)
  g.fill({ color: 0x3a3d46 })
  g.stroke({ width: 2, color: 0x4f525d })
  
  // 3. Caution corners (yellow/black warning lines)
  const drawCautionCorner = (x, y) => {
    g.rect(x, y, 16, 16)
    g.fill({ color: 0xd19a66 }) // amber warning color
  }
  drawCautionCorner(8, 8)
  drawCautionCorner(tileSize - 24, 8)
  drawCautionCorner(8, tileSize - 24)
  drawCautionCorner(tileSize - 24, tileSize - 24)
  
  // 4. Glowing green power ring
  g.circle(tileSize / 2, tileSize / 2, 36)
  g.stroke({ width: 3, color: 0x00e676 }) // Green neon border
  g.fill({ color: 0x1e3d2f, alpha: 0.8 }) // Green dark background
  
  // 5. Electric bolt icon (lightning shape)
  const cx = tileSize / 2
  const cy = tileSize / 2
  g.moveTo(cx + 2, cy - 18)
  g.lineTo(cx - 10, cy + 2)
  g.lineTo(cx, cy + 2)
  g.lineTo(cx - 2, cy + 18)
  g.lineTo(cx + 10, cy - 2)
  g.lineTo(cx, cy - 2)
  g.closePath()
  g.fill({ color: 0x00e676 })
  
  return g
}


