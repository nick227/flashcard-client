import { ref, computed, watch } from 'vue'
import { api, apiEndpoints } from '@/api'
import { cacheService } from '@/plugins/cache'

// Cache duration - 5 minutes for paginated data
const CACHE_DURATION = 5 * 60 * 1000

export function usePaginatedData<T>(endpoint: string, options: {
  userId?: number
  pageSize?: number
  queryParams?: Record<string, any>
}) {
  const items = ref<T[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentPage = ref(1)
  const totalItems = ref(0)
  const pageSize = options.pageSize || 10
  const cacheHits = ref(0)
  const cacheMisses = ref(0)

  const totalPages = computed(() => {
    return Math.max(1, Math.ceil(totalItems.value / pageSize))
  })

  // Generate cache key for the current request
  const getCacheKey = (page: number) => {
    // Create a new params object with the current page
    const params = {
      page: page.toString(),
      limit: pageSize.toString(),
      ...(options.userId ? { userId: options.userId.toString() } : {}),
      ...Object.fromEntries(
        Object.entries(options.queryParams || {}).map(([key, value]) => {
          // Don't override the page parameter if it exists in queryParams
          if (key === 'page') return [key, page.toString()]
          return [key, String(value)]
        })
      )
    }
    
    const cacheKey = `${endpoint}?${new URLSearchParams(params).toString()}`
    return cacheKey
  }

  const fetchData = async (page: number = 1) => {

    loading.value = true
    error.value = null
    currentPage.value = page

    try {
      // Create query params without page first
      const baseParams = { ...options.queryParams }
      delete baseParams.page // Remove page if it exists in queryParams

      const queryParams: Record<string, any> = {
        page,
        limit: pageSize,
        ...baseParams
      }

      if (options.userId) {
        queryParams.userId = options.userId
      }

      // Use CacheService for request deduplication and caching
      const cacheKey = getCacheKey(page)
      
      const data = await cacheService.getOrSet(
        cacheKey,
        async () => {
          cacheMisses.value++
          
          const res = await api.get(endpoint, { params: queryParams })
          
          let processedData: T[] = []
          let processedTotal = 0

          // Handle different response structures
          if (endpoint === apiEndpoints.history.base) {
            if (res.data?.items) {
              processedData = res.data.items
              processedTotal = res.data.total || res.data.items.length
            }
          } else if (res.data && res.data.pagination) {
            processedData = res.data.items || []
            processedTotal = res.data.pagination.total || 0
          } else if (Array.isArray(res.data)) {
            processedData = res.data
            processedTotal = res.data.length
          } else if (res.data) {
            processedData = [res.data]
            processedTotal = 1
          }

          return { data: processedData, total: processedTotal }
        },
        CACHE_DURATION
      )

      cacheHits.value++

      // Update items and total only after successful fetch
      items.value = data.data
      totalItems.value = data.total

    } catch (err) {
      error.value = 'Failed to fetch data'
      console.error('usePaginatedData - Error:', err)
      items.value = []
      totalItems.value = 0
    } finally {
      loading.value = false
    }
  }

  // Clear cache when query params change
  watch(() => options.queryParams, () => {
    cacheService.deleteByPrefix(endpoint)
  }, { deep: true })

  // Clear cache when userId changes
  watch(() => options.userId, () => {
    cacheService.deleteByPrefix(endpoint)
  })

  return {
    items,
    loading,
    error,
    currentPage,
    totalItems,
    totalPages,
    fetchData,
    cacheStats: computed(() => ({
      hits: cacheHits.value,
      misses: cacheMisses.value,
      hitRate: cacheHits.value + cacheMisses.value > 0 
        ? cacheHits.value / (cacheHits.value + cacheMisses.value) 
        : 0
    }))
  }
} 