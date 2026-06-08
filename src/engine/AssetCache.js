/**
 * IndexedDB wrapper for caching game image assets as Blobs.
 * Uses localStorage for lightweight version tracking.
 */

const DB_NAME = 'RuralAutomationAssets'
const STORE_NAME = 'images'
const VERSION_KEY = 'ra_asset_version'
const DB_VERSION = 1

/**
 * Opens (or creates) the IndexedDB database.
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Returns the cached asset version string from localStorage, or null.
 */
export function getCachedVersion() {
  try {
    return localStorage.getItem(VERSION_KEY)
  } catch {
    return null
  }
}

/**
 * Stores the asset version string in localStorage.
 */
export function setCachedVersion(version) {
  try {
    localStorage.setItem(VERSION_KEY, version)
  } catch (e) {
    console.warn('Failed to save asset version to localStorage:', e)
  }
}

/**
 * Retrieves multiple cached blobs by their keys from IndexedDB.
 * @param {string[]} keys - Array of asset path keys
 * @returns {Promise<Object>} Map of { key → Blob | null }
 */
export async function getAllCached(keys) {
  const db = await openDB()
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const results = {}
    let completed = 0

    if (keys.length === 0) {
      resolve(results)
      return
    }

    keys.forEach((key) => {
      const req = store.get(key)
      req.onsuccess = () => {
        results[key] = req.result || null
        completed++
        if (completed === keys.length) resolve(results)
      }
      req.onerror = () => {
        results[key] = null
        completed++
        if (completed === keys.length) resolve(results)
      }
    })
  })
}

/**
 * Stores multiple blobs into IndexedDB.
 * @param {{ key: string, blob: Blob }[]} entries
 */
export async function putAllCached(entries) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    entries.forEach(({ key, blob }) => {
      store.put(blob, key)
    })

    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * Wipes all cached assets from IndexedDB.
 */
export async function clearAllCached() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.clear()
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}
