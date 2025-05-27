<template>
  <div class="bg-white rounded-lg shadow p-4">
    <div class="flex items-center gap-4">
      <div class="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
        <a :href="`/sets/${item.Set?.id}`">
        <img v-if="item.setThumbnail && !imageError" 
          :src="item.setThumbnail" 
          :alt="item.setTitle"
          class="w-full h-full object-cover"
          @error="handleImageError" />
        <div v-else class="w-full h-full flex items-center justify-center">
          <span class="text-xl font-bold text-gray-400">{{ getFirstLetter }}</span>
        </div>
        </a>
      </div>
      <div class="flex-1 min-w-0">
        <a :href="`/sets/${item.Set?.id}`"><h3 class="font-semibold truncate">{{ item.setTitle || 'Untitled Set' }}</h3></a>
        <p class="text-sm text-gray-500">Viewed {{ formatDate(item.startedAt) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ViewHistory } from '@/services/historyService'

const props = defineProps<{
  item: ViewHistory
}>()

const imageError = ref(false)

const handleImageError = () => {
  imageError.value = true
}

const getFirstLetter = computed(() => {
  return props.item.setTitle?.charAt(0).toUpperCase() || '?'
})

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style scoped>
h3, p {
  margin: 0;
  padding: 0;
}
</style>