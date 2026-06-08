/**
 * DroneInterpreter — A safe, step-by-step script interpreter for the farming drone.
 * 
 * Exposes two global objects to user scripts:
 *   - drone: { harvest(), plant(crop), till(), moveNext(), moveTo(row, col), wait(ms) }
 *   - sensor: { isRipe(), isSoil(), isTurf(), isOre(), currentTile(), gridSize() }
 * 
 * Each drone action is async with a configurable delay or step control so the player can
 * visually follow what the drone is doing on the canvas.
 */

const DEFAULT_STEP_DELAY = 600 // ms between each drone action

/**
 * Creates a drone execution context bound to the game store.
 * Returns { run, stop, step } controls.
 */
export function createDroneRunner(getStore, onLog, onDroneMove, onStatusChange) {
  let abortController = null
  let isRunning = false
  let isStepMode = false
  let stepResolver = null

  /**
   * Sleeps for the given duration, but can be aborted.
   */
  function sleep(ms, signal) {
    if (signal?.aborted) {
      return Promise.reject(new DOMException('Aborted', 'AbortError'))
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, ms)
      const onAbort = () => {
        clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      }
      signal?.addEventListener('abort', onAbort)
      // Clean up listener when resolved
      Promise.resolve(timer).then(() => {
        signal?.removeEventListener('abort', onAbort)
      })
    })
  }

  /**
   * Waits for the user to trigger the next step.
   */
  function waitForNextStep(signal) {
    if (signal?.aborted) {
      return Promise.reject(new DOMException('Aborted', 'AbortError'))
    }
    return new Promise((resolve, reject) => {
      let resolved = false
      const onAbort = () => {
        if (resolved) return
        resolved = true
        reject(new DOMException('Aborted', 'AbortError'))
      }
      signal?.addEventListener('abort', onAbort)

      stepResolver = () => {
        if (resolved) return
        resolved = true
        signal?.removeEventListener('abort', onAbort)
        resolve()
      }
    })
  }

  /**
   * Handles the delay or stepping pause after each drone action.
   */
  async function handleActionDelay(signal) {
    if (isStepMode) {
      onStatusChange('paused')
      onLog('⏸️ Paused. Click STEP to run next line.', 'warn')
      await waitForNextStep(signal)
      onStatusChange('running')
    } else {
      const speedMultiplier = getStore().droneSpeedMultiplier || 1.0
      const delay = DEFAULT_STEP_DELAY / speedMultiplier
      await sleep(delay, signal)
    }
  }

  /**
   * Build the drone API object.
   * Every action is async and includes a delay or pause.
   */
  function buildDroneAPI(signal) {
    const checkEnergy = () => {
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError')
      }
      const { energy } = getStore()
      if (energy <= 0) {
        onLog('🔌 Out of energy! Drone has shutdown.', 'error')
        throw new Error('Out of energy')
      }
    }

    return {
      /**
       * drone.harvest() — Harvests the crop at the drone's current tile.
       */
      async harvest() {
        checkEnergy()
        const { droneRow, droneCol } = getStore()
        const tile = getStore().grid[droneRow]?.[droneCol]
        if (!tile) {
          onLog('⚠️ No tile at current position', 'warn')
          return false
        }
        let result = false
        if (tile.type === 'ripe') {
          result = getStore().harvestCrop(droneRow, droneCol)
          onLog(result ? `🌾 Harvested ${tile.crop || 'wheat'} at (${droneRow}, ${droneCol})` : '❌ Harvest failed (no energy?)', result ? 'success' : 'error')
        } else if (['copper_ore', 'iron_ore', 'crystal_ore'].includes(tile.type)) {
          result = getStore().harvestOre(droneRow, droneCol)
          onLog(result ? `⛏️ Mined ${tile.type} at (${droneRow}, ${droneCol})` : '❌ Mining failed', result ? 'success' : 'error')
        } else {
          onLog(`⚠️ Nothing to harvest at (${droneRow}, ${droneCol})`, 'warn')
        }
        await handleActionDelay(signal)
        return result
      },

      /**
       * drone.plant(cropName) — Plants the specified crop on tilled soil.
       */
      async plant(cropName) {
        checkEnergy()
        const { droneRow, droneCol } = getStore()
        const prevCrop = getStore().selectedCrop
        if (cropName) getStore().setSelectedCrop(cropName)
        const result = getStore().plantCrop(droneRow, droneCol)
        onLog(result ? `🌱 Planted ${cropName || prevCrop} at (${droneRow}, ${droneCol})` : `❌ Can't plant here (need tilled soil & energy)`, result ? 'success' : 'error')
        if (cropName) getStore().setSelectedCrop(prevCrop) // Restore
        await handleActionDelay(signal)
        return result
      },

      /**
       * drone.till() — Tills turf at the drone's current tile.
       */
      async till() {
        checkEnergy()
        const { droneRow, droneCol } = getStore()
        const result = getStore().tillTile(droneRow, droneCol)
        onLog(result ? `🪵 Tilled soil at (${droneRow}, ${droneCol})` : `❌ Can't till here (need turf & energy)`, result ? 'success' : 'error')
        await handleActionDelay(signal)
        return result
      },

      /**
       * drone.moveNext() — Moves the drone to the next tile (left-to-right, top-to-bottom).
       */
      async moveNext() {
        checkEnergy()
        const { droneRow, droneCol, unlockedNodes } = getStore()
        const isEfficient = unlockedNodes?.includes('energyEfficiency')
        const cost = isEfficient ? 0 : 1
        if (cost > 0) {
          getStore().consumeEnergy(cost)
        }

        const gridSize = getStore().grid.length
        let nextRow = droneRow
        let nextCol = droneCol + 1
        if (nextCol >= gridSize) {
          nextCol = 0
          nextRow = nextRow + 1
          if (nextRow >= gridSize) {
            nextRow = 0 // Wrap around to start
          }
        }
        getStore().setDronePosition(nextRow, nextCol)
        onDroneMove(nextRow, nextCol)
        onLog(`🚁 Moved to (${nextRow}, ${nextCol})`, 'info')
        await handleActionDelay(signal)
      },

      /**
       * drone.moveTo(row, col) — Moves the drone to a specific tile.
       */
      async moveTo(row, col) {
        checkEnergy()
        const { droneRow, droneCol, unlockedNodes } = getStore()
        const distance = Math.abs(row - droneRow) + Math.abs(col - droneCol)
        const isEfficient = unlockedNodes?.includes('energyEfficiency')
        const cost = isEfficient ? Math.floor(distance / 2) : distance
        
        if (cost > 0) {
          const { energy } = getStore()
          if (energy < cost) {
            onLog(`🔌 Not enough energy to move to (${row}, ${col})! (Need ${cost} energy)`, 'error')
            throw new Error('Out of energy')
          }
          getStore().consumeEnergy(cost)
        }

        const gridSize = getStore().grid.length
        if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
          onLog(`❌ Invalid position (${row}, ${col})`, 'error')
          return
        }
        getStore().setDronePosition(row, col)
        onDroneMove(row, col)
        onLog(`🚁 Moved to (${row}, ${col})`, 'info')
        await handleActionDelay(signal)
      },

      /**
       * drone.wait(ms) — Waits for the specified duration.
       */
      async wait(ms = 1000) {
        checkEnergy()
        onLog(`⏳ Waiting ${ms}ms...`, 'info')
        await sleep(ms, signal)
      },

      /**
       * drone.charge() — Recharges the drone at the charging pad.
       */
      async charge() {
        const { droneRow, droneCol } = getStore()
        const tile = getStore().grid[droneRow]?.[droneCol]
        if (tile && tile.type === 'charging_station') {
          onLog('⚡ Charging drone...', 'info')
          while (getStore().energy < getStore().maxEnergy) {
            getStore().rechargeEnergy(20)
            const pct = Math.round((getStore().energy / getStore().maxEnergy) * 100)
            onLog(`⚡ Charging: ${pct}%`, 'info')
            await sleep(200, signal)
          }
          onLog('🔋 Fully charged!', 'success')
        } else {
          onLog('❌ Cannot charge: Not on the charging station! (moveTo(0,0) first)', 'error')
        }
        await handleActionDelay(signal)
      }
    }
  }

  /**
   * Build the sensor API object (synchronous reads).
   */
  function buildSensorAPI() {
    return {
      isRipe() {
        const { droneRow, droneCol, grid } = getStore()
        return grid[droneRow]?.[droneCol]?.type === 'ripe'
      },
      isSoil() {
        const { droneRow, droneCol, grid } = getStore()
        return grid[droneRow]?.[droneCol]?.type === 'soil'
      },
      isTurf() {
        const { droneRow, droneCol, grid } = getStore()
        return grid[droneRow]?.[droneCol]?.type === 'turf'
      },
      isOre() {
        const { droneRow, droneCol, grid } = getStore()
        const type = grid[droneRow]?.[droneCol]?.type
        return ['copper_ore', 'iron_ore', 'crystal_ore'].includes(type)
      },
      isGrowing() {
        const { droneRow, droneCol, grid } = getStore()
        const type = grid[droneRow]?.[droneCol]?.type
        return type === 'seedling' || type === 'growing'
      },
      currentTile() {
        const { droneRow, droneCol, grid } = getStore()
        return grid[droneRow]?.[droneCol] || null
      },
      gridSize() {
        return getStore().grid.length
      },
      position() {
        const { droneRow, droneCol } = getStore()
        return { row: droneRow, col: droneCol }
      },
      getEnergy() {
        return getStore().energy
      },
    }
  }

  /**
   * Starts script execution in normal running mode or stepping mode.
   */
  async function runScript(scriptText, startInStepMode = false) {
    if (isRunning) {
      if (startInStepMode && stepResolver) {
        // If already running and paused, stepResolver triggers next step
        stepResolver()
      }
      return
    }

    isRunning = true
    isStepMode = startInStepMode
    abortController = new AbortController()
    const signal = abortController.signal
    onStatusChange('running')
    onLog(startInStepMode ? '▶️ Script started in STEP mode' : '▶️ Script started', 'info')

    const drone = buildDroneAPI(signal)
    const sensor = buildSensorAPI()

    try {
      const wrappedScript = `
        return (async function userScript(drone, sensor, log) {
          ${scriptText}
        })
      `
      const scriptFactory = new Function(wrappedScript)
      const userScript = scriptFactory()
      
      const userLog = (msg) => onLog(`📝 ${msg}`, 'info')
      
      await userScript(drone, sensor, userLog)

      if (!signal.aborted) {
        onLog('✅ Script completed!', 'success')
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        onLog('⏹️ Script stopped by user', 'warn')
      } else {
        onLog(`🔴 Error: ${err.message}`, 'error')
      }
    } finally {
      isRunning = false
      isStepMode = false
      stepResolver = null
      onStatusChange('idle')
    }
  }

  function stop() {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
  }

  return {
    run: (scriptText) => runScript(scriptText, false),
    step: (scriptText) => runScript(scriptText, true),
    stop,
    toggleStepMode: (val) => { isStepMode = val }
  }
}
