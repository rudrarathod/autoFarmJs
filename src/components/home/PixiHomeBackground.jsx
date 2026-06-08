import { useEffect, useRef, useState } from 'react'
import { Application, Graphics, Container, Text, TextStyle } from 'pixi.js'
import './PixiHomeBackground.css'

/**
 * PixiJS rendered cozy pixel art farming background for the home screen.
 * Replaces the static background image with a dynamic pixel art scene.
 */
export default function PixiHomeBackground() {
  const canvasRef = useRef(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let app = null
    let destroyed = false

    async function initPixi() {
      const newApp = new Application()

      await newApp.init({
        resizeTo: canvasRef.current,
        backgroundColor: 0x7cb342,
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

      drawHomeScene(app)
      setIsReady(true)
    }

    initPixi()

    return () => {
      destroyed = true
      if (app) {
        app.destroy(true, { children: true })
      }
    }
  }, [])

  return (
    <div className="pixi-home-bg" ref={canvasRef}>
      {/* Overlay tint */}
      <div className="pixi-home-bg__overlay" />
    </div>
  )
}

function drawHomeScene(app) {
  const { width, height } = app.screen

  // ---- Sky gradient (top portion) ----
  const sky = new Graphics()
  sky.rect(0, 0, width, height * 0.4)
  sky.fill({ color: 0x87ceeb })
  app.stage.addChild(sky)

  // Clouds
  const cloudContainer = new Container()
  const cloudPositions = [
    { x: 100, y: 40, scale: 1 },
    { x: 350, y: 60, scale: 0.7 },
    { x: 600, y: 30, scale: 1.2 },
    { x: 850, y: 50, scale: 0.8 },
    { x: 1100, y: 70, scale: 0.9 },
  ]

  cloudPositions.forEach(({ x, y, scale }) => {
    const cloud = new Graphics()
    cloud.circle(x, y, 20 * scale)
    cloud.fill({ color: 0xffffff, alpha: 0.85 })
    cloud.circle(x + 18 * scale, y - 6 * scale, 16 * scale)
    cloud.fill({ color: 0xffffff, alpha: 0.85 })
    cloud.circle(x - 14 * scale, y + 4 * scale, 14 * scale)
    cloud.fill({ color: 0xffffff, alpha: 0.85 })
    cloud.circle(x + 30 * scale, y + 4 * scale, 12 * scale)
    cloud.fill({ color: 0xffffff, alpha: 0.85 })
    cloudContainer.addChild(cloud)
  })
  app.stage.addChild(cloudContainer)

  // ---- Sun ----
  const sun = new Graphics()
  sun.circle(width - 120, 60, 30)
  sun.fill({ color: 0xffd54f })
  // Rays
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2
    const ray = new Graphics()
    ray.setStrokeStyle({ width: 2, color: 0xffe082, alpha: 0.5 })
    ray.moveTo(width - 120 + Math.cos(angle) * 36, 60 + Math.sin(angle) * 36)
    ray.lineTo(width - 120 + Math.cos(angle) * 48, 60 + Math.sin(angle) * 48)
    ray.stroke()
    app.stage.addChild(ray)
  }
  app.stage.addChild(sun)

  // ---- Hills ----
  const hills = new Graphics()
  hills.moveTo(0, height * 0.4)
  hills.quadraticCurveTo(width * 0.15, height * 0.3, width * 0.3, height * 0.38)
  hills.quadraticCurveTo(width * 0.5, height * 0.32, width * 0.7, height * 0.36)
  hills.quadraticCurveTo(width * 0.85, height * 0.3, width, height * 0.38)
  hills.lineTo(width, height * 0.45)
  hills.lineTo(0, height * 0.45)
  hills.closePath()
  hills.fill({ color: 0x66bb6a })
  app.stage.addChild(hills)

  // ---- Fields (main green) ----
  const field = new Graphics()
  field.rect(0, height * 0.4, width, height * 0.6)
  field.fill({ color: 0x7cb342 })
  app.stage.addChild(field)

  // Field rows
  const rows = new Graphics()
  rows.setStrokeStyle({ width: 1, color: 0x689f38, alpha: 0.3 })
  for (let ry = height * 0.45; ry < height; ry += 16) {
    rows.moveTo(0, ry)
    rows.lineTo(width, ry)
  }
  rows.stroke()
  app.stage.addChild(rows)

  // ---- Conveyor Belt ----
  const conveyorY = height * 0.6
  const conveyor = new Graphics()
  conveyor.rect(width * 0.3, conveyorY, width * 0.5, 12)
  conveyor.fill({ color: 0x616161 })
  conveyor.setStrokeStyle({ width: 2, color: 0x424242 })
  conveyor.stroke()
  app.stage.addChild(conveyor)

  // Conveyor rollers
  const rollers = new Graphics()
  for (let rx = width * 0.3; rx < width * 0.8; rx += 20) {
    rollers.circle(rx, conveyorY + 6, 4)
    rollers.fill({ color: 0x9e9e9e })
    rollers.setStrokeStyle({ width: 1, color: 0x757575 })
    rollers.stroke()
  }
  app.stage.addChild(rollers)

  // Items on conveyor
  const items = new Graphics()
  const itemPositions = [width * 0.35, width * 0.45, width * 0.55, width * 0.65]
  itemPositions.forEach((ix) => {
    items.rect(ix, conveyorY - 8, 10, 8)
    items.fill({ color: 0xffd54f })
    items.setStrokeStyle({ width: 1, color: 0xf9a825 })
    items.stroke()
  })
  app.stage.addChild(items)

  // ---- Barn ----
  const barnX = width * 0.7
  const barnY = height * 0.35
  const barn = new Graphics()
  barn.rect(barnX, barnY + 20, 80, 52)
  barn.fill({ color: 0x8d6e63 })
  barn.setStrokeStyle({ width: 2, color: 0x5d4037 })
  barn.stroke()
  // Roof
  barn.moveTo(barnX - 6, barnY + 20)
  barn.lineTo(barnX + 40, barnY)
  barn.lineTo(barnX + 86, barnY + 20)
  barn.closePath()
  barn.fill({ color: 0xc62828 })
  barn.setStrokeStyle({ width: 2, color: 0xb71c1c })
  barn.stroke()
  // Door
  barn.rect(barnX + 30, barnY + 44, 20, 28)
  barn.fill({ color: 0x4e342e })
  app.stage.addChild(barn)

  // ---- Windmill ----
  const wmX = width * 0.15
  const wmY = height * 0.32
  // Tower
  const tower = new Graphics()
  tower.rect(wmX - 8, wmY, 16, 60)
  tower.fill({ color: 0xbcaaa4 })
  tower.setStrokeStyle({ width: 2, color: 0x8d6e63 })
  tower.stroke()
  app.stage.addChild(tower)

  // Blades
  const bladeContainer = new Container()
  bladeContainer.x = wmX
  bladeContainer.y = wmY
  for (let i = 0; i < 4; i++) {
    const blade = new Graphics()
    const angle = (i / 4) * Math.PI * 2
    blade.moveTo(0, 0)
    blade.lineTo(Math.cos(angle) * 28, Math.sin(angle) * 28)
    blade.lineTo(Math.cos(angle + 0.15) * 24, Math.sin(angle + 0.15) * 24)
    blade.closePath()
    blade.fill({ color: 0xefebe9 })
    blade.setStrokeStyle({ width: 1, color: 0x8d6e63 })
    blade.stroke()
    bladeContainer.addChild(blade)
  }
  app.stage.addChild(bladeContainer)

  // Windmill animation
  app.ticker.add((ticker) => {
    bladeContainer.rotation += ticker.deltaTime * 0.01
  })

  // ---- Trees ----
  const treePositions = [
    { x: width * 0.05, y: height * 0.42 },
    { x: width * 0.92, y: height * 0.4 },
    { x: width * 0.88, y: height * 0.48 },
    { x: width * 0.4, y: height * 0.42 },
    { x: width * 0.55, y: height * 0.78 },
    { x: width * 0.08, y: height * 0.72 },
  ]

  treePositions.forEach(({ x, y }) => {
    const trunk = new Graphics()
    trunk.rect(x - 3, y, 6, 16)
    trunk.fill({ color: 0x5d4037 })
    app.stage.addChild(trunk)

    const foliage = new Graphics()
    foliage.circle(x, y - 8, 14)
    foliage.fill({ color: 0x388e3c })
    foliage.circle(x - 6, y - 4, 10)
    foliage.fill({ color: 0x43a047 })
    foliage.circle(x + 7, y - 4, 10)
    foliage.fill({ color: 0x2e7d32 })
    app.stage.addChild(foliage)
  })

  // ---- Crop patches ----
  const patchPositions = [
    { x: width * 0.25, y: height * 0.5, w: 100, h: 60 },
    { x: width * 0.5, y: height * 0.7, w: 80, h: 50 },
    { x: width * 0.12, y: height * 0.55, w: 70, h: 45 },
  ]

  patchPositions.forEach(({ x, y, w, h }) => {
    const patch = new Graphics()
    patch.rect(x, y, w, h)
    patch.fill({ color: 0x8d6e63, alpha: 0.5 })
    patch.setStrokeStyle({ width: 2, color: 0x5d4037, alpha: 0.5 })
    patch.stroke()
    app.stage.addChild(patch)

    // Crops in patch
    for (let cx = x + 8; cx < x + w - 8; cx += 14) {
      for (let cy = y + 8; cy < y + h - 8; cy += 14) {
        const crop = new Graphics()
        crop.rect(cx, cy, 6, 10)
        crop.fill({ color: 0xdce775 })
        app.stage.addChild(crop)
      }
    }
  })

  // ---- Animated Drone ----
  const droneC = new Container()
  droneC.x = width * 0.6
  droneC.y = height * 0.25

  const dShadow = new Graphics()
  dShadow.ellipse(0, 20, 10, 3)
  dShadow.fill({ color: 0x000000, alpha: 0.15 })
  droneC.addChild(dShadow)

  const dBody = new Graphics()
  dBody.rect(-10, -6, 20, 12)
  dBody.fill({ color: 0x37474f })
  dBody.setStrokeStyle({ width: 2, color: 0x263238 })
  dBody.stroke()
  droneC.addChild(dBody)

  const dPropL = new Graphics()
  dPropL.rect(-18, -10, 10, 3)
  dPropL.fill({ color: 0x78909c })
  droneC.addChild(dPropL)

  const dPropR = new Graphics()
  dPropR.rect(8, -10, 10, 3)
  dPropR.fill({ color: 0x78909c })
  droneC.addChild(dPropR)

  const dLed = new Graphics()
  dLed.circle(0, 0, 2)
  dLed.fill({ color: 0x4caf50 })
  droneC.addChild(dLed)

  app.stage.addChild(droneC)

  // Drone animation
  let droneTime = 0
  app.ticker.add((ticker) => {
    droneTime += ticker.deltaTime * 0.02
    droneC.y = height * 0.25 + Math.sin(droneTime) * 8
    droneC.x = width * 0.6 + Math.sin(droneTime * 0.7) * 20
    dPropL.alpha = 0.5 + Math.sin(droneTime * 10) * 0.5
    dPropR.alpha = 0.5 + Math.cos(droneTime * 10) * 0.5
  })

  // ---- Sprinkler ----
  const sprinklerContainer = new Container()
  const sprX = width * 0.35
  const sprY = height * 0.52
  
  // Base
  const sprBase = new Graphics()
  sprBase.rect(sprX - 4, sprY, 8, 16)
  sprBase.fill({ color: 0x757575 })
  sprinklerContainer.addChild(sprBase)
  
  // Head
  const sprHead = new Graphics()
  sprHead.rect(sprX - 8, sprY - 4, 16, 4)
  sprHead.fill({ color: 0x9e9e9e })
  sprinklerContainer.addChild(sprHead)

  app.stage.addChild(sprinklerContainer)

  // Water drops animation
  let sprTime = 0
  const waterDrops = new Container()
  app.stage.addChild(waterDrops)

  app.ticker.add((ticker) => {
    sprTime += ticker.deltaTime * 0.05
    waterDrops.removeChildren()
    
    for (let i = 0; i < 5; i++) {
      const t = (sprTime + i * 0.4) % 2
      if (t < 1) {
        const drop = new Graphics()
        const dx = sprX + Math.sin(t * Math.PI + i) * 20
        const dy = sprY - 4 + t * 30
        drop.circle(dx, dy, 1.5)
        drop.fill({ color: 0x4fc3f7, alpha: 1 - t })
        waterDrops.addChild(drop)
      }
    }
  })

  // Cloud slow drift animation
  let cloudTime = 0
  app.ticker.add((ticker) => {
    cloudTime += ticker.deltaTime * 0.3
    cloudContainer.x = Math.sin(cloudTime * 0.01) * 15
  })

  // ---- Flower patches ----
  const flowerColors = [0xff7043, 0xffb74d, 0xce93d8, 0xf48fb1]
  const flowerPositions = [
    { x: width * 0.02, y: height * 0.65 },
    { x: width * 0.18, y: height * 0.82 },
    { x: width * 0.82, y: height * 0.62 },
    { x: width * 0.95, y: height * 0.85 },
    { x: width * 0.42, y: height * 0.88 },
  ]

  flowerPositions.forEach(({ x, y }, idx) => {
    const flower = new Graphics()
    const color = flowerColors[idx % flowerColors.length]
    flower.circle(x, y, 4)
    flower.fill({ color })
    flower.circle(x + 6, y + 3, 3)
    flower.fill({ color })
    // Stem
    flower.setStrokeStyle({ width: 1, color: 0x558b2f })
    flower.moveTo(x, y + 4)
    flower.lineTo(x, y + 12)
    flower.stroke()
    app.stage.addChild(flower)
  })
}
