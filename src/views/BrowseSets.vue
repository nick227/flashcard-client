<template>
  <div class="container-main  py-0">
    <HomeHero />
    <!-- Filter & Sort Controls -->
    <section class="my-8 gap-4 container-main">
      <!-- Categories -->
      <CategoryCloud view="all" />

      <div class="flex flex-wrap gap-4 w-full mt-8">
        <!-- Search -->
        <SearchInput v-model="searchQuery" @submit="onSearchSubmit" :disabled="loading" />
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
      <div ref="cardsGridRef" class="cards-grid">
        <SetPreviewCard v-for="set in sets || []" :key="set.id" :set="set" theme="small" @view="viewSet"
          :class="{ 'opacity-50': isTransitioning }" />
      </div>
      <!-- Loading indicator for pagination -->
      <FunnyLoadingIndicator v-if="(loading && sets?.length) || isBatchWaiting" />
      <LoadMoreButton v-if="showLoadMoreButton && hasMore" @click="handleLoadMore" />
      <!-- End of content message -->
      <div v-if="!hasMore && sets?.length" class="text-center text-gray-500 py-8 mb-8">
        <div class="text-2xl my-16"><span class="text-2xl">😢</span> That's all the sets.</div>
        <div class="w-full h-4 mt-4">
          <button @click="router.push('/create')" class="button button-accent text-white-500">Hey, what if you created
            one?</button>
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
import HomeHero from '../components/sections/HomeHero.vue'
import SetPreviewCard from '../components/cards/SetPreviewCard.vue'
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSets } from '@/composables/useSets'
import FunnyLoadingIndicator from '../components/common/FunnyLoadingIndicator.vue'
import LoadMoreButton from '../components/common/LoadMoreButton.vue'
import CategoryCloud from '../components/common/CategoryCloud.vue'
import SearchInput from '../components/common/SearchInput.vue'

const route = useRoute()
const router = useRouter()
const sentinel = ref<HTMLElement | null>(null)

const batchDelay = ref(0)
let batchTimeout: ReturnType<typeof setTimeout> | null = null
let isBatchWaiting = ref(false)
const batchCount = ref(0)
const showLoadMoreButton = computed(() => batchCount.value >= 3)

const {
  sets,
  loading,
  hasMore,
  error,
  searchQuery,
  isTransitioning,
  loadSets,
  updateSearch,
  initialize,
  currentPage
} = useSets()

const viewSet = (setId: number) => {
  //router.push({ path: '/study/' + setId })
  window.location.href = '/study/' + setId
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

onMounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
  if (batchTimeout) {
    clearTimeout(batchTimeout)
    batchTimeout = null
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

function onSearchSubmit(value: string) {
  const trimmed = value.trim()
  updateSearch(trimmed)
}
</script>

<style scoped>
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