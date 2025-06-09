import { api } from '@/api'
import { cacheService } from './cache/CacheService'

interface CacheConfig {
  ttl?: number
  key?: string
  forceRefresh?: boolean
  invalidatePrefix?: string // If set, invalidate all cache keys with this prefix after mutation
}

export class CachedApiService {
  private api = api

  /**
   * Generate a cache key for an API request, with stable param ordering
   */
  private generateCacheKey(endpoint: string, params?: any): string {
    if (!params) return `api:${endpoint}`
    
    // Sort params to ensure consistent cache keys
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        if (params[key] !== undefined) {
          acc[key] = params[key]
        }
        return acc
      }, {} as Record<string, any>)

    return `api:${endpoint}:${JSON.stringify(sortedParams)}`
  }

  /**
   * Make a cached GET request
   */
  async get<T>(url: string, params: Record<string, any> = {}, options: CacheConfig = {}): Promise<T> {
    const cacheKey = options.key || this.generateCacheKey(url, params)
    console.log('Cache request:', { url, params, cacheKey, options })

    try {
      // If forceRefresh is true, skip cache
      if (options.forceRefresh) {
        console.log('Force refresh requested, skipping cache')
        const response = await this.fetchFromApi<T>(url, params)
        await this.set(cacheKey, response, options.ttl)
        return response
      }

      // Try to get from cache first
      const cached = await this.getFromCache<T>(cacheKey)
      if (cached) {
        console.log('Cache hit:', cacheKey)
        return cached
      }

      console.log('Cache miss:', cacheKey)
      const response = await this.fetchFromApi<T>(url, params)
      await this.set(cacheKey, response, options.ttl)
      return response
    } catch (error) {
      console.error('Cache operation failed:', error)
      // On cache error, try direct API call
      return this.fetchFromApi<T>(url, params)
    }
  }

  private async fetchFromApi<T>(url: string, params: Record<string, any>): Promise<T> {
    console.log('Fetching from API:', { url, params })
    try {
      const response = await this.api.get<{ data: T }>(url, { params })
      console.log('Raw API response:', response.data)
      // Handle the server's response format
      if (response.data && 'data' in response.data) {
        return response.data.data
      }
      return response.data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  /**
   * POST with optional cache invalidation by prefix
   */
  async post<T>(endpoint: string, data?: any, config?: CacheConfig): Promise<T> {
    const response = await api.post(endpoint, data)
    if (config?.invalidatePrefix) {
      cacheService.deleteByPrefix(config.invalidatePrefix)
    }
    return response.data
  }

  /**
   * PUT with optional cache invalidation by prefix
   */
  async put<T>(endpoint: string, data?: any, config?: CacheConfig): Promise<T> {
    const response = await api.put(endpoint, data)
    if (config?.invalidatePrefix) {
      cacheService.deleteByPrefix(config.invalidatePrefix)
    }
    return response.data
  }

  /**
   * DELETE with optional cache invalidation by prefix
   */
  async delete<T>(endpoint: string, config?: CacheConfig): Promise<T> {
    const response = await api.delete(endpoint)
    if (config?.invalidatePrefix) {
      cacheService.deleteByPrefix(config.invalidatePrefix)
    }
    return response.data
  }

  /**
   * Invalidate cache for a specific endpoint
   */
  invalidateCache(endpoint: string, params?: any): void {
    const cacheKey = this.generateCacheKey(endpoint, params)
    cacheService.delete(cacheKey)
  }

  /**
   * Invalidate all cache entries for an endpoint (by prefix)
   */
  invalidateByPrefix(endpoint: string): void {
    const prefix = `api:${endpoint}`
    cacheService.deleteByPrefix(prefix)
  }

  /**
   * Invalidate all cache
   */
  invalidateAllCache(): void {
    cacheService.clear()
  }

  private async getFromCache<T>(cacheKey: string): Promise<T | null> {
    return await cacheService.get(cacheKey)
  }

  private async set(cacheKey: string, data: any, ttl?: number): Promise<void> {
    await cacheService.set(cacheKey, data, ttl)
  }
}

// Create a singleton instance
export const cachedApi = new CachedApiService()

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