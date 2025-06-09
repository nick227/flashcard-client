<template>
  <div class="container py-0">
    <BrowseHero />

    <!-- Filter & Sort Controls -->
    <section class="w-full mb-8 gap-4">
      <div class="flex flex-wrap gap-4 w-full">
        <!-- Category Chips -->
        <div class="flex flex-wrap gap-2 mb-2 w-full">
          <button
            @click="onCategoryChipClick('')"
            :class="[
              'px-4 py-1 rounded-full border transition-colors',
              !selectedCategory
                ? 'bg-blue-600 text-white border-blue-600 shadow'
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-100 hover:border-blue-400'
            ]"
          >
            All Categories
          </button>
          <button
            v-for="cat in categories"
            :key="cat.id"
            @click="onCategoryChipClick(cat.name)"
            :class="[
              'px-4 py-1 rounded-full border transition-colors',
              selectedCategory === cat.name
                ? 'bg-blue-600 text-white border-blue-600 shadow'
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-100 hover:border-blue-400'
            ]"
          >
            {{ cat.name }} <span class="ml-1 text-xs">({{ cat.setCount }})</span>
          </button>
        </div>
        <!-- Set Type Chips -->
        <div class="flex flex-wrap gap-2 mb-2">
          <button
            @click="onSetTypeChipClick('')"
            :class="[
              'px-4 py-1 rounded-full border transition-colors',
              !selectedSetType
                ? 'bg-blue-600 text-white border-blue-600 shadow'
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-100 hover:border-blue-400'
            ]"
          >
            All Types
          </button>
          <button
            @click="onSetTypeChipClick('free')"
            :class="[
              'px-4 py-1 rounded-full border transition-colors',
              selectedSetType === 'free'
                ? 'bg-blue-600 text-white border-blue-600 shadow'
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-100 hover:border-blue-400'
            ]"
          >
            Free
          </button>
          <button
            @click="onSetTypeChipClick('premium')"
            :class="[
              'px-4 py-1 rounded-full border transition-colors',
              selectedSetType === 'premium'
                ? 'bg-blue-600 text-white border-blue-600 shadow'
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-100 hover:border-blue-400'
            ]"
          >
            Premium
          </button>
          <button
            @click="onSetTypeChipClick('subscriber')"
            :class="[
              'px-4 py-1 rounded-full border transition-colors',
              selectedSetType === 'subscriber'
                ? 'bg-blue-600 text-white border-blue-600 shadow'
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-100 hover:border-blue-400'
            ]"
          >
            Subscriber
          </button>
        </div>
      </div>
      <!-- Search and Sort Controls -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4">
        <!-- Search -->
        <div class="relative flex-1 max-w-md">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Search sets..." 
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 search-input"
            @input="onSearchInput"
            :disabled="loading"
          />
          <button 
            v-if="searchQuery" 
            @click="clearSearch" 
            class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
            :disabled="loading"
          >
            <span class="sr-only">Clear search</span>
            ✕
          </button>
        </div>
        <!-- Sort -->
        <div class="flex items-center gap-2">
          <select 
            id="sort" 
            v-model="sortOrder" 
            class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
        <!-- Loading indicator -->
        <div v-if="loading" class="flex items-center">
          <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        </div>
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
  initialize
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
}, { immediate: true })

// Watch for sort order changes
watch(sortOrder, (newOrder) => {
  updateSortOrder(newOrder)
})

const onCategoryChipClick = (catName: string) => {
  // Update URL without triggering a full route change
  const newPath = catName ? `/browse/${encodeURIComponent(catName)}` : '/browse'
  window.history.pushState({}, '', newPath)
  updateCategory(catName)
}

const onSetTypeChipClick = (type: string) => {
  selectedSetType.value = type
  updateSetType(type)
}

const viewSet = (setId: number) => {
  router.push({ path: '/study', query: { set: setId } })
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
  isBatchWaiting.value = true
  batchDelay.value = Math.floor(Math.random() * 3000) + 500 // random delay
  batchTimeout = setTimeout(() => {
    loadSets()
    isBatchWaiting.value = false
    batchCount.value++
  }, batchDelay.value)
}

const handleLoadMore = () => {
  batchCount.value = 0
  triggerNextBatch()
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

const clearSearch = () => {
  searchQuery.value = ''
  updateSearch('')
}
</script>

<style scoped>
.cards-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
  position: relative;
}

.search-input {
  width: calc(100% - 20px);
}
</style> 