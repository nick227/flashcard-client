import { ref, computed } from 'vue'
import { api, apiEndpoints } from '@/api'

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

  const totalPages = computed(() => {
    return Math.max(1, Math.ceil(totalItems.value / pageSize))
  })

  const fetchData = async (page: number = 1) => {
    loading.value = true
    error.value = null
    currentPage.value = page

    try {
      const queryParams: Record<string, any> = {
        page,
        limit: pageSize,
        ...options.queryParams
      }

      // Add user ID to query params if available
      if (options.userId) {
        queryParams.userId = options.userId
      }

      console.log('Fetching data from:', endpoint, 'with params:', queryParams)
      const res = await api.get(endpoint, { params: queryParams })
      console.log('API response:', res.data)

      // Handle history endpoint response structure
      if (endpoint === apiEndpoints.history) {
        if (res.data?.items) {
          items.value = res.data.items
          totalItems.value = res.data.total || res.data.items.length
        } else {
          items.value = []
          totalItems.value = 0
        }
      }
      // Handle standard pagination response
      else if (res.data && res.data.pagination) {
        items.value = res.data.items || []
        const reportedTotal = res.data.pagination.total || 0
        const actualItems = items.value.length
        totalItems.value = actualItems < reportedTotal ? actualItems : reportedTotal
        console.log('Processed paginated data:', {
          items: items.value,
          total: totalItems.value,
          page: currentPage.value
        })
      }
      // Handle array response
      else if (Array.isArray(res.data)) {
        items.value = res.data
        totalItems.value = res.data.length
      }
      // Handle single item response
      else if (res.data) {
        items.value = [res.data]
        totalItems.value = 1
      }
      // Handle empty response
      else {
        items.value = []
        totalItems.value = 0
      }

    } catch (err) {
      error.value = 'Failed to fetch data'
      console.error('Error fetching data:', err)
      items.value = []
      totalItems.value = 0
    } finally {
      loading.value = false
    }
  }

  return {
    items,
    loading,
    error,
    currentPage,
    totalItems,
    totalPages,
    fetchData
  }
} 