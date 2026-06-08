import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CROPS, EXPANSION_COSTS } from '../config/assetsConfig.js'

const NODE_PARENTS = {
  root: null,
  loops: 'root',
  variables: 'loops',
  functions: 'variables',
  logicPro: 'functions',
  advancedSensors: 'root',
  fasterHarvesting: 'advancedSensors',
  energyEfficiency: 'fasterHarvesting',
  landExpansion1: 'root',
  landExpansion2: 'landExpansion1',
  multiDrone: 'landExpansion2',
}

const INITIAL_GRID = [
  [{ type: 'charging_station', baseType: 'charging_station' }, { type: 'turf' }, { type: 'growing', crop: 'wheat', progress: 50 }],
  [{ type: 'seedling', crop: 'wheat', progress: 0 }, { type: 'ripe', crop: 'wheat', progress: 100 }, { type: 'turf' }],
  [{ type: 'turf' }, { type: 'soil' }, { type: 'ripe', crop: 'wheat', progress: 100 }]
]

// Generate crop balance parameters dynamically from config file
export const CROP_CONFIGS = Object.entries(CROPS).reduce((acc, [key, value]) => {
  acc[key] = { xp: value.xpReward, cost: value.energyCost }
  return acc
}, {})

export const useGameStore = create(
  persist(
    (set, get) => ({
      // --- Game Resources ---
      wheat: 0, // Backward compatibility for HUD
      xp: 0,
      energy: 100,
      maxEnergy: 100,
      droneSpeedMultiplier: 1.0,

      // --- Crop Inventory ---
      inventory: {
        wheat: 0,
        carrot: 0,
        beetroot: 0,
        potato: 0,
        watermelon: 0,
        grass: 0,
        copper_ore: 0,
        iron_ore: 0,
        crystal_ore: 0,
      },
      selectedCrop: 'wheat',

      // --- Farm Grid State ---
      grid: INITIAL_GRID,
      zoom: 1.0,

      // --- Drone State ---
      droneRow: 0,
      droneCol: 0,
      droneScript: `// 🤖 Welcome to Drone Logic!
// Automate planting, harvesting, and tilling.
// Return to the charging pad at (0, 0) when energy is low!

for (let i = 0; i < sensor.gridSize() ** 2; i++) {
  // Check if energy is low and head back to charge
  if (sensor.getEnergy() < 15) {
    log("🔋 Energy low! Returning to base.");
    await drone.moveTo(0, 0);
    await drone.charge();
  }

  // Check state of the current tile
  if (sensor.isRipe()) {
    await drone.harvest();
    await drone.plant('wheat');
  } else if (sensor.isTurf()) {
    await drone.till();
  }
  
  await drone.moveNext();
}
`,
      droneStatus: 'idle', // 'idle' | 'running'
      droneConsole: [], // Array of { text, type, id }
      isHelpOpen: false,

      // --- Tech Tree Unlocks ---
      unlockedNodes: ['root', 'loops'], // Default unlocked logic nodes

      // --- Actions ---
      zoomIn: () => set((state) => ({ zoom: Math.min(2.0, (state.zoom || 1.0) + 0.15) })),
      zoomOut: () => set((state) => ({ zoom: Math.max(0.5, (state.zoom || 1.0) - 0.15) })),
      resetZoom: () => set({ zoom: 1.0 }),

      setDronePosition: (row, col) => set({ droneRow: row, droneCol: col }),
      setDroneScript: (script) => set({ droneScript: script }),
      setDroneStatus: (status) => set({ droneStatus: status }),
      setDroneSpeedMultiplier: (multiplier) => set({ droneSpeedMultiplier: multiplier }),
      setHelpOpen: (isOpen) => set({ isHelpOpen: isOpen }),
      addDroneLog: (text, type = 'info') => set((state) => ({
        droneConsole: [...state.droneConsole.slice(-50), { text, type, id: Date.now() }]
      })),
      clearDroneConsole: () => set({ droneConsole: [] }),

      addXp: (amount) => 
        set((state) => ({ xp: state.xp + amount })),
      
      consumeEnergy: (amount) => 
        set((state) => ({ energy: Math.max(0, state.energy - amount) })),
      
      rechargeEnergy: (amount = 20) => 
        set((state) => ({ energy: Math.min(state.maxEnergy, state.energy + amount) })),

      upgradeMaxEnergy: (amount) =>
        set((state) => ({ 
          maxEnergy: state.maxEnergy + amount,
          energy: state.energy + amount 
        })),

      setSelectedCrop: (crop) => {
        if (CROP_CONFIGS[crop]) {
          set({ selectedCrop: crop })
        }
      },

      recallAndCharge: () => {
        const { maxEnergy, droneStatus } = get()
        if (droneStatus !== 'idle') return false
        set({
          droneRow: 0,
          droneCol: 0,
          energy: maxEnergy,
          droneConsole: [
            ...get().droneConsole.slice(-49),
            { text: '🔌 Recall manual override: Drone returned to (0,0) and fully charged!', type: 'success', id: Date.now() }
          ]
        })
        return true
      },

      // Checks status of a node dynamically: 'unlocked' | 'reachable' | 'locked'
      getNodeStatus: (nodeId) => {
        const { unlockedNodes } = get()
        if (unlockedNodes.includes(nodeId)) {
          return 'unlocked'
        }
        const parentId = NODE_PARENTS[nodeId]
        if (parentId === null || unlockedNodes.includes(parentId)) {
          return 'reachable'
        }
        return 'locked'
      },

      // Unlocks a node if reachable and user has enough XP
      unlockNode: (nodeId, xpCost) => {
        const { xp, getNodeStatus, unlockedNodes } = get()
        
        if (getNodeStatus(nodeId) !== 'reachable') {
          return false
        }
        
        if (xp < xpCost) {
          return false
        }

        // Add node to unlocked list and deduct cost
        set({
          xp: xp - xpCost,
          unlockedNodes: [...unlockedNodes, nodeId]
        })

        // Apply global effects based on unlocked upgrades
        if (nodeId === 'fasterHarvesting') {
          set({ droneSpeedMultiplier: 1.25 })
        } else if (nodeId === 'energyEfficiency') {
          // Reduces energy costs (handled during operations)
        } else if (nodeId === 'landExpansion1') {
          get().upgradeMaxEnergy(50)
        }

        return true
      },

      // --- Farm Interactions ---
      tillTile: (r, c) => {
        const { grid, energy, consumeEnergy, unlockedNodes } = get()
        const tile = grid[r]?.[c]

        if (!tile || tile.type !== 'turf') return false
        
        const isEfficient = unlockedNodes?.includes('energyEfficiency')
        const cost = isEfficient ? 3 : 5
        if (energy < cost) return false

        consumeEnergy(cost)

        // 10% copper_ore, 10% iron_ore, 10% crystal_ore, 70% normal soil
        const roll = Math.random()
        let type = 'soil'
        if (roll < 0.1) {
          type = 'copper_ore'
        } else if (roll < 0.2) {
          type = 'iron_ore'
        } else if (roll < 0.3) {
          type = 'crystal_ore'
        }

        const newGrid = grid.map((row, rIdx) =>
          row.map((col, cIdx) =>
            rIdx === r && cIdx === c ? { type, baseType: type } : col
          )
        )

        set({ grid: newGrid })
        return true
      },

      plantCrop: (r, c, overrideCrop) => {
        const { grid, energy, consumeEnergy, selectedCrop, unlockedNodes } = get()
        const tile = grid[r]?.[c]
        const cropToPlant = overrideCrop || selectedCrop

        // Crops can only be planted on tilled farmland soil
        if (!tile || tile.type !== 'soil') return false
        
        const baseCost = CROP_CONFIGS[cropToPlant]?.cost
        if (!baseCost) return false
        
        const isEfficient = unlockedNodes?.includes('energyEfficiency')
        const cost = isEfficient ? Math.max(1, Math.round(baseCost * 0.6)) : baseCost
        if (energy < cost) return false

        consumeEnergy(cost)
        
        const newGrid = grid.map((row, rIdx) => 
          row.map((col, cIdx) => 
            rIdx === r && cIdx === c ? { 
              ...col, 
              type: 'seedling', 
              crop: cropToPlant, 
              progress: 0,
              baseType: 'soil' 
            } : col
          )
        )

        set({ grid: newGrid })
        return true
      },

      harvestCrop: (r, c) => {
        const { grid, energy, consumeEnergy, addXp, inventory, wheat, unlockedNodes } = get()
        const tile = grid[r]?.[c]

        if (!tile || tile.type !== 'ripe') return false
        
        const isEfficient = unlockedNodes?.includes('energyEfficiency')
        const cost = isEfficient ? 3 : 5
        if (energy < cost) return false

        const cropType = tile.crop || 'wheat'
        const cropXp = CROP_CONFIGS[cropType].xp

        consumeEnergy(cost)
        addXp(cropXp)

        const newInventory = {
          ...inventory,
          [cropType]: (inventory[cropType] || 0) + 1
        }

        let nextType = 'soil'
        if (cropType === 'grass') {
          const roll = Math.random()
          if (roll < 0.1) {
            nextType = 'copper_ore'
          } else if (roll < 0.2) {
            nextType = 'iron_ore'
          } else if (roll < 0.3) {
            nextType = 'crystal_ore'
          }
        }

        const newGrid = grid.map((row, rIdx) => 
          row.map((col, cIdx) => 
            rIdx === r && cIdx === c ? { 
              type: nextType, 
              baseType: nextType 
            } : col
          )
        )

        set({ 
          grid: newGrid,
          inventory: newInventory,
          wheat: cropType === 'wheat' ? wheat + 1 : wheat
        })
        return true
      },

      harvestOre: (r, c) => {
        const { grid, energy, consumeEnergy, addXp, inventory, unlockedNodes } = get()
        const tile = grid[r]?.[c]

        const validOres = ['copper_ore', 'iron_ore', 'crystal_ore']
        if (!tile || !validOres.includes(tile.type)) return false
        
        const isEfficient = unlockedNodes?.includes('energyEfficiency')
        const cost = isEfficient ? 3 : 5
        if (energy < cost) return false

        consumeEnergy(cost)
        addXp(50) // Give XP reward for clearing ore blockades

        const oreType = tile.type
        const newInventory = {
          ...inventory,
          [oreType]: (inventory[oreType] || 0) + 1
        }

        const newGrid = grid.map((row, rIdx) => 
          row.map((col, cIdx) => 
            rIdx === r && cIdx === c ? { type: 'soil', baseType: 'soil' } : col
          )
        )

        set({ 
          grid: newGrid,
          inventory: newInventory
        })
        return true
      },

      expandGrid: () => {
        const { grid, inventory } = get()
        const currentSize = grid.length
        const nextSize = currentSize + 1

        if (nextSize > 6) return false

        const cost = EXPANSION_COSTS[nextSize]
        if (!cost) return false

        // Verify player has enough crops
        for (const [crop, count] of Object.entries(cost)) {
          if ((inventory[crop] || 0) < count) {
            return false
          }
        }

        // Deduct crop costs
        const newInventory = { ...inventory }
        for (const [crop, count] of Object.entries(cost)) {
          newInventory[crop] -= count
        }

        // Generate expanded grid
        const newGrid = []
        for (let r = 0; r < nextSize; r++) {
          const row = []
          for (let c = 0; c < nextSize; c++) {
            if (r < currentSize && c < currentSize) {
              row.push(grid[r][c])
            } else {
              row.push({ type: 'turf', baseType: 'turf' })
            }
          }
          newGrid.push(row)
        }

        set({
          grid: newGrid,
          inventory: newInventory
        })
        return true
      },

      growCrops: () => {
        const { grid } = get()
        let grown = false

        const newGrid = grid.map((row) => 
          row.map((tile) => {
            if (tile.type === 'seedling' || tile.type === 'growing') {
              const cropType = tile.crop || 'wheat'
              const speed = CROPS[cropType]?.growthSpeed || 10
              const currentProgress = tile.progress !== undefined ? tile.progress : (tile.type === 'growing' ? 50 : 0)
              const newProgress = Math.min(100, currentProgress + speed)

              let newType = tile.type
              if (newProgress >= 100) {
                newType = 'ripe'
              } else if (newProgress >= 40) {
                newType = 'growing'
              }

              grown = true
              return { ...tile, type: newType, progress: newProgress }
            }
            return tile
          })
        )

        if (grown) {
          set({ grid: newGrid })
        }
      },

      resetGame: () => set({
        wheat: 0,
        xp: 0,
        energy: 100,
        maxEnergy: 100,
        droneSpeedMultiplier: 1.0,
        inventory: {
          wheat: 0,
          carrot: 0,
          beetroot: 0,
          potato: 0,
          watermelon: 0,
          grass: 0,
          copper_ore: 0,
          iron_ore: 0,
          crystal_ore: 0,
        },
        selectedCrop: 'wheat',
        grid: INITIAL_GRID,
        unlockedNodes: ['root', 'loops'],
        zoom: 1.0,
        droneRow: 0,
        droneCol: 0,
        droneStatus: 'idle',
        droneConsole: [],
        isHelpOpen: false
      })
    }),
    {
      name: 'rural-automation-save-v3', // Storage key name
      partialize: (state) => {
        const { droneStatus, isHelpOpen, ...rest } = state
        return rest
      }
    }
  )
)
