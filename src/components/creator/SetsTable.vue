<template>
  <DataTable
    :columns="columns"
    :items="sets"
    :current-page="currentPage"
    :total-pages="totalPages"
    :total-items="totalItems"
    :page-size="pageSize"
    :show-pagination="true"
    :loading="loading"
    :sort-key="sortKey"
    :sort-order="sortOrder"
    @page-change="$emit('page-change', $event)"
    @sort="handleSort"
  >
    <template #title="{ item }">
      <span class="font-semibold">{{ item.title }}</span>
    </template>
    <template #price="{ item }">
      {{ item.price === 0 ? 'Free' : `$${item.price}` }}
    </template>
    <template #createdAt="{ item }">
      {{ formatDate(item.createdAt) }}
    </template>
    <template #hidden="{ item }">
      <span :class="item.hidden ? 'text-red-500' : 'text-green-600'">
        {{ item.hidden ? 'Hidden' : 'Visible' }}
      </span>
    </template>
    <template #actions="{ item }">
      <div 
        class="relative inline-block"
        @mouseenter="handleMouseEnter(item.id)"
        @mouseleave="handleMouseLeave(item.id)"
      >
        <button 
          @click="toggleDropdown(item.id)"
          class="p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
          :disabled="props.loading"
        >
          Edit Set
        </button>
        <div 
          v-if="activeDropdown === item.id"
          class="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200"
          style="transform: translateY(0);"
        >
          <div class="py-1">
            <a 
              class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
              :class="{ 'opacity-50 cursor-not-allowed': props.loading }"
              @click="handleAction('edit', item)"
            >
              Edit
            </a>
            <a 
              class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
              :class="{ 'opacity-50 cursor-not-allowed': props.loading }"
              @click="handleAction('toggle-hidden', item)"
            >
              {{ item.hidden ? 'Show' : 'Hide' }}
            </a>
            <a 
              class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
              @click="handleAction('view', item)"
            >
              View
            </a>
            <a 
              class="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer"
              :class="{ 'opacity-50 cursor-not-allowed': props.loading }"
              @click="handleAction('delete', item)"
            >
              Delete
            </a>
          </div>
        </div>
      </div>
    </template>
  </DataTable>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DataTable from '../common/DataTable.vue'
import type { FlashCardSet } from '@/types'

const columns = [
  { key: 'title', label: 'Title', sortable: true },
  { key: 'price', label: 'Price', sortable: true },
  { key: 'createdAt', label: 'Created', sortable: true },
  { key: 'hidden', label: 'Hidden' },
  { key: 'actions', label: 'Actions' }
]

interface Props {
  sets: FlashCardSet[]
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const sortKey = ref('createdAt')
const sortOrder = ref<'asc' | 'desc'>('desc')
const activeDropdown = ref<number | null>(null)
const hoverTimeout = ref<number | null>(null)

const emit = defineEmits<{
  (e: 'page-change', page: number): void
  (e: 'edit', set: FlashCardSet): void
  (e: 'toggle-hidden', set: FlashCardSet): void
  (e: 'delete', set: FlashCardSet): void
  (e: 'sort', key: string, order: 'asc' | 'desc'): void
}>()

function formatDate(dateStr: string) {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
  } catch (err) {
    return 'N/A';
  }
}

function handleSort(key: string) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
  emit('sort', key, sortOrder.value)
}

function toggleDropdown(id: number) {
  activeDropdown.value = activeDropdown.value === id ? null : id
}

function handleMouseEnter(id: number) {
  if (hoverTimeout.value) {
    clearTimeout(hoverTimeout.value)
    hoverTimeout.value = null
  }
  activeDropdown.value = id
}

function handleMouseLeave(id: number) {
  hoverTimeout.value = window.setTimeout(() => {
    if (activeDropdown.value === id) {
      activeDropdown.value = null
    }
  }, 100)
}

function handleAction(action: string, item: FlashCardSet) {
  if (props.loading) return;
  
  activeDropdown.value = null;
  
  switch (action) {
    case 'edit':
      emit('edit', item);
      break;
    case 'toggle-hidden':
      emit('toggle-hidden', item);
      break;
    case 'view':
      window.open(`/sets/${item.id}`, '_blank');
      break;
    case 'delete':
      emit('delete', item);
      break;
  }
}
</script>

<style scoped>
.relative {
  position: relative;
}

/* Ensure dropdown is always visible */
.absolute {
  position: absolute;
  transform: translateY(0);
  z-index: 50;
}

/* Prevent text selection during interactions */
button, a {
  user-select: none;
  -webkit-user-select: none;
}
</style> 