<template>
  <div class="home-page">

    <div class="container-main py-0 pt-8">
      <BrowseHero />
    </div>

    <div class="container-main flex flex-col gap-4 items-center justify-center">
      <p>Current Stats:</p>
      <StatsSection />
    </div>

    <div class="container-main flex flex-col gap-4 items-center justify-center pb-8 pt-16">
      <button @click="goToBrowse" class="button button-primary text-lg">Show More</button>
    </div>

    <div class="container-main py-0 mb-8 flex flex-col gap-4 items-center justify-center">
      <h2 class="text-2xl font-bold">Interesting Categories</h2>
      <CategoryCloud />
    </div>

    <div v-for="(set, idx) in randomSets" :key="set.id" class="my-24 alternate-bg">

      <div class="w-full py-12">
        <FeaturedSet :set="randomSets[idx]" />
      </div>
      <div class="w-full pb-24 pt-12">
        <FlashCardViewer :key="set.id" :set-id="set.id" :hideRelatedSets="true" />
      </div>
    </div>

    <div class="container-main py-64">
      <HomeHero />
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
import StatsSection from '@/components/common/StatsSection.vue'
import FeaturedSet from '@/components/home/FeaturedSet.vue'

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

<style scoped>
.alternate-bg:nth-child(odd) {
  background: #fafafa;
}
</style>
