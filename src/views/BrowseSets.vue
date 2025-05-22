<template>
  <Navbar />
  <div class="container py-0">
    <BrowseHero />

    <!-- Filter & Sort Controls -->
    <section class="flex items-center justify-between h-full w-full mb-8">
      <div class="flex items-center gap-4">
        <label for="category" class="font-medium text-gray-700">Category:</label>
        <select id="category" v-model="selectedCategory" class="min-w-[140px]" @change="onCategoryChange">
          <option value="">All Categories</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>

        <label for="setType" class="font-medium text-gray-700 ml-4">Set Type:</label>
        <select id="setType" v-model="selectedSetType" class="min-w-[140px]" @change="onSetTypeChange">
          <option value="">All Types</option>
          <option value="free">Free</option>
          <option value="premium">Premium</option>
          <option value="subscriber">Subscriber Only</option>
        </select>
      </div>
      <div class="flex items-center gap-4">
        <label for="sort" class="font-medium text-gray-700">Sort by:</label>
        <select id="sort" v-model="sortOrder" class="min-w-[140px]">
          <option value="featured">Featured</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>
    </section>

    <!-- Error Message -->
    <div v-if="error" class="text-red-500 text-center mb-4">
      {{ error }}
    </div>

    <!-- Sets Grid -->
    <section class="section">
      <div v-if="loading && !sets.length" class="flex justify-center items-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
      <div v-else-if="error" class="text-red-500 text-center py-8">
        {{ error }}
        <button 
          @click="() => loadSets(true)" 
          class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
      <div v-else class="cards-grid">
        <SetPreviewCard
          v-for="set in sets"
          :key="set.id"
          :set="set"
          @view="viewSet"
        />
      </div>
      <!-- Loading indicator for pagination -->
      <div v-if="loading && sets.length" class="flex justify-center items-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
      <!-- End of content message -->
      <div v-if="!hasMore && sets.length" class="text-center text-gray-500 py-8">
        No more sets to load
      </div>
      <!-- Empty state -->
      <div v-if="!loading && !error && !sets.length" class="text-center text-gray-500 py-8">
        No sets found. Try changing your filters.
      </div>
      <!-- Sentinel element for infinite scroll -->
      <div v-if="hasMore" ref="sentinel" class="h-4"></div>
    </section>
  </div>
</template>

<script setup lang="ts">
import Navbar from '../components/common/Navbar.vue'
import BrowseHero from '../components/sections/BrowseHero.vue'
import SetPreviewCard from '../components/cards/SetPreviewCard.vue'
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSets } from '../composables/useSets'

const route = useRoute()
const router = useRouter()
const sentinel = ref<HTMLElement | null>(null)
const selectedSetType = ref('')

const {
  sets,
  loading,
  selectedCategory,
  sortOrder,
  categories,
  hasMore,
  error,
  loadSets,
  updateCategory,
  updateSortOrder,
  updateSetType
} = useSets()

// Watch for route changes to update selected category
watch(() => route.params.category, (newCategory) => {
  if (newCategory) {
    updateCategory(decodeURIComponent(newCategory as string))
  } else {
    updateCategory('')
  }
}, { immediate: true })

// Watch for sort order changes
watch(sortOrder, (newOrder) => {
  updateSortOrder(newOrder)
})

const onCategoryChange = () => {
  if (selectedCategory.value) {
    router.push(`/browse/${encodeURIComponent(selectedCategory.value)}`)
  } else {
    router.push('/browse')
  }
}

const onSetTypeChange = () => {
  updateSetType(selectedSetType.value)
}

const viewSet = (setId: number) => {
  router.push({ path: '/study', query: { set: setId } })
}

// Intersection Observer for infinite scroll
let observer: IntersectionObserver | null = null

onMounted(() => {
  // Small delay to ensure DOM is ready
  setTimeout(() => {
    observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore.value && !loading.value) {
        loadSets()
      }
    }, { 
      threshold: 0.1,
      rootMargin: '100px'
    })

    if (sentinel.value) {
      observer.observe(sentinel.value)
    }
  }, 100)
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})

// Cleanup on route change
watch(() => route.fullPath, () => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})
</script>

<style scoped>
.cards-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}
</style> 