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
import SetPreviewCard from '@/components/cards/SetPreviewCard.vue'
import { api } from '@/api'
import type { User, FlashCardSet } from '@/types'

const route = useRoute()
const router = useRouter()

// The userName from the URL is the target educator's name
const targetEducatorName = route.params.userName as string
const educator = ref<User | null>(null)
const sets = ref<FlashCardSet[]>([])
const loading = ref(true)
const error = ref('')

const currentPage = ref(1)
const pageSize = ref(12)
const totalPages = ref(1)

const fetchEducator = async () => {
  try {
    const res = await api.get(`/users?name=${targetEducatorName}`)
    educator.value = res.data
  } catch (err) {
    console.error('Error fetching educator:', err)
  }
}

const fetchSets = async () => {
  try {
    const res = await api.get(`/sets`, {
      params: {
        educatorId: educator.value?.id,
        page: currentPage.value.toString(),
        limit: pageSize.value.toString()
      }
    })
    sets.value = res.data.sets
    totalPages.value = res.data.pagination.totalPages
  } catch (err) {
    console.error('Error fetching sets:', err)
  }
}

const viewSet = (setId: number) => {
  router.push(`/study/${setId}`)
}

onMounted(async () => {
  loading.value = true
  await fetchEducator()
  await fetchSets()
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