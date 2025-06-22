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
      <a 
        :href="`/sets/${item.id}`"
        target="_blank"
        class="font-semibold text-blue-600 hover:text-blue-800 hover:underline line-clamp-2"
        :aria-label="`View set: ${item.title}`"
      >
        {{ item.title }}
      </a>
    </template>
    <template #price="{ item }">
      {{ item.price === 0 ? 'Free' : `$${item.price}` }}
    </template>
    <template #createdAt="{ item }">
      {{ formatDate(item.createdAt) }}
    </template>
    <template #hidden="{ item }">
      <VisibilityToggle 
        :set-id="item.id"
        :initial-hidden="item.hidden"
      />
    </template>
    <template #actions="{ item }">
      <div class="flex space-x-2">
        <button
          @click="handleAction('edit', item)"
          :disabled="props.loading"
          class="button button-accent button-icon text-xs px-3 py-1"
          :aria-label="`Edit set: ${item.title}`"
        >
          <i class="fa-solid fa-pencil"></i>
        </button>
        <button
          @click="handleAction('delete', item)"
          :disabled="props.loading"
          class="button button-danger button-icon text-xs px-3 py-1"
          :aria-label="`Delete set: ${item.title}`"
        >
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </template>
  </DataTable>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DataTable from '../common/DataTable.vue'
import type { FlashCardSet } from '@/types'
import VisibilityToggle from './VisibilityToggle.vue'

const columns = [
  { key: 'title', label: 'Title', sortable: true },
  { key: 'price', label: 'Price', sortable: true },
  { key: 'createdAt', label: 'Date', sortable: true },
  { key: 'hidden', label: 'Show' },
  { key: 'actions', label: 'Edit' }
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

const emit = defineEmits<{
  (e: 'page-change', page: number): void
  (e: 'edit', set: FlashCardSet): void
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

function handleAction(action: string, item: FlashCardSet) {
  if (props.loading) return;
  switch (action) {
    case 'edit':
      emit('edit', item);
      break;
    case 'delete':
      emit('delete', item);
      break;
  }
}
</script>

<style scoped>
/* Prevent text selection during interactions */
button, a {
  user-select: none;
  -webkit-user-select: none;
}

.visibility-toggle {
  display: inline-flex;
  align-items: center;
  min-width: 80px; /* Prevent width changes */
  height: 24px; /* Fixed height */
}

.switch {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
}

.switch input {
  display: none;
}

.visibility-text {
  font-size: 0.75rem;
  font-weight: 600;
  transition: color 0.2s ease;
  white-space: nowrap;
}

.switch .icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #22c55e;
  transition: color 0.2s;
}
.switch input:checked + .icon {
  color: #22c55e;
}
.switch input:not(:checked) + .icon {
  color: #ef4444;
}
.switch input:disabled + .icon {
  color: #d1d5db;
  cursor: not-allowed;
}
</style> 