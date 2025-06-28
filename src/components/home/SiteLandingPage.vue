<template>
  <div class="py-8x">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      <!-- Stats Row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
        <div class="bg-white rounded-2xl transition p-6 flex flex-col items-center">
          <i class="fa-solid fa-layer-group text-blue-500 text-3xl mb-2"></i>
          <span class="text-3xl font-bold text-gray-900">{{ formatNumber(setsCount) }}</span>
          <span class="text-xs text-gray-500 uppercase tracking-wider mt-1">Sets</span>
        </div>
        <div class="bg-white rounded-2xl transition p-2 flex flex-col items-center">
          <i class="fa-solid fa-chalkboard-user text-green-500 text-3xl mb-2"></i>
          <span class="text-3xl font-bold text-gray-900">{{ formatNumber(usersCount) }}</span>
          <span class="text-xs text-gray-500 uppercase tracking-wider mt-1">Educators</span>
        </div>
        <div class="bg-white rounded-2xl transition p-2 flex flex-col items-center">
          <i class="fa-solid fa-tags text-yellow-500 text-3xl mb-2"></i>
          <span class="text-3xl font-bold text-gray-900">{{ formatNumber(categoriesCount) }}</span>
          <span class="text-xs text-gray-500 uppercase tracking-wider mt-1">Categories</span>
        </div>
      </div>

      <!-- Categories Section -->
      <div class="bg-white rounded-2xl p-8 border border-gray-200">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div v-for="category in categoriesWithSets" :key="category.id" class="rounded-xl transition border border-gray-100 flex flex-col">
            <div class="flex flex-col gap-3 p-4 flex-1">
              <div v-for="set in category.sets" :key="set.id" class="flex gap-3 items-center bg-white rounded-lg border border-gray-200 p-2 cursor-pointer transition" @click="viewSet(set.id)">
                <div class="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                  <img v-if="set.thumbnail" :src="set.thumbnail" :alt="set.title" class="w-full h-full object-contain" @error="handleImageError" />
                  <i v-else class="fas fa-layer-group text-gray-300 text-2xl"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="text-sm font-semibold text-gray-900 mb-1 truncate">{{ set.title }}</h4>
                  <div class="flex items-center gap-2 text-xs text-gray-500">
                    <span class="truncate">{{ set.educator?.name || 'Unknown' }}</span>
                    <span v-if="set.price > 0" class="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-semibold">${{ set.price }}</span>
                    <span v-else class="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">Free</span>
                  </div>
                </div>
              </div>
            </div>
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
const categoriesWithSets = ref<any[]>([])
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

const viewSet = (id: string) => {
  window.location.href = '/sets/' + id
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  if (target) {
    target.style.display = 'none'
    const placeholder = target.nextElementSibling as HTMLElement
    if (placeholder) {
      placeholder.style.display = 'flex'
    }
  }
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
      const isMobile = window.innerWidth < 768
      const catNum = isMobile ? 1 : 4
      const setsPerCat = isMobile ? 4 : 5
      const categoriesData = await cachedApiEndpoints.getRandomCategoriesWithSets(catNum, setsPerCat)
      categoriesWithSets.value = categoriesData as any[]
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