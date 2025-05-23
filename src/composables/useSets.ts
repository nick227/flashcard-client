import { ref, watch } from 'vue'
import type { Ref } from 'vue'
import axios from 'axios'
import { apiEndpoints, fetchCategories } from '@/api/index'
import type { FlashCardSet } from '../types'

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
  loadSets: (reset?: boolean) => Promise<void>
  resetPagination: () => void
  updateCategory: (category: string) => void
  updateSortOrder: (order: string) => void
  updateSetType: (type: string) => void
}

export function useSets(options: UseSetsOptions = {}): UseSetsReturn {
  const {
    initialCategory = '',
    initialSortOrder = 'featured',
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
        limit: pageSize.toString()
      })

      // Handle sort parameters
      if (sortOrder.value) {
        switch (sortOrder.value) {
          case 'featured':
            params.append('sortBy', 'featured')
            params.append('sortOrder', 'DESC')
            break
          case 'newest':
            params.append('sortBy', 'created_at')
            params.append('sortOrder', 'DESC')
            break
          case 'oldest':
            params.append('sortBy', 'created_at')
            params.append('sortOrder', 'ASC')
            break
        }
      }

      if (selectedCategory.value) {
        params.append('category', selectedCategory.value)
      }

      if (selectedSetType.value) {
        params.append('setType', selectedSetType.value)
      }

      const setsRes = await axios.get(`${apiEndpoints.sets}?${params.toString()}`)
      const { items, pagination } = setsRes.data

      // Only append new items if we're not resetting
      if (reset) {
        sets.value = items
      } else {
        sets.value = [...sets.value, ...items]
      }

      // Update hasMore based on whether there are more pages
      hasMore.value = currentPage.value < pagination.totalPages
      currentPage.value++

      // Load categories if not already loaded
      if (categories.value.length === 0) {
        const categoriesRes = await fetchCategories()
        categories.value = categoriesRes.map(c => typeof c === 'string' ? c : c.name)
      }
    } catch (err: any) {
      error.value = err.message || 'Error loading sets'
      console.error('Error loading sets:', err)
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
    loadSets,
    resetPagination,
    updateCategory,
    updateSortOrder,
    updateSetType
  }
} 