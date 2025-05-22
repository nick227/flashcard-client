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
      <div class="flex gap-3 justify-between">
        <a 
          class="px-3 py-1 link" 
          :class="{ 'opacity-50 cursor-not-allowed': loading }"
          @click="!loading && $emit('edit', item)"
        >
          Edit
        </a>
        <a 
          class="px-3 py-1 link" 
          :class="{ 'opacity-50 cursor-not-allowed': loading }"
          @click="!loading && $emit('toggle-hidden', item)"
        >
          {{ item.hidden ? 'Show' : 'Hide' }}
        </a>
        <a class="px-3 py-1 link" :href="`/sets/${item.id}`" target="_blank">View</a>

        <a 
          class="px-3 py-1 button button-danger" 
          :class="{ 'opacity-50 cursor-not-allowed': loading }"
          @click="!loading && $emit('delete', item)"
        >
          Delete
        </a>
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

withDefaults(defineProps<Props>(), {
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
</script> 