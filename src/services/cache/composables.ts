import { ref, computed, onUnmounted } from 'vue'
import type { CacheService } from './types'

export function useCacheStats(cache: CacheService) {
  const memoryUsage = computed(() => cache.memoryUsage.value)
  const hitRate = computed(() => cache.hitRate.value)
  const size = computed(() => cache.size.value)

  return {
    memoryUsage,
    hitRate,
    size
  }
}

interface UseCacheOptions {
  ttl?: number
  retryCount?: number
  retryDelay?: number
  forceRefresh?: boolean
}

export function useCache<T>(
  cache: CacheService, 
  key: string, 
  fetcher: () => Promise<T>,
  options: UseCacheOptions = {}
) {
  const {
    ttl,
    retryCount = 3,
    retryDelay = 1000,
    forceRefresh = false
  } = options

  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)
  let isMounted = true
  let retryTimeout: number | null = null

  const clearRetryTimeout = () => {
    if (retryTimeout !== null) {
      window.clearTimeout(retryTimeout)
      retryTimeout = null
    }
  }

  const fetch = async (force = false, attempt = 1) => {
    if (!isMounted) return
    if (!cache) {
      error.value = new Error('Cache service not available')
      loading.value = false
      return
    }

    loading.value = true
    error.value = null
    clearRetryTimeout()

    try {
      if (!force && !forceRefresh) {
        try {
          const cached = await cache.get<T>(key)
          if (cached) {
            if (isMounted) {
              data.value = cached
              loading.value = false
            }
            return
          }
        } catch (e) {
          console.error('[Cache] Failed to get cached data:', e)
          // Continue to fetch fresh data
        }
      }

      const fresh = await fetcher()
      if (!isMounted) return

      data.value = fresh
      try {
        await cache.set(key, fresh, ttl)
      } catch (e) {
        console.error('[Cache] Failed to cache data:', e)
        // Continue with fresh data
      }
    } catch (e) {
      if (!isMounted) return

      if (attempt < retryCount) {
        retryTimeout = window.setTimeout(() => {
          if (isMounted) {
            fetch(force, attempt + 1)
          }
        }, retryDelay * attempt)
      } else {
        error.value = e as Error
      }
    } finally {
      if (isMounted) {
        loading.value = false
      }
    }
  }

  // Initial fetch with error handling
  try {
    fetch(forceRefresh)
  } catch (e) {
    error.value = e as Error
  }

  onUnmounted(() => {
    isMounted = false
    clearRetryTimeout()
  })

  return {
    data,
    loading,
    error,
    refresh: () => fetch(true)
  }
} 