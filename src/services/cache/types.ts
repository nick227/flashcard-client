export interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
  lastAccessed: number
  size?: number
}

export interface CacheOptions {
  /** Time to live in milliseconds */
  ttl?: number
  /** Maximum number of entries */
  maxSize?: number
  /** Whether to automatically clean up expired entries */
  autoCleanup?: boolean
  /** Cleanup interval in ms (optional) */
  cleanupInterval?: number
  /** Enable cache hit/miss logging */
  logging?: boolean
  /** Batch window in ms for similar requests */
  batchWindow?: number
  /** Maximum batch size for similar requests */
  maxBatchSize?: number
  /** Whether to persist cache to storage */
  persist?: boolean
  /** Storage type to use for persistence */
  storageType?: 'localStorage' | 'indexedDB'
  /** Maximum size in bytes before eviction */
  maxMemoryBytes?: number
  timeout?: number
}

export interface CacheEvents {
  onGet?: (key: string, data: any) => void
  onSet?: (key: string, data: any) => void
  onDelete?: (key: string) => void
  onClear?: () => void
  onExpire?: (key: string) => void
  onEvict?: (key: string, reason: string) => void
  onError?: (error: Error) => void
  onMemoryPressure?: (pressure: number) => void
  onCacheHit?: (key: string, data: any) => void
  onCacheMiss?: (key: string, data: any) => void
}

export interface CacheStats {
  hits: number
  misses: number
  sets: number
  evictions: number
}

export interface BatchEntry<T> {
  fetcher: () => Promise<T>
  resolve: (value: T) => void
  reject: (error: any) => void
}

export const DEFAULT_OPTIONS: CacheOptions = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000,
  autoCleanup: true,
  cleanupInterval: 60 * 1000, // 1 minute
  logging: false,
  batchWindow: 50,
  persist: false,
  storageType: 'localStorage',
  maxMemoryBytes: 50 * 1024 * 1024, // 50MB
  timeout: 30000 // 30 seconds
}

// Extend Performance interface to include memory property
declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number
      totalJSHeapSize: number
      jsHeapSizeLimit: number
    }
  }
}

export interface CacheService {
  get<T>(key: string): T | null
  set<T>(key: string, data: T, ttl?: number): void
  getOrSet<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T>
  delete(key: string): void
  deleteByPrefix(prefix: string): void
  clear(): void
  getStats(): CacheStats
  setLogging(enabled: boolean): void
  stopCleanupInterval(): void
  readonly size: { value: number }
  readonly memoryUsage: { value: number }
  readonly hitRate: { value: number }
} 