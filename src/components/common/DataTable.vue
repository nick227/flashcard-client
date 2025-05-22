<template>
  <div class="overflow-x-auto">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="items.length === 0" class="text-center py-8 text-gray-500">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <h3 class="mt-2 text-sm font-medium">No data available</h3>
      <p class="mt-1 text-sm text-gray-500">Get started by adding some data.</p>
    </div>

    <!-- Table Content -->
    <div v-else ref="tableContainer">
      <table class="min-w-full bg-white rounded-xl shadow">
        <thead>
          <tr class="bg-gray-50 text-gray-700 text-left">
            <th 
              v-for="column in columns" 
              :key="column.key" 
              class="py-3 px-4 font-medium text-sm uppercase tracking-wider"
              :class="{ 'cursor-pointer hover:bg-gray-100': column.sortable }"
              @click="handleSort(column)"
            >
              <div class="flex items-center gap-2">
                {{ column.label }}
                <span v-if="column.sortable" class="text-gray-400">
                  <svg v-if="sortKey === column.key" class="h-4 w-4" :class="{ 'transform rotate-180': sortOrder === 'desc' }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                  </svg>
                  <svg v-else class="h-4 w-4 opacity-0 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                  </svg>
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr 
            v-for="(item, index) in items" 
            :key="item.id || index" 
            class="hover:bg-gray-50 transition-colors duration-150"
          >
            <td 
              v-for="column in columns" 
              :key="column.key" 
              class="py-3 px-4 text-sm"
            >
              <slot :name="column.key" :item="item" :value="item[column.key]">
                {{ item[column.key] }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Enhanced Pagination -->
      <div v-if="showPagination" class="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6 mt-4">
        <div class="flex items-center">
          <span class="text-sm text-gray-700">
            Showing
            <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span>
            to
            <span class="font-medium">{{ Math.min(currentPage * pageSize, totalItems) }}</span>
            of
            <span class="font-medium">{{ totalItems }}</span>
            results
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button 
            class="button px-3 py-1 text-sm rounded-md transition-colors duration-150"
            :class="[
              currentPage === 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-primary hover:bg-gray-50'
            ]"
            :disabled="currentPage === 1"
            @click="$emit('page-change', currentPage - 1)"
          >
            Previous
          </button>
          
          <div class="flex items-center gap-1">
            <button 
              v-for="page in displayedPages" 
              :key="page"
              class="button px-3 py-1 text-sm rounded-md transition-colors duration-150"
              :class="[
                page === currentPage
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              ]"
              @click="$emit('page-change', page)"
            >
              {{ page }}
            </button>
          </div>

          <button 
            class="button px-3 py-1 text-sm rounded-md transition-colors duration-150"
            :class="[
              currentPage === totalPages 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-primary hover:bg-gray-50'
            ]"
            :disabled="currentPage === totalPages"
            @click="$emit('page-change', currentPage + 1)"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

interface Column {
  key: string
  label: string
  sortable?: boolean
}

interface Props {
  columns: Column[]
  items: any[]
  currentPage?: number
  totalPages?: number
  totalItems?: number
  pageSize?: number
  showPagination?: boolean
  loading?: boolean
  sortKey?: string
  sortOrder?: 'asc' | 'desc'
}

const props = withDefaults(defineProps<Props>(), {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  pageSize: 10,
  showPagination: false,
  loading: false,
  sortKey: '',
  sortOrder: 'asc'
})

const emit = defineEmits<{
  (e: 'page-change', page: number): void
  (e: 'sort', key: string): void
}>()

// Calculate which page numbers to show in pagination
const displayedPages = computed(() => {
  const pages = []
  const maxVisiblePages = 5
  const halfVisible = Math.floor(maxVisiblePages / 2)
  
  let start = Math.max(1, props.currentPage - halfVisible)
  let end = Math.min(props.totalPages, start + maxVisiblePages - 1)
  
  if (end - start + 1 < maxVisiblePages) {
    start = Math.max(1, end - maxVisiblePages + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// Add sort handler
const handleSort = (column: Column) => {
  if (column.sortable) {
    emit('sort', column.key)
  }
}

</script>

<style scoped>
.animate-spin {
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

/* Add styles to ensure consistent table layout */
table {
  table-layout: fixed;
  width: 100%;
}

tbody {
  display: table-row-group;
}

tr {
  display: table-row;
}

td, th {
  display: table-cell;
}
</style> 