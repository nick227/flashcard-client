<template>
  <div class="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
    <div class="flex items-center gap-4">
      <a :href="`/sets/${props.purchase.set?.id}`">
        <div class="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
          <img 
            v-if="props.purchase.set?.image && !imageError" 
            :src="props.purchase.set.image" 
            :alt="props.purchase.set?.title" 
            class="w-full h-full object-cover"
            @error="handleImageError"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <span class="text-2xl font-bold text-gray-400">{{ getFirstLetter }}</span>
          </div>
        </div>
      </a>
      <div>
        <a :href="`/sets/${props.purchase.set?.id}`"><h3 class="font-semibold">{{ props.purchase.set?.title }}</h3></a>
        <p class="text-sm text-gray-500">Purchased {{ formatDate(props.purchase.date) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Purchase } from '@/types/purchase'
import { ref, computed } from 'vue'

const props = defineProps<{
  purchase: Purchase
}>()

const imageError = ref(false)

// Get first letter of title for fallback
const getFirstLetter = computed(() => {
  if (!props.purchase.set?.title) return '?'
  return props.purchase.set.title.charAt(0).toUpperCase()
})

const handleImageError = () => {
  imageError.value = true
}

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