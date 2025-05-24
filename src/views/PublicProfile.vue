<template>
  
  <div class="container flex flex-col items-center justify-center py-16 min-h-screen">
    <div v-if="loading" class="text-gray-500">Loading profile...</div>
    <div v-else-if="error" class="text-red-500">{{ error }}</div>
    <div v-else-if="educator" class="w-full max-w-6xl">
      <!-- Educator Info Section -->
      <div class="flex items-center gap-6 mb-12">
        <div class="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
          <img v-if="educator.image" :src="educator.image" alt="avatar" class="w-24 h-24 mb-2 rounded-full" />
          <i v-else class="fa-solid fa-user text-4xl text-gray-400"></i>
        </div>
        <div>
          <h1 class="text-3xl font-bold mb-2">{{ educator.name }}</h1>
          <p v-if="educator.bio" class="text-gray-600 mb-4">{{ educator.bio }}</p>
          <p v-else class="text-gray-400 italic">No bio available</p>
        </div>
      </div>

      <!-- Sets Grid -->
      <div class="mb-8">
        <h2 class="text-2xl font-semibold mb-6">Flash Card Sets</h2>
        <div v-if="sets.length === 0" class="text-gray-500">
          This educator hasn't created any sets yet.
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SetPreviewCard
            v-for="set in sets"
            :key="set.id"
            :set="set"
            @view="viewSet"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToaster } from '@/composables/useToaster'
import SetPreviewCard from '@/components/cards/SetPreviewCard.vue'
import axios from 'axios'
import { apiEndpoints } from '@/api/index'
import type { User, FlashCardSet } from '@/types'

const route = useRoute()
const router = useRouter()
const { toast } = useToaster()

// The userName from the URL is the target educator's name
const targetEducatorName = route.params.userName as string
const educator = ref<User | null>(null)
const sets = ref<FlashCardSet[]>([])
const loading = ref(true)
const error = ref('')

const fetchEducatorProfile = async () => {
  try {
    // Find the educator by their name
    const res = await axios.get(`${apiEndpoints.users}?name=${targetEducatorName}`)
    console.log('Educator data:', res.data) // Debug log
    if (res.data.length === 0) {
      error.value = 'Educator not found'
      toast('Educator not found', 'error')
      router.push('/')
      return
    }
    educator.value = res.data[0]
    if (educator.value) {
      console.log('Educator bio:', educator.value.bio) // Debug log
    }
  } catch (err) {
    console.error('Failed to fetch educator:', err)
    error.value = 'Failed to load profile'
    toast('Failed to load profile', 'error')
  }
}

const fetchEducatorSets = async () => {
  if (!educator.value) return
  try {
    // Get all non-hidden sets for this educator with pagination
    const params = new URLSearchParams({
      educatorId: educator.value.id.toString(),
      page: '1',
      limit: '50',
      sortOrder: 'newest'
    })
    
    console.log('Fetching sets with params:', params.toString())
    const res = await axios.get(`${apiEndpoints.sets}?${params.toString()}`)
    console.log('Sets response:', res.data)
    sets.value = res.data.items || res.data
  } catch (err: any) {
    console.error('Failed to fetch sets:', err)
    if (err.response) {
      console.error('Error response:', err.response.data)
    }
    error.value = 'Failed to load sets'
  }
}

const viewSet = (setId: number) => {
  router.push(`/study/${setId}`)
}

onMounted(async () => {
  loading.value = true
  await fetchEducatorProfile()
  await fetchEducatorSets()
  loading.value = false
})
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}
</style> 