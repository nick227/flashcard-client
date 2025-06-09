import type { CacheEntry, CacheOptions } from './types'

export class CacheStorage {
  constructor(private options: CacheOptions) {}

  async load(): Promise<Map<string, CacheEntry<any>>> {
    try {
      if (this.options.storageType === 'localStorage') {
        return this.loadFromLocalStorage()
      } else if (this.options.storageType === 'indexedDB') {
        return this.loadFromIndexedDB()
      }
    } catch (error) {
      console.error('Failed to load cache from storage:', error)
    }
    return new Map()
  }

  async save(cache: Map<string, CacheEntry<any>>): Promise<void> {
    if (!this.options.persist) return

    try {
      if (this.options.storageType === 'localStorage') {
        this.saveToLocalStorage(cache)
      } else if (this.options.storageType === 'indexedDB') {
        await this.saveToIndexedDB(cache)
      }
    } catch (error) {
      console.error('Failed to save cache to storage:', error)
    }
  }

  private loadFromLocalStorage(): Map<string, CacheEntry<any>> {
    const stored = localStorage.getItem('cache')
    if (!stored) return new Map()

    const data = JSON.parse(stored)
    const cache = new Map()
    
    for (const [key, entry] of Object.entries(data)) {
      if (Date.now() <= (entry as CacheEntry<any>).expiresAt) {
        cache.set(key, entry as CacheEntry<any>)
      }
    }
    
    return cache
  }

  private saveToLocalStorage(cache: Map<string, CacheEntry<any>>): void {
    const data = Object.fromEntries(cache)
    localStorage.setItem('cache', JSON.stringify(data))
  }

  private async loadFromIndexedDB(): Promise<Map<string, CacheEntry<any>>> {
    const db = await this.openIndexedDB()
    const tx = db.transaction('cache', 'readonly')
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
    const db = await this.openIndexedDB()
    const tx = db.transaction('cache', 'readwrite')
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
} 