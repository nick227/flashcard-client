<template>
  <div class="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
    <div class="flex items-center gap-4">
      <a :href="`/sets/${props.purchase.set?.id}`"><img :src="props.purchase.set?.image || '/images/default-set.png'" :alt="props.purchase.set?.title" class="w-16 h-16 rounded-lg object-cover"></a>
      <div>
        <a :href="`/sets/${props.purchase.set?.id}`"><h3 class="font-semibold">{{ props.purchase.set?.title }}</h3></a>
        <p class="text-sm text-gray-500">Purchased {{ formatDate(props.purchase.date) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Purchase } from '@/types/purchase'

const props = defineProps<{
  purchase: Purchase
}>()

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script> 