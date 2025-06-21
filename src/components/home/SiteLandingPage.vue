<template>
  <div class="py-6">
    <div class="max-w-7xl mx-auto px-6">
      <!-- Hero Section -->
      <div class="text-center mb-8">
        <div>
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-2 tracking-tight">Flashcard Academy</h1>
          <p class="text-lg text-gray-600 mb-6">{{ siteDescription }}</p>
          <div class="flex gap-4 justify-center flex-wrap">
            <button class="button button-primary" @click="browseSets">Browse Sets</button>
            <button class="button button-secondary" @click="createSet">Create Your Own</button>
          </div>
        </div>
      </div>

      <!-- Stats & Newest User Row -->
      <div class="flex items-center justify-between gap-8 mb-8 p-4 md:p-6 bg-white rounded-xl border border-gray-200">
        <div class="flex gap-8 flex-1">
          <div class="flex flex-col items-center gap-1">
            <span class="text-2xl font-bold text-blue-600">{{ formatNumber(setsCount) }}</span>
            <span class="text-xs text-gray-500 font-medium uppercase tracking-wider">Sets</span>
          </div>
          <div class="flex flex-col items-center gap-1">
            <span class="text-2xl font-bold text-blue-600">{{ formatNumber(usersCount) }}</span>
            <span class="text-xs text-gray-500 font-medium uppercase tracking-wider">Educators</span>
          </div>
          <div class="flex flex-col items-center gap-1">
            <span class="text-2xl font-bold text-blue-600">{{ formatNumber(categoriesCount) }}</span>
            <span class="text-xs text-gray-500 font-medium uppercase tracking-wider">Categories</span>
          </div>
        </div>
        
        <div v-if="newestUser" @click="viewEducator(newestUser.name)" class="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border border-gray-200 min-w-[200px] hover:bg-gray-50">
          <div class="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-blue-600">
            <img v-if="newestUser.image" :src="newestUser.image" :alt="newestUser.name" loading="lazy" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-base bg-gray-100">
              <i class="fas fa-user"></i>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded mb-1 uppercase tracking-wider w-fit">Newest</div>
            <div class="text-sm font-semibold text-gray-900 truncate">{{ newestUser.name }}</div>
          </div>
        </div>
      </div>

      <!-- Categories Section -->
      <div class="bg-white rounded-xl p-6 border border-gray-200">
        <div class="text-center mb-6">
          <h2 class="text-2xl font-semibold text-gray-900">Explore by Category</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div v-for="category in categoriesWithSets" :key="category.id" class="border border-gray-200 rounded-lg">
            <div class="p-3 bg-white border-b border-gray-200 flex justify-between items-center">
              <h3 class="text-base font-semibold text-gray-900">{{ category.name }}</h3>
              <a class="text-blue-600 text-xs font-medium underline cursor-pointer" @click="viewCategory(category.name)">View All</a>
            </div>
            <div class="flex flex-col gap-3 p-3">
              <div v-for="set in category.sets" :key="set.id" class="flex gap-2 bg-gray-50 rounded-md overflow-hidden cursor-pointer transition-colors border border-gray-200 p-1 hover:bg-gray-100" @click="viewSet(set.id)">
                <div class="w-24 h-20 flex-shrink-0">
                  <img 
                    v-if="set.thumbnail" 
                    :src="set.thumbnail" 
                    :alt="set.title"
                    loading="lazy"
                    class="w-full h-full object-contain"
                    @error="handleImageError"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center text-gray-400 text-xl">
                    <i class="fas fa-layer-group"></i>
                  </div>
                </div>
                <div class="flex-1 p-2 min-w-0">
                  <h4 class="text-xs font-semibold text-gray-900 mb-1 line-clamp-1 leading-tight mt-0">{{ set.title }}</h4>
                  <div class="flex flex-col gap-0.5 text-xs text-gray-500">
                    <span class="truncate">{{ set.educator?.name || 'Unknown' }}</span>
                    <span class="font-semibold text-green-600" v-if="set.price > 0">${{ set.price }}</span>
                    <span class="font-semibold text-green-600" v-else>Free</span>
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
import { useRouter } from 'vue-router'
import { api } from '@/api'
import { cachedApiEndpoints } from '@/services/CachedApiService'

const router = useRouter()

// Reactive data
const setsCount = ref(0)
const usersCount = ref(0)
const categoriesCount = ref(0)
const newestUser = ref<any>(null)
const categoriesWithSets = ref<any[]>([])

const siteDescriptions = ["Think like Wikipedia, but for flashcards.", "Videos are lame, flashcards rule.", "Flip, flip, flip-a-flashcard.", "Mysterious world of flashcards. They don't want you to know about."]
const siteDescription = ref(siteDescriptions[Math.floor(Math.random() * siteDescriptions.length)])

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

const browseSets = () => {
  router.push('/browse')
}

const createSet = () => {
  router.push('/creator')
}

const viewSet = (id: string) => {
  router.push(`/sets/${id}`)
}

const viewEducator = (id: string) => {
  router.push('/u/' + id)
}

const viewCategory = (categoryName: string) => {
  router.push(`/browse?category=${encodeURIComponent(categoryName)}`)
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

    // Newest user
    try {
      const newestUserData = await cachedApiEndpoints.getNewestUser()
      newestUser.value = newestUserData
    } catch (error) {
      console.error('Error loading newest user:', error)
    }

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