<template>
  <div class="home-page">

    <div v-if="randomSets.length > 0" class="container-main py-0 mb-8">
      <FlashCardViewer :key="randomSets[0].id" :set-id="randomSets[0].id" :hideRelatedSets="true" />
    </div>

    <div class="container-main py-0 mb-8">
      <HomeHero />
    </div>

    <div class="container-main py-0 mb-8 flex flex-col gap-4 items-center justify-center">
      <h2 class="text-2xl font-bold">Interesting Categories</h2>
      <CategoryCloud />
    </div>

    <div v-if="randomSets.length > 0" class="container-main py-0 mb-8">
      <FlashCardViewer :key="randomSets[1].id" :set-id="randomSets[1].id" :hideRelatedSets="true" />
    </div>

    <div class="container-main py-0 mb-8">
      <BrowseHero />
    </div>

    <div v-if="randomSets.length > 0" class="container-main py-0 mb-8">
      <FlashCardViewer :key="randomSets[2].id" :set-id="randomSets[2].id" :hideRelatedSets="true" />
    </div>

    <div class="container-main py-0 mb-8 flex justify-center mt-16">
      <button @click="goToBrowse" class="button button-primary text-lg">Show More</button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import HomeHero from '@/components/sections/HomeHero.vue'
import type { Set } from '@/types/set'
import { api } from '@/api'
import FlashCardViewer from '@/components/study/FlashCardViewer.vue'
import CategoryCloud from '@/components/common/CategoryCloud.vue'
import BrowseHero from '@/components/sections/BrowseHero.vue'

const randomSets = ref<Set[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const isMobile = ref(false)
isMobile.value = window.innerWidth < 768

const goToBrowse = () => {
  window.location.href = '/browse'
}

const fetchSets = async () => {
  loading.value = true
  error.value = null
  try {
    //get random set
    const res = await api.get('/sets/random', {
      params: { limit: 3 }
    })
    randomSets.value = res.data;

  } catch (err: any) {
    console.error('Error fetching sets:', err)
    error.value = err.message || 'Failed to load sets'
  } finally {
    loading.value = false
  }
}

onMounted(fetchSets)
</script>

<style scoped></style>
