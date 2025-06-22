<template>
  <div class="bg-gray-50 rounded-xl p-6">
    <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
      <i :class="icon" :style="{ color: iconColor }"></i>
      {{ title }}
    </h2>
    
    <!-- Loading State (only show on initial load) -->
    <div v-if="loading && !itemsArray.length" class="flex justify-center py-8 loading-state min-height-300">
      {{ loadingMessage }} <i class="fas fa-spinner fa-spin"></i>
    </div>

    <!-- Empty State -->
    <div v-else-if="!itemsArray.length" class="text-center py-8 text-gray-500">
      {{ emptyMessage }}
    </div>

    <!-- Content -->
    <div v-else class="min-height-300 relative">
      <!-- Loading Overlay -->
      <div v-if="loading" class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
      
      <slot :items="itemsArray"></slot>
      
      <!-- Pagination -->
      <div v-if="showPagination" class="mt-6 flex justify-center gap-2">
        <button 
          @click="changePage(currentPage - 1)"
          :disabled="!canGoPrevious || (typeof loading === 'boolean' ? loading : loading.value)"
          class="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span class="px-3 py-1">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <button 
          @click="changePage(currentPage + 1)"
          :disabled="!canGoNext || (typeof loading === 'boolean' ? loading : loading.value)"
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
  loadingMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  emptyMessage: 'No items found'
})

const emit = defineEmits<{
  (e: 'page-change', page: number): void
}>()

const randomLoadingMessages = [
'Keep it together...', 
'Loading the best I can...', 
'Patience is a virtue...', 
'I am doing something...', 
'Rock City!',
'We are almost there...',
'Just a moment...',
'Yellow Submarine',
'Seriously Loading...',
'Bleep, bloop, whiz',
'Loading, loading, loading!',
'This is the best I can do...']

const loadingMessage = computed(() => {
  return randomLoadingMessages[Math.floor(Math.random() * randomLoadingMessages.length)]
})

// Use the current page from props
const currentPage = computed(() => {
  const page = typeof props.currentPage === 'number' ? props.currentPage : props.currentPage.value
  return page
})

// Update total pages when total items changes
const totalPages = computed(() => {
  const total = typeof props.totalItems === 'number' ? props.totalItems : props.totalItems.value
  const pages = Math.max(1, Math.ceil(total / props.pageSize))
  return pages
})

const itemsArray = computed(() => {
  const items = Array.isArray(props.items) ? props.items : props.items.value || []
  return items
})

// Only show pagination if we have more items than the page size
const showPagination = computed(() => {
  const total = typeof props.totalItems === 'number' ? props.totalItems : props.totalItems.value
  const shouldShow = total > props.pageSize
  return shouldShow
})

// Handle page changes
const changePage = async (page: number) => {
  const isLoading = typeof props.loading === 'boolean' ? props.loading : props.loading.value
  
  if (page < 1 || page > totalPages.value || isLoading) {
    return
  }
  
  emit('page-change', page)
}

// Pagination button states
const canGoPrevious = computed(() => {
  const loading = typeof props.loading === 'boolean' ? props.loading : props.loading.value
  const canGo = !loading && currentPage.value > 1
  return canGo
})

const canGoNext = computed(() => {
  const loading = typeof props.loading === 'boolean' ? props.loading : props.loading.value
  const total = typeof props.totalItems === 'number' ? props.totalItems : props.totalItems.value
  const canGo = !loading && currentPage.value < totalPages.value && total > props.pageSize && itemsArray.value.length === props.pageSize
  return canGo
})
</script>

<style scoped>
.min-height-300 {
  min-height: 300px;
}
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.fa-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style> 