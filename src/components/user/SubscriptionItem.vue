<template>
  <div class="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
    <div class="flex items-center gap-4">
      <div class="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
        <img v-if="props.subscription.subscriber?.image && !imageError" 
          :src="props.subscription.subscriber.image" 
          :alt="props.subscription.subscriberName"
          class="w-full h-full object-cover"
          @error="handleImageError" />
        <div v-else class="w-full h-full flex items-center justify-center">
          <span class="text-xl font-bold text-gray-400">{{ getFirstLetter }}</span>
        </div>
      </div>
      <div>
        <a :href="`/users/${props.subscription.subscriber?.id}`"><h3 class="font-semibold">{{ props.subscription.subscriberName }}</h3></a>
        <p class="text-sm text-gray-500">Subscribed since {{ formatDate(props.subscription.createdAt) }}</p>
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
  return props.subscription.subscriberName?.charAt(0).toUpperCase() || '?'
})

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script> 