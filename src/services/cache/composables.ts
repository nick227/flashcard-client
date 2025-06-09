import { ref, computed } from 'vue'
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

export function useCache<T>(cache: CacheService, key: string, fetcher: () => Promise<T>) {
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const fetch = async (force = false) => {
    loading.value = true
    error.value = null
    try {
      if (!force) {
        const cached = cache.get<T>(key)
        if (cached) {
          data.value = cached
          loading.value = false
          return
        }
      }
      const fresh = await fetcher()
      data.value = fresh
      cache.set(key, fresh)
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  }

  fetch()

  return {
    data,
    loading,
    error,
    refresh: () => fetch(true)
  }
} 