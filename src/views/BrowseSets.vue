<template>
  <div class="container-main  py-0">
    <BrowseHero />

    <!-- Filter & Sort Controls -->
    <section class="my-8 gap-4 container-main">
      
      <div class="flex flex-wrap gap-4 w-full">
        <!-- Category Dropdown -->
          <select 
            v-model="selectedCategory"
            @change="onCategoryChange"
            class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white max-w-[200px]"
          >
            <option value="">All Categories</option>
            <option 
              v-for="cat in categories" 
              :key="cat.id" 
              :value="cat.name"
            >
              {{ cat.name }} ({{ cat.setCount }})
            </option>
          </select>

        <!-- Set Type Dropdown -->
          <select 
            v-model="selectedSetType"
            @change="onSetTypeChange"
            class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white max-w-[200px]"
          >
            <option value="">All Types</option>
            <option value="free">Free</option>
            <option value="premium">Premium</option>
            <option value="subscriber">Subscriber</option>
          </select>
        <!-- Sort -->
          <select 
            id="sort" 
            v-model="sortOrder" 
            class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white max-w-[200px]"
          >
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        <!-- Search -->
        <div class="relative flex-1">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Search sets..." 
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 search-input"
            @input="onSearchInput"
            :disabled="loading"
          />
        </div>
      </div>
        <!-- Loading indicator -->
        <div v-if="loading" class="flex items-center">
          <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        </div>
    </section>

    <!-- Error Message -->
    <div v-if="error" class="text-red-500 text-center mb-4">
      {{ error }}
    </div>

    <!-- Sets Grid with Transition -->
    <section class="section">
      <transition-group 
        name="fade-grid" 
        tag="div" 
        class="cards-grid"
        :css="false"
        @before-enter="onBeforeEnter"
        @enter="onEnter"
        @leave="onLeave"
      >
        <SetPreviewCard
          v-for="set in sets || []"
          :key="set.id"
          :set="set"
          @view="viewSet"
          :class="{ 'opacity-50': isTransitioning }"
        />
      </transition-group>
      <!-- Loading indicator for pagination -->
      <FunnyLoadingIndicator v-if="(loading && sets?.length) || isBatchWaiting" />
      <LoadMoreButton v-if="showLoadMoreButton && hasMore" @click="handleLoadMore" />
      <!-- End of content message -->
      <div v-if="!hasMore && sets?.length" class="text-center text-gray-500 py-8 mb-8">
        <div class="text-2xl my-16"><span class="text-2xl">😢</span> That's all the sets.</div>
        <div class="w-full h-4 mt-4">
          <button @click="router.push('/create')" class="button button-accent text-white-500">Hey, what if you created one?</button>
        </div>
      </div>
      <!-- Empty state -->
      <div v-if="!loading && !error && !sets?.length" class="text-center text-gray-500 py-8">
        No sets found. Try changing your filters.
      </div>
      <!-- Sentinel element for infinite scroll -->
      <div v-if="hasMore" ref="sentinel" class="h-4"></div>
    </section>
  </div>
</template>

<script setup lang="ts">
import BrowseHero from '../components/sections/BrowseHero.vue'
import SetPreviewCard from '../components/cards/SetPreviewCard.vue'
import { ref, onMounted, watch, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSets } from '@/composables/useSets'
import FunnyLoadingIndicator from '../components/common/FunnyLoadingIndicator.vue'
import LoadMoreButton from '../components/common/LoadMoreButton.vue'
import { gsap } from 'gsap'

const route = useRoute()
const router = useRouter()
const sentinel = ref<HTMLElement | null>(null)
const selectedSetType = ref('')

const batchDelay = ref(0)
let batchTimeout: ReturnType<typeof setTimeout> | null = null
let isBatchWaiting = ref(false)
const batchCount = ref(0)
const showLoadMoreButton = computed(() => batchCount.value >= 3)

const {
  sets,
  loading,
  selectedCategory,
  sortOrder,
  categories,
  hasMore,
  error,
  searchQuery,
  isTransitioning,
  loadSets,
  updateCategory,
  updateSortOrder,
  updateSetType,
  updateSearch,
  initialize,
  currentPage
} = useSets()

// Animation hooks for transition-group
const onBeforeEnter = (el: Element) => {
  gsap.set(el, { opacity: 0, y: 20 })
}

const onEnter = (el: Element, done: () => void) => {
  gsap.to(el, {
    opacity: 1,
    y: 0,
    duration: 0.3,
    delay: Math.random() * 0.1, // Stagger effect
    onComplete: done
  })
}

const onLeave = (el: Element, done: () => void) => {
  gsap.to(el, {
    opacity: 0,
    y: -20,
    duration: 0.2,
    onComplete: done
  })
}

// Watch for route changes to update selected category
watch(() => route.params.category, (newCategory) => {
  if (newCategory) {
    updateCategory(decodeURIComponent(newCategory as string))
  } else {
    updateCategory('')
  }
  // Reset batch state on category change
  batchCount.value = 0
  isBatchWaiting.value = false
  if (batchTimeout) {
    clearTimeout(batchTimeout)
    batchTimeout = null
  }
}, { immediate: true })

// Watch for sort order changes
watch(sortOrder, (newOrder) => {
  updateSortOrder(newOrder)
  // Reset batch state on sort change
  batchCount.value = 0
  isBatchWaiting.value = false
  if (batchTimeout) {
    clearTimeout(batchTimeout)
    batchTimeout = null
  }
})

const onCategoryChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const catName = target.value
  // Update URL without triggering a full route change
  const newPath = catName ? `/browse/${encodeURIComponent(catName)}` : '/browse'
  window.history.pushState({}, '', newPath)
  updateCategory(catName)
}

const onSetTypeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const type = target.value
  updateSetType(type)
}

const viewSet = (setId: number) => {
  //router.push({ path: '/study/' + setId })
  window.location.href = '/study/' + setId
}

// Debounced search input
const debouncedSearch = ref<number | null>(null)
const onSearchInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value.trim()
  
  if (debouncedSearch.value) {
    clearTimeout(debouncedSearch.value)
  }
  
  debouncedSearch.value = window.setTimeout(() => {
    if (value.length >= 2 || value.length === 0) {
      updateSearch(value)
    }
  }, 300)
}

// Intersection Observer for infinite scroll
let observer: IntersectionObserver | null = null

const triggerNextBatch = () => {
  if (isBatchWaiting.value || loading.value || showLoadMoreButton.value) return
  
  // Only increment batch count if we're not at the first page
  if (currentPage.value > 1) {
    batchCount.value++
  }
  
  isBatchWaiting.value = true
  batchDelay.value = Math.floor(Math.random() * 3000) + 500 // random delay
  batchTimeout = setTimeout(() => {
    loadSets()
    isBatchWaiting.value = false
  }, batchDelay.value)
}

const handleLoadMore = () => {
  batchCount.value = 0
  isBatchWaiting.value = false
  if (batchTimeout) {
    clearTimeout(batchTimeout)
    batchTimeout = null
  }
  loadSets()
}

onMounted(() => {
  // Initialize categories and sets
  initialize()
  
  // Small delay to ensure DOM is ready
  setTimeout(() => {
    observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore.value && !loading.value && !isBatchWaiting.value) {
        triggerNextBatch()
      }
    }, { 
      threshold: 0.1,
      rootMargin: '200px' // Increased margin to trigger earlier
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
  if (batchTimeout) {
    clearTimeout(batchTimeout)
    batchTimeout = null
  }
  if (debouncedSearch.value) {
    clearTimeout(debouncedSearch.value)
  }
})

// Cleanup on route change
watch(() => route.fullPath, () => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
  // Reset batch state
  batchCount.value = 0
  isBatchWaiting.value = false
  if (batchTimeout) {
    clearTimeout(batchTimeout)
    batchTimeout = null
  }
})
</script>

<style scoped>
.cards-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
  position: relative;
}

.search-input {
  width: calc(100% - 20px);
}

@media (max-width: 768px) {
  select {
    width: 100% !important;
    max-width: 100% !important;
  }
}
</style> 