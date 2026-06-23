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
 * Transpiles Arduino/C++ style drone code into JavaScript.
 */
function transpileArduinoToJS(scriptText) {
  // Mask strings to protect them from regex replacements
  const placeholders = [];
  let masked = scriptText;

  // Mask double-quoted strings
  masked = masked.replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, (match) => {
    const id = `___STR_PLACEHOLDER_${placeholders.length}___`;
    placeholders.push({ id, val: match });
    return id;
  });

  // Mask single-quoted strings
  masked = masked.replace(/'[^'\\]*(?:\\.[^'\\]*)*'/g, (match) => {
    const id = `___STR_PLACEHOLDER_${placeholders.length}___`;
    placeholders.push({ id, val: match });
    return id;
  });

  // 1. Remove any existing "await " to start clean
  let transpiled = masked.replace(/\bawait\s+/g, '');

  // 2. Identify and collect user-defined functions
  const userFunctions = new Set();
  const funcDeclRegex = /\b(?:void|int|float|double|char|bool|boolean|String|string|auto)\s+(\w+)\s*\(([^)]*)\)\s*\{/g;
  let match;
  while ((match = funcDeclRegex.exec(transpiled)) !== null) {
    const funcName = match[1];
    if (funcName !== 'setup' && funcName !== 'loop') {
      userFunctions.add(funcName);
    }
  }

  // 3. Replace function declarations with JS async functions, stripping parameter types
  transpiled = transpiled.replace(
    /\b(?:void|int|float|double|char|bool|boolean|String|string|auto)\s+(\w+)\s*\(([^)]*)\)\s*\{/g,
    (m, funcName, paramList) => {
      const cleanedParams = paramList
        .split(',')
        .map(p => {
          const parts = p.trim().split(/\s+/);
          return parts[parts.length - 1]; // get the parameter name
        })
        .filter(p => p !== '')
        .join(', ');
      return `async function ${funcName}(${cleanedParams}) {`;
    }
  );

  // 4. Replace variable declarations:
  // a) "const int x" -> "const x"
  transpiled = transpiled.replace(/\bconst\s+(?:int|float|double|char|bool|boolean|String|string|auto)\s+(\w+)\b/g, 'const $1');
  
  // b) "int x" -> "let x"
  transpiled = transpiled.replace(/\b(?:int|float|double|char|bool|boolean|String|string|auto)\s+(\w+)\b/g, 'let $1');

  // 5. Prepend "await " to async functions
  transpiled = transpiled.replace(/\b(drone\.(?:harvest|plant|till|moveNext|moveTo|wait|charge))\s*\(/g, 'await $1(');
  transpiled = transpiled.replace(/\b(delay)\s*\(/g, 'await $1(');

  if (userFunctions.size > 0) {
    const userFuncNames = Array.from(userFunctions).join('|');
    const userFuncRegex = new RegExp(`\\b(${userFuncNames})\\s*\\(`, 'g');
    transpiled = transpiled.replace(userFuncRegex, 'await $1(');
  }

  // Restore string placeholders
  for (let i = placeholders.length - 1; i >= 0; i--) {
    const p = placeholders[i];
    transpiled = transpiled.replace(p.id, p.val);
  }

  return transpiled;
}

/**
 * Instruments control flow statements in the script to support line highlighting and stepping on decisions.
 */
function instrumentControlFlow(scriptText) {
  const lines = scriptText.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const lineNum = i + 1;
    
    // Skip empty lines, lines that are pure comments
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      continue;
    }
    
    // 1. Match "else if (cond)" and "if (cond)"
    if (/\bif\s*\(/.test(line)) {
      line = line.replace(/\bif\s*\((.*)\)/, (m, cond) => `if (await _track(${lineNum}), ${cond})`);
    }
    // 2. Match "while (cond)"
    else if (/\bwhile\s*\(/.test(line)) {
      line = line.replace(/\bwhile\s*\((.*)\)/, (m, cond) => `while (await _track(${lineNum}), ${cond})`);
    }
    // 3. Match "for (init; cond; inc)"
    else if (/\bfor\s*\(/.test(line)) {
      line = line.replace(/\bfor\s*\(([^;]*);([^;]*);([^;]*)\)/, (m, init, cond, inc) => {
        return `for (${init}; await _track(${lineNum}), ${cond}; ${inc})`;
      });
    }
    // 4. Match "else {" or "else"
    else if (/\belse\b/.test(line) && !/\bif\b/.test(line)) {
      if (line.includes('{')) {
        line = line.replace(/\belse\s*\{/, `else { await _track(${lineNum});`);
      } else {
        // If the brace is on the next line, inject it there
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].trim() === '{') {
            lines[j] = `{ await _track(${lineNum});`;
            break;
          } else if (lines[j].includes('{')) {
            lines[j] = lines[j].replace('{', `{ await _track(${lineNum});`);
            break;
          } else if (lines[j].trim() !== '') {
            break;
          }
        }
      }
    }
    
    lines[i] = line;
  }
  
  return lines.join('\n');
}

/**
 * Creates a drone execution context bound to the game store.
 * Returns { run, stop, step } controls.
 */
export function createDroneRunner(getStore, onLog, onDroneMove, onStatusChange, onLineExecute, onErrorLine) {
  let abortController = null
  let isRunning = false
  let isStepMode = false
  let stepResolver = null

  /**
   * Helper to parse line number of user script from an error stack trace.
   */
  function getErrorLine(err) {
    if (!err || !err.stack) return null
    try {
      const lines = err.stack.split('\n')
      for (const line of lines) {
        const match = line.match(/<anonymous>:(\d+):\d+\)?$/) || line.match(/Function:(\d+):\d+$/)
        if (match) {
          const stackLine = parseInt(match[1], 10)
          return stackLine - 4
        }
      }
    } catch (e) {
      // Ignore
    }
    return null
  }

  /**
   * Helper to parse the line number of user script from call stack.
   */
  function getCurrentUserLine() {
    try {
      const stack = new Error().stack
      if (!stack) return null
      
      const lines = stack.split('\n')
      for (const line of lines) {
        const match = line.match(/<anonymous>:(\d+):\d+\)?$/) || line.match(/Function:(\d+):\d+$/)
        if (match) {
          const stackLine = parseInt(match[1], 10)
          return stackLine - 4
        }
      }
    } catch (e) {
      // Ignore
    }
    return null
  }

  /**
   * Highlights the current active line in the user editor.
   */
  function trackLine() {
    const line = getCurrentUserLine()
    if (line !== null && onLineExecute) {
      onLineExecute(line)
    }
  }

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
    const checkAbort = () => {
      if (signal?.aborted) {
        return new Promise(() => {}) // Never resolves, halts user script execution
      }
      return null
    }

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
        const aborted = checkAbort()
        if (aborted) return aborted
        trackLine()
        checkEnergy()
        const { droneRow, droneCol } = getStore()
        const tile = getStore().grid[droneRow]?.[droneCol]
        if (!tile) {
          throw new Error('No tile at current position')
        }
        let result = false
        if (tile.type === 'ripe') {
          result = getStore().harvestCrop(droneRow, droneCol)
          if (!result) throw new Error('Harvest failed (insufficient energy)')
          onLog(`🌾 Harvested ${tile.crop || 'wheat'} at (${droneRow}, ${droneCol})`, 'success')
        } else if (['copper_ore', 'iron_ore', 'crystal_ore'].includes(tile.type)) {
          result = getStore().harvestOre(droneRow, droneCol)
          if (!result) throw new Error('Mining failed (insufficient energy)')
          onLog(`⛏️ Mined ${tile.type} at (${droneRow}, ${droneCol})`, 'success')
        } else {
          throw new Error(`Nothing to harvest at (${droneRow}, ${droneCol})`)
        }
        await handleActionDelay(signal)
        return result
      },

      /**
       * drone.plant(cropName) — Plants the specified crop on tilled soil.
       */
      async plant(cropName) {
        const aborted = checkAbort()
        if (aborted) return aborted
        trackLine()
        checkEnergy()
        const { droneRow, droneCol } = getStore()
        const prevCrop = getStore().selectedCrop
        if (cropName) getStore().setSelectedCrop(cropName)
        const result = getStore().plantCrop(droneRow, droneCol)
        if (cropName) getStore().setSelectedCrop(prevCrop) // Restore
        if (!result) {
          throw new Error(`Can't plant here (need tilled soil & energy)`)
        }
        onLog(`🌱 Planted ${cropName || prevCrop} at (${droneRow}, ${droneCol})`, 'success')
        await handleActionDelay(signal)
        return result
      },

      /**
       * drone.till() — Tills turf at the drone's current tile.
       */
      async till() {
        const aborted = checkAbort()
        if (aborted) return aborted
        trackLine()
        checkEnergy()
        const { droneRow, droneCol } = getStore()
        const result = getStore().tillTile(droneRow, droneCol)
        if (!result) {
          throw new Error(`Can't till here (need turf & energy)`)
        }
        onLog(`🪵 Tilled soil at (${droneRow}, ${droneCol})`, 'success')
        await handleActionDelay(signal)
        return result
      },

      /**
       * drone.moveNext() — Moves the drone to the next tile (left-to-right, top-to-bottom).
       */
      async moveNext() {
        const aborted = checkAbort()
        if (aborted) return aborted
        trackLine()
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
        const aborted = checkAbort()
        if (aborted) return aborted
        trackLine()
        const { droneRow, droneCol, unlockedNodes } = getStore()
        const distance = Math.abs(row - droneRow) + Math.abs(col - droneCol)
        const isEfficient = unlockedNodes?.includes('energyEfficiency')
        const cost = isEfficient ? Math.floor(distance / 2) : distance
        
        if (cost > 0) {
          checkEnergy()
          const { energy } = getStore()
          if (energy < cost) {
            onLog(`🔌 Not enough energy to move to (${row}, ${col})! (Need ${cost} energy)`, 'error')
            throw new Error('Out of energy')
          }
          getStore().consumeEnergy(cost)
        }

        const gridSize = getStore().grid.length
        if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
          throw new Error(`Invalid position (${row}, ${col})`)
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
        const aborted = checkAbort()
        if (aborted) return aborted
        trackLine()
        onLog(`⏳ Waiting ${ms}ms...`, 'info')
        await sleep(ms, signal)
      },

      /**
       * drone.charge() — Recharges the drone at the charging pad.
       */
      async charge() {
        const aborted = checkAbort()
        if (aborted) return aborted
        trackLine()
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
          throw new Error('Cannot charge: Not on the charging station! (moveTo(0,0) first)')
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
        trackLine()
        const { droneRow, droneCol, grid } = getStore()
        return grid[droneRow]?.[droneCol]?.type === 'ripe'
      },
      isSoil() {
        trackLine()
        const { droneRow, droneCol, grid } = getStore()
        return grid[droneRow]?.[droneCol]?.type === 'soil'
      },
      isTurf() {
        trackLine()
        const { droneRow, droneCol, grid } = getStore()
        return grid[droneRow]?.[droneCol]?.type === 'turf'
      },
      isOre() {
        trackLine()
        const { droneRow, droneCol, grid } = getStore()
        const type = grid[droneRow]?.[droneCol]?.type
        return ['copper_ore', 'iron_ore', 'crystal_ore'].includes(type)
      },
      isGrowing() {
        trackLine()
        const { droneRow, droneCol, grid } = getStore()
        const type = grid[droneRow]?.[droneCol]?.type
        return type === 'seedling' || type === 'growing'
      },
      currentTile() {
        trackLine()
        const { droneRow, droneCol, grid } = getStore()
        return grid[droneRow]?.[droneCol] || null
      },
      gridSize() {
        trackLine()
        return getStore().grid.length
      },
      position() {
        trackLine()
        const { droneRow, droneCol } = getStore()
        return { row: droneRow, col: droneCol }
      },
      getEnergy() {
        trackLine()
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
      const transpiledScript = transpileArduinoToJS(scriptText)
      const instrumentedScript = instrumentControlFlow(transpiledScript)
      const wrappedScript = `
        return (async function userScript(drone, sensor, log, delay, Serial, yieldThread, _track) {
          ${instrumentedScript}
          
          if (typeof setup === 'function') {
            await setup();
          }
          if (typeof loop === 'function') {
            while (true) {
              await loop();
              await yieldThread();
            }
          }
        })
      `
      const scriptFactory = new Function(wrappedScript)
      const userScript = scriptFactory()
      
      const userLog = (msg) => onLog(`📝 ${msg}`, 'info')
      const delay = async (ms) => {
        await drone.wait(ms)
      }
      const Serial = {
        print: (msg) => {
          trackLine()
          onLog(`📟 ${msg}`, 'info')
        },
        println: (msg) => {
          trackLine()
          onLog(`📟 ${msg}`, 'info')
        }
      }
      const yieldThread = () => sleep(10, signal)
      
      const userTrack = async (lineNum) => {
        if (onLineExecute) {
          onLineExecute(lineNum)
        }
        if (isStepMode) {
          onStatusChange('paused')
          onLog(`⏸️ Decision at Line ${lineNum}. Click STEP to continue.`, 'warn')
          await waitForNextStep(signal)
          onStatusChange('running')
        } else {
          // Allow active highlight to render briefly in normal execution mode
          await sleep(20, signal)
        }
      }

      const abortPromise = new Promise((_, reject) => {
        const onAbort = () => {
          reject(new DOMException('Aborted', 'AbortError'))
        }
        if (signal.aborted) {
          onAbort()
        } else {
          signal.addEventListener('abort', onAbort)
        }
      })

      await Promise.race([
        userScript(drone, sensor, userLog, delay, Serial, yieldThread, userTrack),
        abortPromise
      ])

      if (!signal.aborted) {
        onLog('✅ Script completed!', 'success')
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        onLog('⏹️ Script stopped by user', 'warn')
      } else {
        const errorLine = getErrorLine(err)
        if (errorLine !== null && onErrorLine) {
          onErrorLine(errorLine)
          onLog(`🔴 Error at Line ${errorLine}: ${err.message}`, 'error')
        } else {
          onLog(`🔴 Error: ${err.message}`, 'error')
        }
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
