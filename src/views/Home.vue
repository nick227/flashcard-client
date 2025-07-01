<template>
  <div class="home-page">
    <div class="container-main py-0 mb-8">
      <HomeHero />
    </div>

    <div class="container-main py-0 mb-8">
      <FlashCardViewer v-for="set in sets" :key="set.id" :set-id="set.id" :hideRelatedSets="true" />
    </div>

    <div v-if="!isMobile" class="container-main -main py-8">
      <SiteLandingPage />
    </div>

    <div class="container-main py-0 mb-8">
      <BrowseHero />
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
import BrowseHero from '@/components/sections/BrowseHero.vue'

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
        limit: 10,
        sortOrder: 'newest',
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
