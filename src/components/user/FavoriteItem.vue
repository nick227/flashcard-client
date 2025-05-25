<template>
  <div class="bg-white rounded-lg shadow p-4">
    <div class="flex items-center gap-4">
      <div class="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
        <img v-if="item.image && !imageError" 
          :src="item.image" 
          :alt="item.title"
          class="w-full h-full object-cover"
          @error="handleImageError" />
        <div v-else class="w-full h-full flex items-center justify-center">
          <span class="text-xl font-bold text-gray-400">{{ getFirstLetter }}</span>
        </div>
      </div>
      <div class="flex-1 min-w-0">
        <h3 class="font-semibold truncate">{{ item.title }}</h3>
        <p class="text-sm text-gray-500 truncate">{{ item.category }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Favorite } from '@/types'

const props = defineProps<{
  item: Favorite
}>()

const imageError = ref(false)

const handleImageError = () => {
  imageError.value = true
}

const getFirstLetter = computed(() => {
  if (!props.item.title) return '?'
  return props.item.title.charAt(0).toUpperCase()
})
</script> 