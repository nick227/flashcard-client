import { api } from '@/api'
import { cacheService } from '@/plugins/cache'

interface CacheConfig {
  ttl?: number
  key?: string
  invalidatePrefix?: string
}

export class CachedApiService {
  private baseUrl: string
  private defaultTTL: number

  constructor(baseUrl: string, defaultTTL: number = 5 * 60 * 1000) {
    this.baseUrl = baseUrl
    this.defaultTTL = defaultTTL
  }

  private getCacheKey(endpoint: string, params?: any): string {
    const key = params ? `${endpoint}|${JSON.stringify(params)}` : endpoint
    return `${this.baseUrl}|${key}`
  }

  async get<T>(endpoint: string, params?: any, config: CacheConfig = {}): Promise<T> {
    const cacheKey = config.key || this.getCacheKey(endpoint, params)
    const cached = await this.getFromCache<T>(cacheKey)
    if (cached) return cached

    const response = await api.get<T>(`${this.baseUrl}${endpoint}`, { params })
    await this.setInCache(cacheKey, response.data, config.ttl || this.defaultTTL)
    return response.data
  }

  async post<T>(endpoint: string, data: any, config: CacheConfig = {}): Promise<T> {
    const response = await api.post<T>(`${this.baseUrl}${endpoint}`, data)
    if (config.invalidatePrefix) {
      cacheService.deleteByPrefix(config.invalidatePrefix)
    }
    return response.data
  }

  async put<T>(endpoint: string, data: any, config: CacheConfig = {}): Promise<T> {
    const response = await api.put<T>(`${this.baseUrl}${endpoint}`, data)
    if (config.invalidatePrefix) {
      cacheService.deleteByPrefix(config.invalidatePrefix)
    }
    return response.data
  }

  async patch<T>(endpoint: string, data: any, config: CacheConfig = {}): Promise<T> {
    const response = await api.patch<T>(`${this.baseUrl}${endpoint}`, data)
    if (config.invalidatePrefix) {
      cacheService.deleteByPrefix(config.invalidatePrefix)
    }
    return response.data
  }

  async delete(endpoint: string, config: CacheConfig = {}): Promise<void> {
    await api.delete(`${this.baseUrl}${endpoint}`)
    if (config.invalidatePrefix) {
      cacheService.deleteByPrefix(config.invalidatePrefix)
    }
  }

  async invalidateCache(key: string): Promise<void> {
    cacheService.delete(key)
  }

  async invalidateCacheByPrefix(prefix: string): Promise<void> {
    cacheService.deleteByPrefix(prefix)
  }

  async clearCache(): Promise<void> {
    cacheService.clear()
  }

  private async getFromCache<T>(cacheKey: string): Promise<T | null> {
    return await cacheService.get(cacheKey)
  }

  private async setInCache<T>(cacheKey: string, data: T, ttl: number): Promise<void> {
    await cacheService.set(cacheKey, data, ttl)
  }
}

// Create a singleton instance
export const cachedApi = new CachedApiService('/api')

// Pre-configured cached API methods for common endpoints
export const cachedApiEndpoints = {
  // Categories
  getCategories: (inUseOnly = false) => 
    cachedApi.get('/categories', { inUse: inUseOnly ? 'true' : undefined }, {
      ttl: 5 * 60 * 1000, // 5 minutes
      key: `categories:${inUseOnly}`
    }),

  // Tags
  getTags: () => 
    cachedApi.get('/tags', undefined, {
      ttl: 5 * 60 * 1000, // 5 minutes
      key: 'tags'
    }),

  // Set cards
  getSetCards: (setId: number) => 
    cachedApi.get(`/sets/${setId}/cards`, undefined, {
      ttl: 5 * 60 * 1000, // 5 minutes
      key: `set:${setId}:cards`
    }),

  // Batch set cards
  getBatchSetCards: (setIds: number[]) => 
    cachedApi.get('/sets/batch/cards', { ids: setIds.join(',') }, {
      ttl: 5 * 60 * 1000, // 5 minutes
      key: `sets:batch:cards:${setIds.join(',')}`
    }),

  // Batch set views
  getBatchSetViews: (setIds: number[]) => 
    cachedApi.get('/sets/batch/views', { ids: setIds.join(',') }, {
      ttl: 5 * 60 * 1000, // 5 minutes
      key: `sets:batch:views:${setIds.join(',')}`
    }),

  // Batch set likes
  getBatchSetLikes: (setIds: number[]) => 
    cachedApi.get('/sets/batch/likes', { ids: setIds.join(',') }, {
      ttl: 5 * 60 * 1000, // 5 minutes
      key: `sets:batch:likes:${setIds.join(',')}`
    }),

  // User likes
  getUserLikes: (userId: number) => 
    cachedApi.get(`/users/${userId}/likes`, undefined, {
      ttl: 60 * 1000, // 1 minute
      key: `user:${userId}:likes`
    }),

  // User purchases
  getUserPurchases: (userId: number) => 
    cachedApi.get(`/users/${userId}/purchases`, undefined, {
      ttl: 5 * 60 * 1000, // 5 minutes
      key: `user:${userId}:purchases`
    })
} 