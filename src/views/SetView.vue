<template>
  <Navbar />
  <div class="container mx-auto px-4 py-8">
    <FlashCardViewer :set-id="setId" />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import FlashCardViewer from '@/components/study/FlashCardViewer.vue'
import Navbar from '@/components/common/Navbar.vue'

const route = useRoute()
const setId = computed(() => {
  const id = Number(route.params.setId)
  console.log('SetView - Computed setId:', id, 'from params:', route.params)
  return id
})

// Watch for changes to setId
watch(setId, (newId) => {
  console.log('SetView - setId changed:', newId)
})
</script> 