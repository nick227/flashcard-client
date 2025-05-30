import { ref, type Ref } from 'vue'
import type { FlashCardSet } from '@/types'
import axios from 'axios'
import { apiEndpoints, fetchCategories } from '@/api/index'

interface UseSetsOptions {
  initialCategory?: string
  initialSortOrder?: string
  initialSetType?: string
  pageSize?: number
  autoLoad?: boolean
}

interface UseSetsReturn {
  sets: Ref<FlashCardSet[]>
  loading: Ref<boolean>
  selectedCategory: Ref<string>
  sortOrder: Ref<string>
  categories: Ref<string[]>
  hasMore: Ref<boolean>
  error: Ref<string | null>
  selectedSetType: Ref<string>
  searchQuery: Ref<string>
  loadSets: (reset?: boolean) => Promise<void>
  resetPagination: () => void
  updateCategory: (category: string) => void
  updateSortOrder: (order: string) => void
  updateSetType: (type: string) => void
  updateSearch: (query: string) => void
}

export function useSets(options: UseSetsOptions = {}): UseSetsReturn {
  const {
    initialCategory = '',
    initialSortOrder = 'newest',
    initialSetType = '',
    pageSize = 12,
    autoLoad = true
  } = options

  const sets = ref<FlashCardSet[]>([])
  const loading = ref(false)
  const selectedCategory = ref(initialCategory)
  const sortOrder = ref(initialSortOrder)
  const categories = ref<string[]>([])
  const currentPage = ref(1)
  const hasMore = ref(true)
  const error = ref<string | null>(null)
  const selectedSetType = ref(initialSetType)
  const searchQuery = ref('')
  const debounceTimeout = ref<number | null>(null)

  const resetPagination = () => {
    sets.value = []
    currentPage.value = 1
    hasMore.value = true
    error.value = null
    loadSets()
  }

  const loadSets = async (reset = false) => {
    if (loading.value) return

    try {
      loading.value = true
      error.value = null

      if (reset) {
        sets.value = []
        currentPage.value = 1
        hasMore.value = true
      }

      const params = new URLSearchParams({
        page: currentPage.value.toString(),
        limit: pageSize.toString(),
        sortOrder: sortOrder.value
      })

      if (selectedCategory.value) {
        params.append('category', selectedCategory.value)
      }

      if (selectedSetType.value) {
        params.append('setType', selectedSetType.value)
      }

      if (searchQuery.value.trim()) {
        console.log('Adding search query to params:', searchQuery.value.trim())
        params.append('search', searchQuery.value.trim())
      }

      console.log('Fetching sets with params:', params.toString())
      const setsRes = await axios.get(`${apiEndpoints.sets}?${params.toString()}`)
      console.log('Search response:', setsRes.data)
      const { items, pagination } = setsRes.data

      if (reset) {
        sets.value = items
      } else {
        sets.value = [...sets.value, ...items]
      }

      hasMore.value = currentPage.value < pagination.totalPages
      if (hasMore.value) {
        currentPage.value++
      }

      if (categories.value.length === 0) {
        const categoriesRes = await fetchCategories(true)
        categories.value = categoriesRes.map(c => typeof c === 'string' ? c : c.name)
      }
    } catch (err: any) {
      error.value = err.message || 'Error loading sets'
      console.error('Error loading sets:', err)
      // Clear results on error
      if (reset) {
        sets.value = []
      }
    } finally {
      loading.value = false
    }
  }

  const updateCategory = (category: string) => {
    selectedCategory.value = category
    loadSets(true)
  }

  const updateSortOrder = (order: string) => {
    sortOrder.value = order
    loadSets(true)
  }

  const updateSetType = (type: string) => {
    selectedSetType.value = type
    loadSets(true)
  }

  const updateSearch = (query: string) => {
    searchQuery.value = query
    if (debounceTimeout.value) {
      clearTimeout(debounceTimeout.value)
    }
    
    // If search is empty, reset the results
    if (!query.trim()) {
      loadSets(true)
      return
    }
    
    debounceTimeout.value = window.setTimeout(() => {
      loadSets(true)
    }, 300)
  }

  if (autoLoad) {
    loadSets()
  }

  return {
    sets,
    loading,
    selectedCategory,
    sortOrder,
    categories,
    hasMore,
    error,
    selectedSetType,
    searchQuery,
    loadSets,
    resetPagination,
    updateCategory,
    updateSortOrder,
    updateSetType,
    updateSearch
  }
} 