/**
 * Assets and Crops Configuration File.
 * Modify this file to add/remove crop types, update image paths, adjust stages, 
 * or change game parameters (XP rewards and Energy costs).
 */

export const BASE_ASSETS = {
  turf: {
    path: '/assets/farm_tiles/grass.png',
  },
  soil: {
    path: '/assets/farm_tiles/tilled_soil.png',
  },
  drone: {
    path: '/assets/drone_32.png',
    cropRect: { x: 0, y: 0, width: 1000, height: 1000 },
  },
  rock: {
    path: '/assets/farm_tiles/rock_block.png',
  },
  copper_ore: {
    path: '/assets/farm_tiles/copper_ore.png',
  },
  iron_ore: {
    path: '/assets/farm_tiles/iron_ore.png',
  },
  crystal_ore: {
    path: '/assets/farm_tiles/crystal_ore_soil.png',
  }
}

export const CROPS = {
  wheat: {
    displayName: 'Wheat',
    xpReward: 50,
    energyCost: 5,
    growthSpeed: 20, // 20% progress per tick (matures in 5 ticks / 10 seconds)
    stages: {
      seedling: '/assets/farm_tiles/wheat_seeded.png',
      growing: '/assets/farm_tiles/wheat_growing_2.png',
      ripe: '/assets/farm_tiles/wheat_ready.png',
    }
  },
  carrot: {
    displayName: 'Carrot',
    xpReward: 100,
    energyCost: 8,
    growthSpeed: 12, // 12% progress per tick (matures in 9 ticks / 18 seconds)
    stages: {
      seedling: '/assets/farm_tiles/carrot_seeded.png',
      growing: '/assets/farm_tiles/carrot_growing_2.png',
      ripe: '/assets/farm_tiles/carrot_ready.png',
    }
  },
  beetroot: {
    displayName: 'Beetroot',
    xpReward: 150,
    energyCost: 12,
    growthSpeed: 8, // 8% progress per tick (matures in 13 ticks / 26 seconds)
    stages: {
      seedling: '/assets/farm_tiles/beetroot_seeded.png',
      growing: '/assets/farm_tiles/beetroot_growing_2.png',
      ripe: '/assets/farm_tiles/beetroot_ready.png',
    }
  },
  potato: {
    displayName: 'Potato',
    xpReward: 200,
    energyCost: 15,
    growthSpeed: 6, // 6% progress per tick (matures in 17 ticks / 34 seconds)
    stages: {
      seedling: '/assets/farm_tiles/potato_growing_1.png',
      growing: '/assets/farm_tiles/potato_growing_2.png',
      ripe: '/assets/farm_tiles/potato_ready.png',
    }
  },
  watermelon: {
    displayName: 'Watermelon',
    xpReward: 300,
    energyCost: 25,
    growthSpeed: 4, // 4% progress per tick (matures in 25 ticks / 50 seconds)
    stages: {
      seedling: '/assets/farm_tiles/watermelon_growing_2.png',
      growing: '/assets/farm_tiles/watermelon_growing.png',
      ripe: '/assets/farm_tiles/watermelon_ready.png',
    }
  },
  grass: {
    displayName: 'Grass',
    xpReward: 30,
    energyCost: 3,
    growthSpeed: 25, // 25% progress per tick (matures in 4 ticks / 8 seconds)
    stages: {
      seedling: '/assets/farm_tiles/freshly_tilled.png',
      growing: '/assets/farm_tiles/dust_soil.png',
      ripe: '/assets/farm_tiles/grass.png',
    }
  }
}

export const EXPANSION_COSTS = {
  4: { wheat: 10 },
  5: { wheat: 10, carrot: 10 },
  6: { wheat: 10, carrot: 10, beetroot: 10 }
}
