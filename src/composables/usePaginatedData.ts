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
    console.log('usePaginatedData - Total Pages Calculation:', {
      totalItems: totalItems.value,
      pageSize,
      calculatedPages: Math.max(1, Math.ceil(totalItems.value / pageSize))
    })
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

      console.log('usePaginatedData - Fetching data:', {
        endpoint,
        queryParams,
        page,
        pageSize
      })

      const res = await api.get(endpoint, { params: queryParams })
      
      console.log('usePaginatedData - Response:', {
        data: res.data,
        hasPagination: !!res.data?.pagination,
        itemsLength: res.data?.items?.length || 0,
        totalItems: res.data?.pagination?.total || 0
      })

      if (res.data && res.data.pagination) {
        items.value = res.data.items || []
        // Use the actual items length if it's less than the reported total
        const reportedTotal = res.data.pagination.total || 0
        const actualItems = items.value.length
        totalItems.value = actualItems < reportedTotal ? actualItems : reportedTotal
      } else if (Array.isArray(res.data)) {
        items.value = res.data
        totalItems.value = res.data.length
      } else if (res.data) {
        items.value = [res.data]
        totalItems.value = 1
      } else {
        items.value = []
        totalItems.value = 0
      }

      console.log('usePaginatedData - Updated state:', {
        itemsLength: items.value.length,
        totalItems: totalItems.value,
        currentPage: currentPage.value,
        totalPages: totalPages.value
      })
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