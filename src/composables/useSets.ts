import { ref, computed, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import { cachedApi } from '@/services/CachedApiService'
import { apiEndpoints } from '@/api'
import type { Set } from '@/types/set'
import type { Category } from '@/types/category'
import axios from 'axios'
import debounce from 'lodash/debounce'

interface FetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
  isInitialized: boolean
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const DEBOUNCE_DELAY = 300 // ms

export function useSets() {
  const route = useRoute()
  const state = reactive<FetchState<Set[]>>({
    data: null,
    loading: false,
    error: null,
    isInitialized: false
  })

  const currentPage = ref(1)
  const categories = ref<Category[]>([])
  const hasMore = ref(true)
  const selectedCategory = ref('')
  const sortOrder = ref('newest')
  const searchQuery = ref('')
  const selectedSetType = ref('')
  const isTransitioning = ref(false)

  // Debounced load function to prevent rapid API calls
  const debouncedLoad = debounce(async () => {
    await loadSets()
  }, DEBOUNCE_DELAY)

  // Helper function to make batch requests
  const makeBatchRequests = async (batchIds: number[], type: 'views' | 'likes' | 'cards') => {
    const MAX_BATCH_SIZE = 50;
    const chunks = [];
    
    // Split IDs into chunks of MAX_BATCH_SIZE
    for (let i = 0; i < batchIds.length; i += MAX_BATCH_SIZE) {
      chunks.push(batchIds.slice(i, i + MAX_BATCH_SIZE));
    }
    
    try {
      // Process chunks in parallel
      const chunkResults = await Promise.all(
        chunks.map(chunk => 
          cachedApi.get<Record<string, number>>(
            apiEndpoints.sets.batch(type), 
            { ids: chunk.join(',') }, 
            { ttl: CACHE_TTL }
          )
        )
      );
      
      // Merge results from all chunks
      return chunkResults.reduce((acc, result) => ({
        ...acc,
        ...result
      }), {});
    } catch (error) {
      console.error(`[Stats] Error fetching batch ${type}:`, error);
      throw error;
    }
  }

  // Fetch additional set details in batches
  const fetchSetDetails = async (sets: Set[]) => {
    const batchIds = sets.map(set => set.id)
    
    try {
      const [viewsData, likesData, cardsData] = await Promise.all([
        makeBatchRequests(batchIds, 'views'),
        makeBatchRequests(batchIds, 'likes'),
        makeBatchRequests(batchIds, 'cards')
      ])

      return sets.map(set => ({
        ...set,
        views: viewsData?.[set.id] || 0,
        likes: likesData?.[set.id] || 0,
        cardsCount: cardsData?.[set.id] || 0
      }))
    } catch (error) {
      console.error('[Stats] Error fetching set details:', error)
      return sets.map(set => ({
        ...set,
        views: 0,
        likes: 0,
        cardsCount: 0
      }))
    }
  }

  // Prefetch next page details
  const prefetchNextPageDetails = async () => {
    if (!hasMore.value || !state.data) return

    const nextPageSets = state.data.slice(
      currentPage.value * 12,
      (currentPage.value + 1) * 12
    )

    if (nextPageSets.length === 0) return

    const batchIds = nextPageSets.map(set => set.id)
    
    try {
      await Promise.all([
        makeBatchRequests(batchIds, 'views'),
        makeBatchRequests(batchIds, 'likes'),
        makeBatchRequests(batchIds, 'cards')
      ])
    } catch (error) {
      if (axios.isCancel(error)) {
      } else {
        console.warn('[Stats] Error prefetching next page details:', error)
      }
    }
  }

  // Fetch categories with caching
  const fetchCategories = async () => {
    try {
      const response = await cachedApi.get<Category[]>(
        apiEndpoints.categories, 
        { inUse: 'true' }, 
        {
          ttl: CACHE_TTL,
          key: 'categories:inUse'
        }
      )
      
      if (Array.isArray(response)) {
        const processedCategories = response.map(cat => ({
          ...cat,
          setCount: cat.setCount || 0
        })).filter(cat => cat.setCount > 0)
        categories.value = processedCategories
      } else {
        categories.value = []
      }
    } catch (e) {
      console.error('[Stats] Error fetching categories:', e)
      categories.value = []
    }
  }

  // Fetch sets with caching
  const loadSets = async () => {
    if (state.loading) return
    state.loading = true
    state.error = null
    isTransitioning.value = true

    try {
      const params = {
        page: currentPage.value,
        limit: 12,
        category: selectedCategory.value || undefined,
        search: searchQuery.value || undefined,
        setType: selectedSetType.value || undefined,
        sortOrder: sortOrder.value || 'featured'
      }
      
      const cacheKey = `sets:${JSON.stringify({
        ...params,
        page: currentPage.value
      })}`
      
      const response = await cachedApi.get<{ items: Set[], pagination: { total: number, hasMore: boolean } }>(
        apiEndpoints.sets.base, 
        params, 
        {
          ttl: CACHE_TTL,
          key: cacheKey
        }
      )

      if (!response || !Array.isArray(response.items)) {
        state.data = currentPage.value === 1 ? [] : state.data
        hasMore.value = false
        return
      }

      const setsData = response.items

      if (setsData.length === 0) {
        state.data = currentPage.value === 1 ? [] : state.data
        hasMore.value = false
        return
      }

      const newSets = await fetchSetDetails(setsData)
      
      if (currentPage.value === 1) {
        state.data = newSets
      } else {
        state.data = [...(state.data || []), ...newSets]
      }

      // Update pagination state
      hasMore.value = response.pagination?.hasMore ?? false
      if (hasMore.value) {
        currentPage.value++
      }

      // Prefetch next page details if available
      if (hasMore.value) {
        prefetchNextPageDetails()
      }
    } catch (e) {
      console.error('[Stats] Error fetching sets:', e)
      state.error = e instanceof Error ? e.message : 'Failed to fetch sets'
      if (currentPage.value === 1) {
        state.data = []
      }
      hasMore.value = false
    } finally {
      state.loading = false
      // Add a small delay before ending transition to allow animations to complete
      setTimeout(() => {
        isTransitioning.value = false
      }, 300)
    }
  }

  // Watch for route changes to trigger prefetching
  watch(
    () => route.query,
    () => {
      if (state.isInitialized) {
        currentPage.value = 1
        state.data = []
        hasMore.value = true
        debouncedLoad()
      }
    }
  )

  // Initialize sets data
  const initialize = async () => {
    if (state.isInitialized) return
    try {
      await Promise.all([
        loadSets(),
        fetchCategories()
      ])
      state.isInitialized = true
    } catch (e) {
      console.error('Error initializing sets data:', e)
      state.error = e instanceof Error ? e.message : 'Failed to initialize sets data'
    }
  }

  // Update functions with transition handling
  const updateCategory = (category: string) => {
    selectedCategory.value = category
    currentPage.value = 1
    state.data = []
    hasMore.value = true
    debouncedLoad()
  }

  const updateSortOrder = (order: string) => {
    sortOrder.value = order
    currentPage.value = 1
    state.data = []
    hasMore.value = true
    debouncedLoad()
  }

  const updateSetType = (type: string) => {
    selectedSetType.value = type
    currentPage.value = 1
    state.data = []
    hasMore.value = true
    debouncedLoad()
  }

  const updateSearch = (query: string) => {
    searchQuery.value = query
    currentPage.value = 1
    state.data = []
    hasMore.value = true
    debouncedLoad()
  }

  watch(
    () => route.params.category,
    (newCategory) => {
      if (newCategory) {
        updateCategory(Array.isArray(newCategory) ? newCategory[0] : newCategory)
      } else {
        updateCategory('') // Show all if no category
      }
    },
    { immediate: true }
  )

  return {
    state,
    sets: computed(() => state.data),
    loading: computed(() => state.loading),
    error: computed(() => state.error),
    currentPage,
    selectedCategory,
    sortOrder,
    searchQuery,
    selectedSetType,
    categories,
    hasMore,
    isTransitioning,
    loadSets,
    fetchCategories,
    initialize,
    updateCategory,
    updateSortOrder,
    updateSetType,
    updateSearch
  }
} 