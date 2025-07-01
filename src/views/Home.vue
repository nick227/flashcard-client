<template>
  <div class="home-page">

    <!-- Home Hero -->
    <div class="container-main  py-8">
      <HomeHero />
    </div>

    <!-- Site Landing Page -->
    <div v-if="!isMobile" class="container-main -main py-8">
      <SiteLandingPage />
    </div>

    <!-- All Sets Grid -->
    <section class="section">
      <h2 class="text-2xl font-bold text-gray-900 flex justify-center mb-8">Newest</h2>
      <div v-if="loading" class="text-gray-500 text-center">Loading sets...</div>
      <div v-else class="cards-grid">
        <SetPreviewCard
          v-for="set in sets"
          :key="set.id"
          :set="set"
          @view="viewSet"
        />
      </div>
    </section>

    <div class="container-main py-0">
      <!-- Call to Action Section -->
      <section class="section text-center">
        <h2 class="text-2xl font-bold mb-4">Ready to start your learning journey?</h2>
        <p class="mb-6 text-lg opacity-80 max-w-2xl mx-auto">Sign up for free and get instant access to hundreds of
          flash card sets, or create your own to help others learn.</p>
        <a href="/creator" class="button button-accent text-lg px-10 py-4">Get Started</a>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import HomeHero from '@/components/sections/HomeHero.vue'
import SetPreviewCard from '@/components/cards/SetPreviewCard.vue'
import SiteLandingPage from '@/components/home/SiteLandingPage.vue'
import type { Set } from '@/types/set'
import { api } from '@/api'

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
        limit: 12,
        sortOrder: 'newest'
      }
    })

    // Handle paginated response format
    const { items } = res.data
    sets.value = items || []
    
  } catch (err: any) {
    console.error('Error fetching sets:', err)
    error.value = err.message || 'Failed to load sets'
    sets.value = []
  } finally {
    loading.value = false
  }
}

const viewSet = (setId: number) => {
  //router.push({ path: '/study', query: { set: setId } })
  window.location.href = '/study/' + setId
}

onMounted(fetchSets)
</script>

<style scoped></style>
