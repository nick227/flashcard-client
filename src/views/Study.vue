<template>
  
  <div class="container-main mx-auto">
    <FlashCardViewer :set-id="setId" />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import FlashCardViewer from '@/components/study/FlashCardViewer.vue'
import { computed } from 'vue'

const route = useRoute()
const setId = computed(() => {
  const id = route.params.setId || route.query.set
  return id ? Number(id) : ''
})
</script> 