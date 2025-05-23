<template>
  <div class="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
    <!-- Header with thumbnail and title -->
    <div class="flex items-start gap-4 mb-3">
      <!-- Set Thumbnail -->
      <div class="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
        <a :href="`/study/${item.setId}`">
          <img 
            v-if="item.setThumbnail" 
            :src="item.setThumbnail" 
            :alt="item.setTitle"
            class="w-full h-full object-cover" 
          />
          <div v-else class="w-full h-full bg-gray-100 flex items-center justify-center">
            <i class="fas fa-book text-gray-400 text-2xl"></i>
          </div>
        </a>
      </div>

      <!-- Title -->
      <div class="flex-1 min-w-0">
        <a :href="`/study/${item.setId}`">
          <h3 class="font-semibold text-gray-900 mb-1 truncate hover:text-blue-600 transition-colors">
            {{ item.setTitle || 'Unknown Set' }}
          </h3>
        </a>
        <p class="text-sm text-gray-600">
          {{ item.description || 'No description available' }}
        </p>
      </div>
    </div>

    <!-- Status rows -->
    <div class="space-y-2">
      <!-- Started date row -->
      <div class="flex items-center text-sm text-gray-600">
        <i class="fas fa-clock w-5"></i>
        <span>Started: {{ formatDate(item.startedAt) }}</span>
      </div>

      <!-- Completion status row -->
      <div class="flex items-center text-sm">
        <i class="fas w-5" :class="item.completed ? 'fa-check-circle text-green-600' : 'fa-times-circle text-gray-600'"></i> 
        <span :class="item.completed ? 'text-green-600' : 'text-gray-600'">
          {{ item.completed ? 'Completed' : 'In Progress' }}
          <span v-if="item.completed && item.completedAt" class="ml-1">
            ({{ formatDate(item.completedAt) }})
          </span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { ViewHistory } from '@/services/historyService'
import { apiEndpoints, api } from '@/api'

const props = defineProps<{
  item: ViewHistory & {
    setTitle?: string
    setThumbnail?: string
  }
}>()

const setTitle = ref('Loading...')

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid Date'
  }
}

onMounted(async () => {
  try {
    if (!props.item.setId) {
      console.error('No set ID found in history item:', props.item)
      setTitle.value = 'Unknown Set'
      return
    }

    const response = await api.get(`${apiEndpoints.sets}/${props.item.setId}`)
    setTitle.value = response.data.title
  } catch (error) {
    console.error('Failed to fetch set title:', error)
    setTitle.value = 'Unknown Set'
  }
})
</script>

<style scoped>
h3, p {
  margin: 0;
  padding: 0;
}
</style>