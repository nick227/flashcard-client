<template>
  <div class="home-page">


    <FlashCardViewer v-for="set in sets" :key="set.id" :set-id="set.id" :hideRelatedSets="true" />

    <!-- Site Landing Page -->
    <div v-if="!isMobile" class="container-main -main py-8">
      <SiteLandingPage />
    </div>

    <!-- All Sets Grid
    <section class="section">
      <h2 class="text-2xl font-bold text-gray-900 flex justify-center mb-8">Newest</h2>
      <div v-if="loading" class="text-gray-500 text-center">Loading sets...</div>
      <div v-else class="cards-grid">
        <SetPreviewCard v-for="set in sets" :key="set.id" :set="set" @view="viewSet" />
      </div>
    </section>
    -->
    <div class="container-main py-0">
      <!-- Home Hero -->
      <div class="container-main  py-8">
        <HomeHero />
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import HomeHero from '@/components/sections/HomeHero.vue'
import SiteLandingPage from '@/components/home/SiteLandingPage.vue'
import type { Set } from '@/types/set'
import { api } from '@/api'
import FlashCardViewer from '@/components/study/FlashCardViewer.vue'

const sets = ref<Set[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const isMobile = ref(false)
isMobile.value = window.innerWidth < 768

const fetchSets = async () => {
  loading.value = true
  error.value = null

  try {
    const res = await api.get('/sets', {
      params: {
        page: 1,
        limit: 3,
        sortOrder: 'featured',
        fields: 'id'
      }
    })

    // Handle paginated response format
    const { items } = res.data
    sets.value = items || []

    console.log('--------------------------------')
    console.log('res: ', res.data)
    console.log('sets: ', sets.value)

  } catch (err: any) {
    console.error('Error fetching sets:', err)
    error.value = err.message || 'Failed to load sets'
    sets.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchSets)
</script>

<style scoped></style>
