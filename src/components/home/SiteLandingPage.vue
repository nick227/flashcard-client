<template>
  <div class="py-8x">
    <div class="w-full mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Stats Row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
        <div class="bg-white rounded-2xl transition p-6 flex flex-col items-center">
          <span class="text-3xl font-bold text-gray-900">{{ formatNumber(setsCount) }}</span>
          <span class="text-xs text-gray-500 uppercase tracking-wider mt-1">Sets</span>
        </div>
        <div class="bg-white rounded-2xl transition p-2 flex flex-col items-center">
          <span class="text-3xl font-bold text-gray-900">{{ formatNumber(usersCount) }}</span>
          <span class="text-xs text-gray-500 uppercase tracking-wider mt-1">Educators</span>
        </div>
        <div class="bg-white rounded-2xl transition p-2 flex flex-col items-center">
          <span class="text-3xl font-bold text-gray-900">{{ formatNumber(categoriesCount) }}</span>
          <span class="text-xs text-gray-500 uppercase tracking-wider mt-1">Categories</span>
        </div>
      </div>

      <!-- Categories Section -->
      <div class="bg-white rounded-2xl p-8 border border-gray-200">
        <h2 class="text-2xl font-bold text-gray-900 flex justify-center mb-8">Categories</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 category-titles">
          <div @click="viewCategory(category.name)" v-for="category in categoryNames" :key="category.id"   class="category-title flex flex-col items-center justify-center bg-gray-100 rounded-lg p-0 cursor-pointer">
            <h3 class="text-lg font-semibold text-gray-800">{{ category.name }} ({{ category.setCount }})</h3>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/api'
import { cachedApiEndpoints } from '@/services/CachedApiService'

// Reactive data
const setsCount = ref(0)
const usersCount = ref(0)
const categoriesCount = ref(0)
const categoryNames = ref<any[]>([])
// Methods
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const viewCategory = (name: string) => {
  window.location.href = '/browse/' + name
}

// Load stats on mount
onMounted(async () => {
  try {
    // Sets count
    const setsCountRes = await api.get('/sets/count')
    setsCount.value = setsCountRes.data.count
    
    // Users count
    const usersCountRes = await api.get('/users/count')
    usersCount.value = usersCountRes.data.count
    
    // Categories count
    const categoriesCountRes = await api.get('/categories/count')
    categoriesCount.value = categoriesCountRes.data.count

    // Categories with sets
    try {
      //const isMobile = window.innerWidth < 768
      const categoriesData = await cachedApiEndpoints.getCategories(true)
      categoryNames.value = categoriesData as any[]
    } catch (error) {
      console.error('Error loading categories with sets:', error)
    }
  } catch (error) {
    console.error('Error loading stats:', error)
  }
})
</script>

<style scoped>
/* Only keeping essential custom styles that can't be easily replicated with Tailwind */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Responsive adjustments for mobile */
@media (max-width: 768px) {
  .button {
    width: 100%;
    max-width: 200px;
  }
}
</style>