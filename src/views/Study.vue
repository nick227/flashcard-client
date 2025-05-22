<template>
  <Navbar />
  <div class="container">
    <FlashCardViewer :set-id="setId" />
  </div>
</template>

<script setup lang="ts">
import Navbar from '../components/common/Navbar.vue'
import FlashCardViewer from '../components/study/FlashCardViewer.vue'
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const setId = computed(() => {
  const id = route.params.setId || route.query.set
  return id ? Number(id) : ''
})
</script> 