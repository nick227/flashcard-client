<template>
  <div class="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
    <div class="flex items-center gap-4">
      <div class="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
        <a :href="`/u/${props.subscription.educator_id}`">
        <img v-if="props.subscription.educator?.image && !imageError" 
          :src="props.subscription.educator.image" 
          :alt="props.subscription.educator?.name"
          class="w-full h-full object-cover"
          @error="handleImageError" />
        <div v-else class="w-full h-full flex items-center justify-center">
          <span class="text-xl font-bold text-gray-400">{{ getFirstLetter }}</span>
        </div>
        </a>
      </div>
      <div>
        <a :href="`/u/${props.subscription.educator_id}`"><h3 class="font-semibold">{{ props.subscription.educator?.name }}</h3></a>
        <p class="text-sm text-gray-500">Subscribed since {{ formatDate(props.subscription.created_at) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Subscription } from '@/types/subscription'

const props = defineProps<{
  subscription: Subscription
}>()

const imageError = ref(false)

const handleImageError = () => {
  imageError.value = true
}

const getFirstLetter = computed(() => {
  const letter = props.subscription.educator?.name?.charAt(0).toUpperCase() || '?'
  return letter
})

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script> 