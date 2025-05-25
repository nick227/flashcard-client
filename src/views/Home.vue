<template>
  <div class="container py-0">
    <HomeHero />

    <!-- Featured Set -->
    <FeaturedSet :set="featuredSet" @view="startLearning" />

    <!-- All Sets Grid -->
    <section class="section">
      <h2 class="mb-8 text-2xl font-bold text-center">Popular Sets</h2>
      <div v-if="loading" class="text-gray-500 text-center">Loading sets...</div>
      <div v-else class="cards-grid">
        <SetPreviewCard
          v-for="set in sets"
          :key="set.id"
          :set="set"
          @view="startLearning"
        />
      </div>
    </section>

    <!-- Call to Action Section -->
    <section class="section text-center">
      <h2 class="text-2xl font-bold mb-4">Ready to start your learning journey?</h2>
      <p class="mb-6 text-lg opacity-80 max-w-2xl mx-auto">Sign up for free and get instant access to hundreds of flash card sets, or create your own to help others learn.</p>
      <button @click="router.push('/creator')" class="button button-accent text-lg px-10 py-4">Get Started</button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import HomeHero from '../components/sections/HomeHero.vue'
import SetPreviewCard from '../components/cards/SetPreviewCard.vue'
import FeaturedSet from '../components/home/FeaturedSet.vue'
import type { FlashCardSet } from '../types'
import { api } from '@/api'

const router = useRouter()
const sets = ref<FlashCardSet[]>([])
const loading = ref(true)
const featuredSet = ref<FlashCardSet | null>(null)
const error = ref<string | null>(null)

const fetchSets = async () => {
  loading.value = true
  error.value = null
  
  try {
    const res = await api.get('/sets', {
      params: {
        page: 1,
        limit: 10,
        sortOrder: 'newest'
      }
    })
    
    // Handle paginated response format
    const { items, pagination } = res.data
    sets.value = items || []
    
    // Debug logs
    console.log('API Response:', res.data)
    console.log('Sets:', sets.value)
    console.log('Pagination:', pagination)
    
    // Find a featured set or use the first one
    featuredSet.value = sets.value[0] || null
    console.log('Featured set:', featuredSet.value)
  } catch (err: any) {
    console.error('Error fetching sets:', err)
    error.value = err.message || 'Failed to load sets'
    sets.value = []
    featuredSet.value = null
  } finally {
    loading.value = false
  }
}

const startLearning = (setId: number) => {
  router.push({ path: '/study', query: { set: setId } })
}

onMounted(fetchSets)
</script>
