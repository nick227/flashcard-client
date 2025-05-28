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
        class="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
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
      <button
        @click="handleAction('toggle-hidden', item)"
        :disabled="props.loading"
        class="text-sm font-medium hover:underline focus:outline-none"
        :class="item.hidden ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'"
        :title="`Click to ${item.hidden ? 'show' : 'hide'} this set`"
        :aria-label="`${item.hidden ? 'Show' : 'Hide'} set: ${item.title}`"
      >
        {{ item.hidden ? 'Hidden' : 'Visible' }}
      </button>
    </template>
    <template #actions="{ item }">
      <div class="flex space-x-4">
        <button
          @click="handleAction('edit', item)"
          :disabled="props.loading"
          class="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
          :aria-label="`Edit set: ${item.title}`"
        >
          Edit
        </button>
        <button
          @click="handleAction('delete', item)"
          :disabled="props.loading"
          class="text-red-600 hover:text-red-800 hover:underline focus:outline-none"
          :aria-label="`Delete set: ${item.title}`"
        >
          Delete
        </button>
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

function handleAction(action: string, item: FlashCardSet) {
  if (props.loading) return;
  
  switch (action) {
    case 'edit':
      emit('edit', item);
      break;
    case 'toggle-hidden':
      emit('toggle-hidden', item);
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
</style> 