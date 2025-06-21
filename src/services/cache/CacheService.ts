import { ref, computed } from 'vue'
import type { CacheEntry, CacheOptions, CacheEvents, CacheStats } from './types'
import { DEFAULT_OPTIONS } from './types'
import { CacheStorage } from './storage'

const MEMORY_WARNING_THRESHOLD = 0.8 // 80% of max memory
const STORAGE_RETRY_ATTEMPTS = 3
const STORAGE_RETRY_DELAY = 1000 // 1 second

export class CacheService {
  private cache: Map<string, CacheEntry<any>>
  private options: CacheOptions
  private cleanupIntervalId: number | null = null
  private stats: CacheStats = { hits: 0, misses: 0, sets: 0, evictions: 0 }
  private events: CacheEvents = {}
  private storage: CacheStorage
  private cleanupInProgress = false
  private initialized = false

  // Vue reactive properties
  private readonly currentMemoryUsage = ref(0)
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
  }

  async initialize() {
    if (this.initialized) return
    this.initialized = true

    try {
      // Initialize storage first
      await this.storage.initialize()

      if (this.options.persist) {
        await this.loadFromStorage()
      }

      if (this.options.autoCleanup) {
        this.startCleanupInterval()
      }

      // Monitor memory pressure if available
      if (typeof performance !== 'undefined' && 'memory' in performance) {
        setInterval(() => this.checkMemoryPressure(), 60000) // Check every minute
      }
    } catch (error) {
      console.error('[Cache] Initialization error:', error)
      this.events.onError?.(error as Error)
      throw error // Re-throw to allow caller to handle
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

  private updateMemoryUsage() {
    let total = 0
    for (const entry of this.cache.values()) {
      total += entry.size || 0
    }
    this.currentMemoryUsage.value = total
    this.checkMemoryPressure()
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

  private checkMemoryPressure() {
    try {
      if (typeof performance !== 'undefined' && 'memory' in performance) {
        const memory = (performance as any).memory
        const usedHeap = memory.usedJSHeapSize
        const totalHeap = memory.totalJSHeapSize
        const memoryPressure = usedHeap / totalHeap

        if (memoryPressure > MEMORY_WARNING_THRESHOLD) {
          console.warn('[Cache] High memory pressure detected:', memoryPressure)
          this.events.onMemoryPressure?.(memoryPressure)
          this.evictLRU(Math.ceil(this.cache.size * 0.1)) // Evict 10% of entries
        }
      } else if (this.currentMemoryUsage.value > (this.options.maxMemoryBytes || Infinity)) {
        // Fallback to our own memory tracking if performance.memory is not available
        console.warn('[Cache] Memory limit exceeded:', this.currentMemoryUsage.value)
        this.events.onMemoryPressure?.(1)
        this.evictLRU(Math.ceil(this.cache.size * 0.1))
      }
    } catch (error) {
      console.error('[Cache] Error checking memory pressure:', error)
      // If we can't check memory pressure, be conservative and evict some entries
      if (this.cache.size > 1000) {
        this.evictLRU(Math.ceil(this.cache.size * 0.1))
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

  async get<T>(key: string): Promise<T | null> {
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
  }

  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const data = await fetcher()
    await this.set(key, data, ttl)
    return data
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
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
  }

  async delete(key: string): Promise<void> {
    const entry = this.cache.get(key)
    if (entry) {
      this.currentMemoryUsage.value -= entry.size || 0
    }
    this.cache.delete(key)
    this.size.value = this.cache.size
    if (this.options.logging) console.log(`[Cache] DELETE: ${key}`)
    if (this.options.persist) {
      await this.saveToStorage()
    }
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    const keysToDelete: string[] = []
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key)
      }
    }
    
    for (const key of keysToDelete) {
      await this.delete(key)
    }
    
    if (this.options.logging) {
      console.log(`[Cache] DELETE BY PREFIX: ${prefix} (${keysToDelete.length} entries)`)
    }
  }

  async clear(): Promise<void> {
    this.cache.clear()
    this.currentMemoryUsage.value = 0
    this.size.value = 0
    if (this.options.logging) console.log('[Cache] CLEAR: All entries')
    if (this.options.persist) {
      await this.saveToStorage()
    }
  }

  private async evictLRU(count: number = 1): Promise<void> {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
      .slice(0, count)

    for (const [key] of entries) {
      await this.delete(key)
    }

    this.stats.evictions += entries.length
    if (this.options.logging) {
      console.log(`[Cache] EVICTED: ${entries.length} entries`)
    }
  }

  private startCleanupInterval(): void {
    if (this.cleanupIntervalId) return
    
    this.cleanupIntervalId = window.setInterval(() => {
      if (this.cleanupInProgress) return
      this.cleanupInProgress = true
      this.cleanup()
      this.cleanupInProgress = false
    }, this.options.cleanupInterval || 60000)
  }

  private async cleanup(): Promise<void> {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key)
      }
    }

    for (const key of expiredKeys) {
      await this.delete(key)
    }

    if (expiredKeys.length > 0 && this.options.logging) {
      console.log(`[Cache] CLEANUP: Removed ${expiredKeys.length} expired entries`)
    }
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