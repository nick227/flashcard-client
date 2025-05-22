<template>
  <div class="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
    <div class="flex items-center gap-4">
      <div class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
        <img v-if="item.subscriber?.image" :src="item.subscriber.image" class="w-16 h-16 rounded-full object-cover">
        <i v-else class="fas fa-user text-blue-500 text-xl"></i>
      </div>
      <div>
        <a :href="`/users/${item.subscriber?.id}`"><h3 class="font-semibold">{{ item.subscriberName }}</h3></a>
        <p class="text-sm text-gray-500">Subscribed since {{ formatDate(item.createdAt) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Subscription } from '@/types'

const props = defineProps<{
  item: Subscription
}>()

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script> 