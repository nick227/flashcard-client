import { ref, computed } from 'vue'
import type { CacheEntry, CacheOptions, CacheEvents, CacheStats } from './types'
import { DEFAULT_OPTIONS } from './types'
import { CacheStorage } from './storage'
import { BatchManager } from './batching'

const MEMORY_WARNING_THRESHOLD = 0.8 // 80% of max memory
const STORAGE_RETRY_ATTEMPTS = 3
const STORAGE_RETRY_DELAY = 1000 // 1 second
const BATCH_TIMEOUT = 30000 // 30 seconds
const CLEANUP_BATCH_SIZE = 100

let isVueReady = false

// Initialize Vue readiness check
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    isVueReady = true
  })
}

export class CacheService {
  private cache: Map<string, CacheEntry<any>>
  private options: CacheOptions
  private cleanupIntervalId: number | null = null
  private stats: CacheStats = { hits: 0, misses: 0, sets: 0, evictions: 0 }
  private requestQueue: Map<string, Promise<any>> = new Map()
  private batchQueue: Map<string, Array<() => Promise<any>>> = new Map()
  private batchTimeouts: Map<string, number> = new Map()
  private events: CacheEvents = {}
  private currentMemoryUsage = ref(0)
  private storage: CacheStorage
  private batchManager: BatchManager
  private locks: Map<string, Promise<void>> = new Map()
  private cleanupInProgress = false
  private initialized = false

  // Vue reactive properties
  public readonly size = ref(0)
  public readonly memoryUsage = computed(() => this.currentMemoryUsage.value)
  public readonly hitRate = computed(() => {
    const total = this.stats.hits + this.stats.misses
    return total > 0 ? this.stats.hits / total : 0
  })

  constructor(options: CacheOptions = {}, events: CacheEvents = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
    this.events = events
    this.cache = new Map()
    this.storage = new CacheStorage(this.options)
    this.batchManager = new BatchManager({
      ...this.options,
      timeout: BATCH_TIMEOUT
    })

    // Initialize after Vue is ready
    if (typeof window !== 'undefined') {
      if (isVueReady) {
        this.initialize()
      } else {
        window.addEventListener('load', () => this.initialize())
      }
    }
  }

  private async initialize() {
    if (this.initialized) return
    this.initialized = true

    try {
      if (this.options.persist) {
        await this.loadFromStorage()
      }

      if (this.options.autoCleanup) {
        this.startCleanupInterval()
      }

      // Monitor memory pressure
      if (typeof performance !== 'undefined' && performance.memory) {
        setInterval(() => this.checkMemoryPressure(), 60000) // Check every minute
      }
    } catch (error) {
      console.error('[Cache] Initialization error:', error)
      this.events.onError?.(error as Error)
    }
  }

  private async loadFromStorage() {
    try {
      this.cache = await this.storage.load()
      this.size.value = this.cache.size
      this.updateMemoryUsage()
    } catch (error) {
      console.error('[Cache] Failed to load from storage:', error)
      this.events.onError?.(error as Error)
    }
  }

  private async saveToStorage() {
    if (!this.options.persist) return

    let attempts = 0
    while (attempts < STORAGE_RETRY_ATTEMPTS) {
      try {
        await this.storage.save(this.cache)
        return
      } catch (error) {
        attempts++
        if (attempts === STORAGE_RETRY_ATTEMPTS) {
          console.error('[Cache] Failed to save to storage after retries:', error)
          this.events.onError?.(error as Error)
          return
        }
        await new Promise(resolve => setTimeout(resolve, STORAGE_RETRY_DELAY))
      }
    }
  }

  private updateMemoryUsage() {
    let total = 0
    for (const entry of this.cache.values()) {
      total += entry.size || 0
    }
    this.currentMemoryUsage.value = total
    this.checkMemoryPressure()
  }

  private checkMemoryPressure() {
    if (typeof performance !== 'undefined' && performance.memory) {
      const usedHeap = performance.memory.usedJSHeapSize
      const totalHeap = performance.memory.totalJSHeapSize
      const memoryPressure = usedHeap / totalHeap

      if (memoryPressure > MEMORY_WARNING_THRESHOLD) {
        console.warn('[Cache] High memory pressure detected:', memoryPressure)
        this.events.onMemoryPressure?.(memoryPressure)
        this.evictLRU(Math.ceil(this.cache.size * 0.1)) // Evict 10% of entries
      }
    }
  }

  private estimateSize(data: any): number {
    try {
      const str = JSON.stringify(data)
      return new Blob([str]).size
    } catch {
      return 0
    }
  }

  private async acquireLock(key: string): Promise<void> {
    while (this.locks.has(key)) {
      await this.locks.get(key)
    }
    this.locks.set(key, new Promise(resolve => {
      setTimeout(() => {
        this.locks.delete(key)
        resolve()
      }, 5000) // 5 second timeout to prevent deadlocks
    }))
  }

  private releaseLock(key: string): void {
    this.locks.delete(key)
  }

  async get<T>(key: string): Promise<T | null> {
    await this.acquireLock(key)
    try {
      const entry = this.cache.get(key)
      if (!entry) {
        this.stats.misses++
        if (this.options.logging) console.log(`[Cache] MISS: ${key}`)
        return null
      }
      if (Date.now() > entry.expiresAt) {
        this.cache.delete(key)
        this.stats.misses++
        this.events.onExpire?.(key)
        if (this.options.logging) console.log(`[Cache] EXPIRED: ${key}`)
        return null
      }
      entry.lastAccessed = Date.now()
      this.stats.hits++
      if (this.options.logging) console.log(`[Cache] HIT: ${key}`)
      return entry.data
    } finally {
      this.releaseLock(key)
    }
  }

  private getBatchKey(key: string): string {
    try {
      // Extract the base resource and action from the key
      const match = key.match(/^([^|]+)\|get\|\/([^\/]+)(?:\/batch\/([^\/]+))?/)
      if (!match) return key
      
      const [, , resource, action] = match
      
      // For batch operations, use the full key
      if (action) return key
      
      // For main resources, batch by resource
      return resource
    } catch (error) {
      console.warn('Error in getBatchKey for key:', key, error)
      return key
    }
  }

  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
    await this.acquireLock(key)
    try {
      const cached = await this.get<T>(key)
      if (cached) {
        return cached
      }

      // Check if there's already a pending request
      if (this.requestQueue.has(key)) {
        if (this.options.logging) console.log(`[Cache] QUEUED: ${key}`)
        return this.requestQueue.get(key) as Promise<T>
      }

      // Handle batching
      if (this.options.batchWindow && this.options.batchWindow > 0) {
        const batchKey = this.getBatchKey(key)
        
        // If the batch key is the same as the original key, don't batch
        if (batchKey === key) {
          const request = fetcher().then(async data => {
            await this.set(key, data, ttl)
            this.requestQueue.delete(key)
            return data
          }).catch(async (error: any) => {
            this.requestQueue.delete(key)
            throw error
          })
          this.requestQueue.set(key, request)
          return request
        }
        
        // Add to batch queue
        if (!this.batchQueue.has(batchKey)) {
          this.batchQueue.set(batchKey, [])
        }
        
        const batchPromise = new Promise<T>((resolve, reject) => {
          this.batchQueue.get(batchKey)!.push(async () => {
            try {
              const result = await fetcher()
              await this.set(key, result, ttl)
              resolve(result)
              return result
            } catch (error: any) {
              if (error?.__CANCEL__ && error?.promise) {
                try {
                  const result = await error.promise
                  await this.set(key, result.data, ttl)
                  resolve(result.data)
                  return result.data
                } catch (innerError) {
                  reject(innerError)
                  throw innerError
                }
              }
              reject(error)
              throw error
            }
          })
        })

        // Set up batch timeout if not already set
        if (!this.batchTimeouts.has(batchKey)) {
          const timeoutId = window.setTimeout(async () => {
            try {
              await this.processBatch<T>(batchKey)
            } catch (error) {
              console.error('[Cache] Batch processing error:', error)
              this.events.onError?.(error as Error)
            }
          }, this.options.batchWindow)
          this.batchTimeouts.set(batchKey, timeoutId)
        }

        // Process batch immediately if it's full or if it's a bulk operation
        const batch = this.batchQueue.get(batchKey)!
        if (batch.length >= (this.options.maxBatchSize || 10) || batchKey.includes('bulk')) {
          return this.processBatch<T>(batchKey)
        }

        return batchPromise
      }

      // Handle single request
      const request = fetcher().then(async data => {
        await this.set(key, data, ttl)
        this.requestQueue.delete(key)
        return data
      }).catch(async (error: any) => {
        if (error?.__CANCEL__ && error?.promise) {
          try {
            const result = await error.promise
            await this.set(key, result.data, ttl)
            this.requestQueue.delete(key)
            return result.data
          } catch (innerError) {
            this.requestQueue.delete(key)
            throw innerError
          }
        }
        this.requestQueue.delete(key)
        throw error
      })

      this.requestQueue.set(key, request)
      return request
    } finally {
      this.releaseLock(key)
    }
  }

  private async processBatch<T>(batchKey: string): Promise<T> {
    const batch = this.batchQueue.get(batchKey)
    if (!batch || batch.length === 0) {
      throw new Error('No batch to process')
    }

    // Clear the batch queue and timeout
    this.batchQueue.delete(batchKey)
    if (this.batchTimeouts.has(batchKey)) {
      clearTimeout(this.batchTimeouts.get(batchKey)!)
      this.batchTimeouts.delete(batchKey)
    }

    // Execute all requests in the batch
    const results = await Promise.all(batch.map(fn => fn()))
    
    // For bulk operations, merge the results
    if (batchKey.includes('bulk')) {
      return this.mergeBulkResults(results as Array<Record<string, any>>) as T
    }
    
    return results[0] // Return the first result for non-bulk operations
  }

  private mergeBulkResults(results: Array<Record<string, any>>): Record<string, any> {
    if (results.length === 0) return {}
    
    // Merge bulk results (assuming they're objects with numeric keys)
    return results.reduce((merged, result) => {
      if (typeof result === 'object' && result !== null) {
        Object.assign(merged, result)
      }
      return merged
    }, {})
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    await this.acquireLock(key)
    try {
      const now = Date.now()
      const expiresAt = now + (ttl || this.options.ttl!)
      const size = this.estimateSize(data)

      if (this.currentMemoryUsage.value + size > (this.options.maxMemoryBytes || Infinity)) {
        await this.evictLRU()
      }

      this.cache.set(key, {
        data,
        timestamp: now,
        expiresAt,
        lastAccessed: now,
        size
      })

      this.currentMemoryUsage.value += size
      this.size.value = this.cache.size
      this.stats.sets++
      
      if (this.options.logging) {
        console.log(`[Cache] SET: ${key} (${size} bytes)`)
      }
      
      this.events.onSet?.(key, data)

      if (this.options.persist) {
        await this.saveToStorage()
      }
    } finally {
      this.releaseLock(key)
    }
  }

  async delete(key: string): Promise<void> {
    await this.acquireLock(key)
    try {
      const entry = this.cache.get(key)
      if (entry) {
        this.currentMemoryUsage.value -= (entry.size || 0)
        this.cache.delete(key)
        this.size.value = this.cache.size
        this.events.onDelete?.(key)
        if (this.options.logging) console.log(`[Cache] DELETE: ${key}`)
      }
    } finally {
      this.releaseLock(key)
    }
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    const keys = Array.from(this.cache.keys()).filter(key => key.startsWith(prefix))
    for (const key of keys) {
      await this.delete(key)
    }
  }

  async clear(): Promise<void> {
    this.cache.clear()
    this.currentMemoryUsage.value = 0
    this.size.value = 0
    await this.batchManager.clearAllBatches()
    if (this.options.logging) console.log('[Cache] CLEAR: All entries')
  }

  private async evictLRU(count: number = 1): Promise<void> {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)
      .slice(0, count)

    for (const [key, entry] of entries) {
      await this.acquireLock(key)
      try {
        this.currentMemoryUsage.value -= (entry.size || 0)
        this.cache.delete(key)
        this.stats.evictions++
        this.events.onEvict?.(key, 'size')
        if (this.options.logging) console.log(`[Cache] EVICT LRU: ${key} (${entry.size} bytes)`)
      } finally {
        this.releaseLock(key)
      }
    }
  }

  private startCleanupInterval(): void {
    if (this.cleanupIntervalId) return
    const interval = this.options.cleanupInterval || DEFAULT_OPTIONS.cleanupInterval
    this.cleanupIntervalId = window.setInterval(() => {
      if (this.cleanupInProgress) return
      this.cleanupInProgress = true

      try {
        const now = Date.now()
        const entries = Array.from(this.cache.entries())
        let count = 0

        for (let i = 0; i < entries.length; i += CLEANUP_BATCH_SIZE) {
          const batch = entries.slice(i, i + CLEANUP_BATCH_SIZE)
          for (const [key, entry] of batch) {
            if (now > entry.expiresAt) {
              this.delete(key)
              count++
            }
          }
          // Allow other operations between batches
          setTimeout(() => {}, 0)
        }

        if (count > 0 && this.options.logging) {
          console.log(`[Cache] CLEANUP: Removed ${count} expired entries`)
        }
      } finally {
        this.cleanupInProgress = false
      }
    }, interval)
  }

  stopCleanupInterval(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId)
      this.cleanupIntervalId = null
    }
  }

  getStats(): CacheStats {
    return { ...this.stats }
  }

  setLogging(enabled: boolean): void {
    this.options.logging = enabled
  }
}

/**
 * Singleton instance for app-wide use
 */
export const cacheService = new CacheService({
  ttl: 5 * 60 * 1000,
  maxSize: 1000,
  autoCleanup: true,
  cleanupInterval: 60 * 1000,
  logging: true,
  batchWindow: 50,
  persist: true,
  storageType: 'localStorage',
  maxMemoryBytes: 50 * 1024 * 1024
}, {
  onEvict: (key, reason) => {
    console.log(`[Cache] Entry evicted: ${key} (${reason})`)
  },
  onExpire: (key) => {
    console.log(`[Cache] Entry expired: ${key}`)
  },
  onError: (error) => {
    console.error('[Cache] Error:', error)
  },
  onMemoryPressure: (pressure) => {
    console.warn('[Cache] Memory pressure:', pressure)
  },
  onCacheHit: (key) => {
    console.log(`[Cache] Hit: ${key}`)
  },
  onCacheMiss: (key) => {
    console.log(`[Cache] Miss: ${key}`)
  }
})