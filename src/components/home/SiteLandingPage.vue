<template>
  <div class="py-8x">
    <div class="w-full mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Stats Row -->
      <div class="">
        <div class="">
          <span class="">{{ formatNumber(setsCount) }}</span>
          <span class="">Sets</span>
        </div>
        <div class="">
          <span class="">{{ formatNumber(usersCount) }}</span>
          <span class="">Educators</span>
        </div>
        <div class="">
          <span class="">{{ formatNumber(categoriesCount) }}</span>
          <span class="">Categories</span>
        </div>
      </div>

      <!-- Categories Section -->
      <div class="">
        <h2 class="">Categories</h2>
        <div class="">
          <div @click="viewCategory(category.name)" v-for="category in categoryNames" :key="category.id" 
          class="">
            <h3 class="">{{ category.name }} ({{ category.setCount }})</h3>
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