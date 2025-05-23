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
import axios from 'axios'
import HomeHero from '../components/sections/HomeHero.vue'
import SetPreviewCard from '../components/cards/SetPreviewCard.vue'
import FeaturedSet from '../components/home/FeaturedSet.vue'
import type { FlashCardSet } from '../types'

const router = useRouter()
const sets = ref<FlashCardSet[]>([])
const loading = ref(true)
const featuredSet = ref<FlashCardSet | null>(null)

const fetchSets = async () => {
  console.log('JWT before fetching sets:', localStorage.getItem('jwt'));
  console.log('Axios default Authorization:', axios.defaults.headers.common['Authorization']);
  loading.value = true
  try {
    const res = await axios.get('http://localhost:5000/sets')
    // Handle new paginated response format
    const setsData = res.data.items || res.data
    sets.value = setsData
    // Debug log to see all sets
    console.log('All sets:', JSON.parse(JSON.stringify(sets.value)))
    
    // Find a featured set or use the first one
    const featured = sets.value.find(s => s.featured) || sets.value[0]
    console.log('Featured set data:', JSON.parse(JSON.stringify(featured)))
    featuredSet.value = featured
  } catch (err) {
    console.error('Error fetching sets:', err)
  } finally {
    loading.value = false
  }
}

const startLearning = (setId: number) => {
  router.push({ path: '/study', query: { set: setId } })
}

onMounted(fetchSets)
</script>
