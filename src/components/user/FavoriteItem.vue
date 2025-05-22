<template>
  <div class="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
    <div class="flex items-center gap-4">
      <a :href="`/sets/${item.id}`"><img :src="item.image" :alt="item.title" class="w-16 h-16 rounded-lg object-cover"></a>
      <div>
        <a :href="`/sets/${item.id}`"><h3 class="font-semibold">{{ item.title }}</h3></a>
        <p class="text-sm text-gray-500">{{ item.description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Favorite } from '@/types'

defineProps<{
  item: Favorite
}>()
</script> 