import { ref, computed } from 'vue'
import type { CacheOptions, CacheEvents, CacheStats, CacheEntry } from '@/services/cache/types'
import { DEFAULT_OPTIONS } from '@/services/cache/types'
import { CacheStorage } from '@/services/cache/storage'

export enum CacheEventType {
  SET = 'set',
  GET = 'get',
  DELETE = 'delete',
  CLEAR = 'clear'
}

export class CacheService {
  private cache: Map<string, CacheEntry<any>>
  private options: CacheOptions
  private cleanupIntervalId: number | null = null
  private stats: CacheStats = { hits: 0, misses: 0, sets: 0, evictions: 0 }
  private events: CacheEvents = {}
  private currentMemoryUsage = ref(0)
  private storage: CacheStorage
  private cleanupInProgress = false

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

    if (this.options.persist) {
      this.loadFromStorage()
    }

    if (this.options.autoCleanup) {
      this.startCleanupInterval()
    }
  }

  private async loadFromStorage() {
    try {
      this.cache = await this.storage.load()
      this.size.value = this.cache.size
      this.updateMemoryUsage()
    } catch (error) {
      console.error('Failed to load from storage:', error)
      this.events.onError?.(error as Error)
    }
  }

  private async saveToStorage() {
    if (!this.options.persist) return
    try {
      await this.storage.save(this.cache)
    } catch (error) {
      console.error('Failed to save to storage:', error)
      this.events.onError?.(error as Error)
    }
  }

  private updateMemoryUsage() {
    let total = 0
    for (const entry of this.cache.values()) {
      total += entry.size || this.estimateSize(entry.data)
    }
    this.currentMemoryUsage.value = total
  }

  private estimateSize(data: any): number {
    try {
      const str = JSON.stringify(data)
      return new Blob([str]).size
    } catch {
      return 0
    }
  }

  private startCleanupInterval() {
    if (this.cleanupIntervalId) return
    this.cleanupIntervalId = window.setInterval(() => {
      if (this.cleanupInProgress) return
      this.cleanupInProgress = true
      this.cleanup()
      this.cleanupInProgress = false
    }, this.options.cleanupInterval || 60000)
  }

  private async cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        await this.delete(key)
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key)
    if (!entry) {
      this.stats.misses++
      return null
    }
    if (Date.now() > entry.expiresAt) {
      await this.delete(key)
      this.stats.misses++
      return null
    }
    entry.lastAccessed = Date.now()
    this.stats.hits++
    return entry.data
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const now = Date.now()
    const expiresAt = now + (ttl || this.options.ttl!)
    const size = this.estimateSize(data)
    this.cache.set(key, {
      data,
      expiresAt,
      timestamp: now,
      lastAccessed: now,
      size
    })
    this.size.value = this.cache.size
    this.stats.sets++
    this.updateMemoryUsage()
    if (this.options.persist) {
      await this.saveToStorage()
    }
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key)
    this.size.value = this.cache.size
    this.updateMemoryUsage()
    if (this.options.persist) {
      await this.saveToStorage()
    }
  }

  async clear(): Promise<void> {
    this.cache.clear()
    this.size.value = 0
    this.currentMemoryUsage.value = 0
    if (this.options.persist) {
      await this.saveToStorage()
    }
  }

  getStats(): CacheStats {
    return { ...this.stats }
  }
}

export const cacheService = new CacheService({
  ttl: 5 * 60 * 1000, // 5 minutes
  persist: true,
  autoCleanup: true,
  cleanupInterval: 60000 // 1 minute
}) 