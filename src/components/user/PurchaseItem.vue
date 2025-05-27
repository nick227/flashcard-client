<template>
  <div class="bg-white rounded-lg shadow p-4">
    <div class="flex items-center gap-4">
      <div class="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
        <a :href="`/sets/${item.set?.id}`">
        <img v-if="item.set?.image && !imageError" 
          :src="item.set.image" 
          :alt="item.set?.title"
          class="w-full h-full object-cover"
          @error="handleImageError" />
        <div v-else class="w-full h-full flex items-center justify-center">
          <span class="text-xl font-bold text-gray-400">{{ getFirstLetter }}</span>
        </div>
        </a>
      </div>
      <div class="flex-1 min-w-0">
        <a :href="`/sets/${item.set?.id}`"><h3 class="font-semibold truncate">{{ item.set?.title }}</h3></a>
        <p class="text-sm text-gray-500">Purchased {{ formatDate(item.date) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Purchase } from '@/types/purchase'

const props = defineProps<{
  item: Purchase
}>()

const imageError = ref(false)

const handleImageError = () => {
  imageError.value = true
}

const getFirstLetter = computed(() => {
  return props.item.set?.title?.charAt(0).toUpperCase() || '?'
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
.w-16.h-16 {
  position: relative;
  transition: all 0.2s ease;
}

.w-16.h-16:hover {
  transform: scale(1.02);
}

.w-16.h-16 img {
  transition: opacity 0.2s ease;
}

.w-16.h-16 img:hover {
  opacity: 0.9;
}

.w-16.h-16 .text-2xl {
  font-size: 1.75rem;
  line-height: 1;
}
</style> 