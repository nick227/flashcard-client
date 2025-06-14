<template>
  <div class="container py-0">
    <HomeHero />

    <!-- Featured Set -->
    <div v-if="featuredSet">
      <FeaturedSet :set="featuredSet" @view="startLearning" />
    </div>

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
import type { Set } from '@/types/set'
import { api } from '@/api'

const router = useRouter()
const sets = ref<Set[]>([])
const loading = ref(true)
const featuredSet = ref<Set | null>(null)
const error = ref<string | null>(null)

const fetchSets = async () => {
  loading.value = true
  error.value = null
  
  try {
    const res = await api.get('/sets', {
      params: {
        page: 1,
        limit: 9,
        sortOrder: 'newest'
      }
    })
    
    // Handle paginated response format
    const { items } = res.data
    sets.value = items || []
    
    // Find a featured set or use the first one
    if (sets.value.length > 0) {
      const set = sets.value[0]
      // Ensure all required properties are present
      featuredSet.value = {
        ...set,
        educatorId: set.educatorId || set.userId, // Fallback to userId if educatorId is not present
        educatorName: set.educatorName || 'Anonymous', // Fallback to Anonymous if educatorName is not present
        tags: set.tags || [], // Ensure tags is always an array
        price: set.price || { type: 'free' }, // Ensure price is always present
        views: set.views || 0,
        likes: set.likes || 0,
        cardsCount: set.cardsCount || 0,
        type: set.type || 'free',
        isPublic: set.isPublic ?? true,
        hidden: set.hidden ?? false,
        thumbnail: set.thumbnail || set.thumbnailUrl || ''
      }
    } else {
      featuredSet.value = null
    }
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
