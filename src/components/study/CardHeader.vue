<template>
  <div class="w-full">
    <div class="flex flex-col items-start w-full">
      <!-- Creator Name -->
      <a @click="router.push(`/u/${set.educatorName}`)" class="link">
        <h3>{{ set.educatorName }}</h3>
      </a>
    </div>
    <div class="title-container mb-4">
      <!-- Set title -->
      <h1 class="text-2xl font-bold">{{ set.title }}</h1>
      <!-- Download Button -->
      <a class="link mr-4" @click="$emit('download')">
        <i :class="['fa-solid', 'fa-download', 'text-gray-400', 'text-2xl']"></i>&nbsp; Download 
      </a>
      <!-- Like Button -->
      <a class="link" @click="$emit('toggle-like')">
        <i :class="['fa-solid', 'fa-heart', isLiked ? 'text-red-500' : 'text-gray-400', 'text-2xl']"></i>&nbsp; {{ setLikes }}
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { FlashCardSet } from '@/types'

const router = useRouter()

defineProps<{
  set: FlashCardSet
  isLiked: boolean
  setLikes: number
}>()

defineEmits<{
  (e: 'download'): void
  (e: 'toggle-like'): void
}>()
</script> 
