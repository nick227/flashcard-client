<template>
  <DataTable
    :columns="columns"
    :items="sales"
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
    <template #date="{ item }">
      {{ formatDate(item.date || '') }}
    </template>
  </DataTable>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DataTable from '../common/DataTable.vue'
import type { Sale } from '@/types'

const columns = [
  { key: 'buyerName', label: 'Buyer', sortable: true },
  { key: 'setTitle', label: 'Set', sortable: true },
  { key: 'date', label: 'Date', sortable: true }
]

interface Props {
  sales: Sale[]
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  loading: false
})

const sortKey = ref('date')
const sortOrder = ref<'asc' | 'desc'>('desc')

defineEmits<{
  (e: 'page-change', page: number): void
  (e: 'sort', key: string, order: 'asc' | 'desc'): void
}>()

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString()
}

function handleSort(key: string) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}
</script> 