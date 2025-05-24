<template>
  <div class="bg-white rounded-xl shadow-lg p-6">
    <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
      <i :class="icon" :style="{ color: iconColor }"></i>
      {{ title }}
    </h2>
    
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!itemsArray.length" class="text-center py-8 text-gray-500">
      {{ emptyMessage }}
    </div>

    <!-- Content -->
    <div v-else>
      <slot :items="itemsArray"></slot>
      
      <!-- Pagination -->
      <div v-if="showPagination" class="mt-6 flex justify-center gap-2">
        <button 
          @click="changePage(currentPage - 1)"
          :disabled="!canGoPrevious"
          class="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span class="px-3 py-1">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <button 
          @click="changePage(currentPage + 1)"
          :disabled="!canGoNext"
          class="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type Ref } from 'vue'

interface Props<T = unknown> {
  title: string
  icon: string
  iconColor: string
  loading: boolean | Ref<boolean>
  items: T[] | Ref<T[]>
  totalItems: number | Ref<number>
  currentPage: number | Ref<number>
  pageSize: number
  emptyMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  emptyMessage: 'No items found'
})

const emit = defineEmits<{
  (e: 'pageChange', page: number): void
}>()

// Use the current page from props
const currentPage = computed(() => {
  return typeof props.currentPage === 'number' ? props.currentPage : props.currentPage.value
})

// Update total pages when total items changes
const totalPages = computed(() => {
  const total = typeof props.totalItems === 'number' ? props.totalItems : props.totalItems.value
  const pages = Math.max(1, Math.ceil(total / props.pageSize))
  console.log('Total Pages Calculation:', {
    total,
    pageSize: props.pageSize,
    calculatedPages: pages
  })
  return pages
})

const itemsArray = computed(() => {
  if (!props.items) return []
  return Array.isArray(props.items) ? props.items : props.items.value || []
})

// Only show pagination if we have more items than the page size
const showPagination = computed(() => {
  const total = typeof props.totalItems === 'number' ? props.totalItems : props.totalItems.value
  const shouldShow = total > props.pageSize
  console.log('Show Pagination Check:', {
    total,
    pageSize: props.pageSize,
    shouldShow,
    currentPage: currentPage.value,
    totalPages: totalPages.value,
    itemsLength: itemsArray.value.length
  })
  return shouldShow
})

// Handle page changes
const changePage = (newPage: number) => {
  console.log('Page Change Attempt:', {
    newPage,
    currentPage: currentPage.value,
    totalPages: totalPages.value,
    totalItems: typeof props.totalItems === 'number' ? props.totalItems : props.totalItems.value,
    pageSize: props.pageSize
  })
  if (newPage >= 1 && newPage <= totalPages.value) {
    emit('pageChange', newPage)
  }
}

// Pagination button states
const canGoPrevious = computed(() => {
  const loading = typeof props.loading === 'boolean' ? props.loading : props.loading.value
  const canGo = !loading && currentPage.value > 1
  console.log('Can Go Previous:', {
    loading,
    currentPage: currentPage.value,
    canGo
  })
  return canGo
})

const canGoNext = computed(() => {
  const loading = typeof props.loading === 'boolean' ? props.loading : props.loading.value
  const total = typeof props.totalItems === 'number' ? props.totalItems : props.totalItems.value
  const canGo = !loading && currentPage.value < totalPages.value && total > props.pageSize && itemsArray.value.length === props.pageSize
  console.log('Can Go Next:', {
    loading,
    currentPage: currentPage.value,
    totalPages: totalPages.value,
    total,
    pageSize: props.pageSize,
    itemsLength: itemsArray.value.length,
    canGo
  })
  return canGo
})
</script> 