/**
 * Asset Loading Orchestrator.
 * 
 * Collects all image paths from the game config, checks the IndexedDB cache,
 * fetches missing/outdated assets from the server, and provides Object URLs
 * for instant use by PixiFarmCanvas and other components.
 */

import { BASE_ASSETS, CROPS, ASSET_VERSION } from '../config/assetsConfig.js'
import {
  getCachedVersion,
  setCachedVersion,
  getAllCached,
  putAllCached,
  clearAllCached,
} from './AssetCache.js'

// Module-level map: { originalPath → blobURL }
const preloadedUrls = new Map()

/**
 * Returns the preloaded blob URL for a given asset path,
 * or falls back to the original path if not preloaded.
 * @param {string} path - Original asset path (e.g. '/assets/farm_tiles/grass.png')
 * @returns {string} Blob URL or original path
 */
export function getAssetUrl(path) {
  return preloadedUrls.get(path) || path
}

/**
 * Collects all unique image paths from BASE_ASSETS and CROPS config.
 * @returns {string[]}
 */
function collectAllAssetPaths() {
  const paths = new Set()

  // Base tile and drone assets
  for (const asset of Object.values(BASE_ASSETS)) {
    if (asset.path) paths.add(asset.path)
  }

  // Crop growth stage images
  for (const crop of Object.values(CROPS)) {
    if (crop.stages) {
      Object.values(crop.stages).forEach((p) => paths.add(p))
    }
  }

  return Array.from(paths)
}

/**
 * Preloads fonts used by the game to avoid Flash of Unstyled Text (FOUT).
 */
async function preloadFonts() {
  try {
    await Promise.allSettled([
      document.fonts.load('400 16px "Hanken Grotesk"'),
      document.fonts.load('700 32px "Space Grotesk"'),
      document.fonts.load('400 14px "JetBrains Mono"'),
      document.fonts.load('400 24px "Material Symbols Outlined"'),
    ])
  } catch (e) {
    console.warn('Font preloading failed (non-critical):', e)
  }
}

/**
 * Main asset preloading function.
 * 
 * 1. Checks if the cached version matches ASSET_VERSION.
 * 2. If match → loads blobs from IndexedDB (fast path).
 * 3. If mismatch → fetches all images from server, stores in IndexedDB.
 * 4. Creates Object URLs for each asset for instant Image() loading.
 * 5. Also preloads Google Fonts during the process.
 * 
 * @param {(loaded: number, total: number, message: string) => void} onProgress
 * @returns {Promise<boolean>} true if loaded from cache, false if fresh download
 */
export async function preloadAllAssets(onProgress = () => {}) {
  const allPaths = collectAllAssetPaths()
  const total = allPaths.length
  let loaded = 0
  let fromCache = false

  const cachedVersion = getCachedVersion()
  const isVersionMatch = cachedVersion === ASSET_VERSION

  // Start font preloading in parallel (fire-and-forget)
  const fontPromise = preloadFonts()

  if (isVersionMatch) {
    // ---- FAST PATH: Load from IndexedDB cache ----
    onProgress(0, total, 'Loading cached assets...')

    try {
      const cached = await getAllCached(allPaths)
      const allHit = allPaths.every((p) => cached[p] instanceof Blob)

      if (allHit) {
        for (const path of allPaths) {
          const url = URL.createObjectURL(cached[path])
          preloadedUrls.set(path, url)
          loaded++
          onProgress(loaded, total, `Cached: ${path.split('/').pop()}`)
        }
        fromCache = true
        await fontPromise
        return fromCache
      }
    } catch (e) {
      console.warn('IndexedDB cache read failed, falling back to network:', e)
    }
  }

  // ---- SLOW PATH: Fetch from network ----
  if (!isVersionMatch && cachedVersion !== null) {
    onProgress(0, total, 'New version detected — updating assets...')
    try {
      await clearAllCached()
    } catch (e) {
      console.warn('Failed to clear old cache:', e)
    }
  } else {
    onProgress(0, total, 'Downloading assets for the first time...')
  }

  const entries = []

  for (const path of allPaths) {
    try {
      const response = await fetch(path)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const blob = await response.blob()
      entries.push({ key: path, blob })

      const url = URL.createObjectURL(blob)
      preloadedUrls.set(path, url)
    } catch (e) {
      console.warn(`Failed to fetch asset: ${path}`, e)
    }

    loaded++
    onProgress(loaded, total, `Downloaded: ${path.split('/').pop()}`)
  }

  // Store all fetched assets in IndexedDB for next time
  try {
    await putAllCached(entries)
    setCachedVersion(ASSET_VERSION)
  } catch (e) {
    console.warn('Failed to store assets in IndexedDB:', e)
  }

  await fontPromise
  return fromCache
}
