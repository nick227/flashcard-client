<template>
  
  <div class="container-main  mx-auto px-4 py-2 set-view">
    <FlashCardViewer :set-id="setId" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import FlashCardViewer from '@/components/study/FlashCardViewer.vue'

const route = useRoute()
const setId = computed(() => {
  const id = Number(route.params.setId)
  return id
})
</script> 