import type { CacheEntry, CacheOptions } from './types'

const STORAGE_RETRY_ATTEMPTS = 3
const STORAGE_RETRY_DELAY = 1000 // 1 second

export class CacheStorage {
  private db: IDBDatabase | null = null
  private initialized = false

  constructor(private options: CacheOptions) {}

  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      if (this.options.storageType === 'indexedDB') {
        this.db = await this.openIndexedDB()
      } else if (this.options.storageType === 'localStorage') {
        // Test localStorage availability
        const testKey = '__storage_test__'
        try {
          localStorage.setItem(testKey, testKey)
          localStorage.removeItem(testKey)
        } catch (e) {
          throw new Error('localStorage is not available')
        }
      }
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize cache storage:', error)
      throw error
    }
  }

  async load(): Promise<Map<string, CacheEntry<any>>> {
    try {
      await this.initialize()

      let attempts = 0
      while (attempts < STORAGE_RETRY_ATTEMPTS) {
        try {
          if (this.options.storageType === 'localStorage') {
            return this.loadFromLocalStorage()
          } else if (this.options.storageType === 'indexedDB') {
            return await this.loadFromIndexedDB()
          }
          break
        } catch (error) {
          attempts++
          if (attempts === STORAGE_RETRY_ATTEMPTS) {
            console.error('Failed to load cache from storage after retries:', error)
            throw error // Re-throw to allow caller to handle
          }
          await new Promise(resolve => setTimeout(resolve, STORAGE_RETRY_DELAY))
        }
      }
      return new Map()
    } catch (error) {
      console.error('Failed to initialize cache storage:', error)
      // If storage initialization fails, return empty cache instead of throwing
      // This allows the app to continue working without persistence
      return new Map()
    }
  }

  async save(cache: Map<string, CacheEntry<any>>): Promise<void> {
    if (!this.options.persist) return
    await this.initialize()

    let attempts = 0
    while (attempts < STORAGE_RETRY_ATTEMPTS) {
      try {
        if (this.options.storageType === 'localStorage') {
          await this.saveToLocalStorage(cache)
          return
        } else if (this.options.storageType === 'indexedDB') {
          await this.saveToIndexedDB(cache)
          return
        }
        break
      } catch (error) {
        attempts++
        if (attempts === STORAGE_RETRY_ATTEMPTS) {
          console.error('Failed to save cache to storage after retries:', error)
          break
        }
        await new Promise(resolve => setTimeout(resolve, STORAGE_RETRY_DELAY))
      }
    }
  }

  private loadFromLocalStorage(): Map<string, CacheEntry<any>> {
    const stored = localStorage.getItem('cache')
    if (!stored) return new Map()

    try {
      const data = JSON.parse(stored)
      const cache = new Map()
      
      for (const [key, entry] of Object.entries(data)) {
        if (Date.now() <= (entry as CacheEntry<any>).expiresAt) {
          cache.set(key, entry as CacheEntry<any>)
        }
      }
      
      return cache
    } catch (error) {
      console.error('Failed to parse cache from localStorage:', error)
      return new Map()
    }
  }

  private async saveToLocalStorage(cache: Map<string, CacheEntry<any>>): Promise<void> {
    try {
      const data = Object.fromEntries(cache)
      localStorage.setItem('cache', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save cache to localStorage:', error)
      throw error
    }
  }

  private async loadFromIndexedDB(): Promise<Map<string, CacheEntry<any>>> {
    if (!this.db) throw new Error('IndexedDB not initialized')

    const tx = this.db.transaction('cache', 'readonly')
    const store = tx.objectStore('cache')
    const request = store.getAll()
    
    const entries = await new Promise<any[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    
    const cache = new Map()
    for (const entry of entries) {
      if (Date.now() <= entry.expiresAt) {
        cache.set(entry.key, entry)
      }
    }
    
    return cache
  }

  private async saveToIndexedDB(cache: Map<string, CacheEntry<any>>): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized')

    const tx = this.db.transaction('cache', 'readwrite')
    const store = tx.objectStore('cache')
    
    for (const [key, entry] of cache.entries()) {
      await store.put({ key, ...entry })
    }
  }

  private async openIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('cache', 1)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' })
        }
      }
    })
  }

  async cleanup(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
    }
    this.initialized = false
  }
} 