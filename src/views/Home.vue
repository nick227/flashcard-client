<template>
  <div class="home-page">
    <!-- Browse Hero - Main landing section -->
    <section class="hero-section">
      <BrowseHero />
    </section>

    <!-- Newest Sets Section -->
    <section class="newest-sets-section">
      <div class="container-main">
        <h2 class="section-title">Latest Sets</h2>
        
        <!-- Loading indicator for newest sets -->
        <div v-if="newestSetsLoading && !newestSets.length" class="loading-container">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="loading-text">Loading latest sets...</p>
        </div>
        
        <!-- Error state for newest sets -->
        <div v-if="newestSetsError" class="error-container">
          <p class="error-text">{{ newestSetsError }}</p>
          <button @click="loadMoreNewestSets" class="retry-button">Try Again</button>
        </div>
        
        <!-- Newest sets display -->
        <transition-group v-if="newestSets.length" name="fade" tag="div" class="newest-sets-list">
          <div 
            v-for="id in newestSets" 
            :key="id" 
            class="newest-set-item alternate-bg"
            :aria-label="`Flashcard set ${id}`"
          >
            <FlashCardViewer 
              :set-id="id" 
              :hideRelatedSets="true" 
              :hideHistory="true" 
            />
          </div>
        </transition-group>

        <!-- Load More Button for Newest Sets -->
        <div class="load-more-container">
          <LoadMoreSetsButton
            v-if="!noMoreResults && newestSets.length > 0"
            :loading="newestSetsLoading"
            @loadMore="loadMoreNewestSets"
          />
          <div v-else-if="newestSets.length > 0" class="end-message">
            🎉 You've reached the end of the latest sets!
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Sets Grid -->
    <section class="featured-sets-section">
      <div class="container-main">
        <h2 class="section-title">Featured Sets</h2>
        
        <!-- Loading indicator -->
        <div v-if="loading && !sets?.length" class="loading-container">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="loading-text">Loading featured sets...</p>
        </div>
        
        <!-- Error Message -->
        <div v-if="error" class="error-container">
          <p class="error-text">{{ error }}</p>
          <button @click="initialize" class="retry-button">Try Again</button>
        </div>
        
        <!-- Sets Grid -->
        <div v-if="sets?.length" ref="cardsGridRef" class="cards-grid" role="grid" aria-label="Featured flashcard sets">
          <SetPreviewCard 
            v-for="set in sets" 
            :key="set.id" 
            :set="set" 
            theme="small" 
            @view="viewSet"
            :class="{ 'opacity-50': isTransitioning }" 
            role="gridcell"
          />
        </div>
        
        <!-- Loading indicator for pagination -->
        <FunnyLoadingIndicator v-if="(loading && sets?.length) || isBatchWaiting" />
        
        <!-- Load More Button -->
        <LoadMoreButton v-if="showLoadMoreButton && hasMore" @click="handleLoadMore" />
        
        <!-- End of content message -->
        <div v-if="!hasMore && sets?.length" class="end-content-container">
          <div class="end-content-message">
            <span class="emoji">😢</span>
            <p>That's all the sets.</p>
          </div>
          <button 
            @click="router.push('/create')" 
            class="create-set-button"
            aria-label="Create a new flashcard set"
          >
            Hey, what if you created one?
          </button>
        </div>
        
        <!-- Empty state -->
        <div v-if="!loading && !error && !sets?.length" class="empty-state">
          <p class="empty-state-text">No sets found. Try refreshing the page.</p>
          <button @click="initialize" class="retry-button">Refresh</button>
        </div>
        
        <!-- Sentinel element for infinite scroll -->
        <div v-if="hasMore" ref="sentinel" class="sentinel" aria-hidden="true"></div>
      </div>
    </section>

    <!-- Home Hero - Call to action section -->
    <section class="cta-section">
      <HomeHero />
    </section>

    <!-- Category Cloud and Stats -->
    <section class="stats-section">
      <div class="container-main">
        <CategoryCloud view="fader" />
        <StatsSection />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import HomeHero from '@/components/sections/HomeHero.vue'
import BrowseHero from '@/components/sections/BrowseHero.vue'
import SetPreviewCard from '@/components/cards/SetPreviewCard.vue'
import CategoryCloud from '@/components/common/CategoryCloud.vue'
import StatsSection from '@/components/common/StatsSection.vue'
import FunnyLoadingIndicator from '@/components/common/FunnyLoadingIndicator.vue'
import LoadMoreButton from '@/components/common/LoadMoreButton.vue'
import LoadMoreSetsButton from '@/components/common/LoadMoreSetsButton.vue'
import FlashCardViewer from '@/components/study/FlashCardViewer.vue'
import { useSets } from '@/composables/useSets'
import { api } from '@/api'

const router = useRouter()
const sentinel = ref<HTMLElement | null>(null)

// Newest sets state
const newestSets = ref<number[]>([])
const newestSetsLoading = ref(false)
const newestSetsError = ref<string | null>(null)
const noMoreResults = ref(false)
const newestSetsLimit = 3
const newestSetsOffset = ref(0)

// Batch loading state for featured sets
const batchDelay = ref(0)
let batchTimeout: ReturnType<typeof setTimeout> | null = null
let isBatchWaiting = ref(false)
const batchCount = ref(0)
const showLoadMoreButton = computed(() => batchCount.value >= 3)

// Use the sets composable
const {
  sets,
  loading,
  hasMore,
  error,
  isTransitioning,
  loadSets,
  initialize,
  currentPage
} = useSets()

// Navigation handler
const viewSet = (setId: number) => {
  router.push({ path: '/study/' + setId })
}

// Newest sets API call with caching
const getNewestSets = async ({ limit, offset, fields }: { limit: number, offset: number, fields?: string }) => {
  const res = await api.get('/sets', { 
    params: { 
      limit, 
      offset, 
      fields,
      sortOrder: 'newest' // Ensure we get newest sets
    } 
  })
  return res.data
}

// Load more newest sets with improved error handling
const loadMoreNewestSets = async () => {
  if (newestSetsLoading.value) return // Prevent multiple simultaneous calls
  
  newestSetsLoading.value = true
  newestSetsError.value = null
  
  try {
    const data = await getNewestSets({ 
      limit: newestSetsLimit, 
      offset: newestSetsOffset.value, 
      fields: 'id' 
    })
    
    if (data?.items && Array.isArray(data.items)) {
      const unique = data.items
        .map((item: { id: number }) => item.id)
        .filter((id: number) => !newestSets.value.includes(id))
      
      newestSets.value = [...newestSets.value, ...unique]
      newestSetsOffset.value += newestSetsLimit
      
      if (data.items.length < newestSetsLimit) {
        noMoreResults.value = true
      }
    } else {
      newestSetsError.value = 'No sets data received'
    }
  } catch (error) {
    console.error('Error loading more newest sets:', error)
    newestSetsError.value = 'Failed to load latest sets. Please try again.'
    noMoreResults.value = true
  } finally {
    newestSetsLoading.value = false
  }
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

// Initialize the component
onMounted(async () => {
  try {
    // Initialize both sets in parallel for better performance
    await Promise.all([
      loadMoreNewestSets(),
      initialize()
    ])
  } catch (error) {
    console.error('Error initializing Home page:', error)
  }

  // Set up intersection observer for infinite scroll
  setTimeout(() => {
    if (sentinel.value) {
      observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore.value && !loading.value && !isBatchWaiting.value) {
          triggerNextBatch()
        }
      }, {
        threshold: 0.1,
        rootMargin: '200px'
      })

      observer.observe(sentinel.value)
    }
  }, 100)
})

// Cleanup on unmount
onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
  if (batchTimeout) {
    clearTimeout(batchTimeout)
    batchTimeout = null
  }
})
</script>

<style scoped>
/* Main layout */
.home-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Section styling */
.hero-section {
  padding: 0;
}

.newest-sets-section,
.featured-sets-section {
  padding: 3rem 0;
}

.cta-section {
  padding: 2rem 0;
}

.stats-section {
  padding: 2rem 0 4rem;
}

/* Container */
.container-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Section titles */
.section-title {
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 2rem;
  color: #1f2937;
}

/* Loading states */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
  gap: 1rem;
}

.loading-text {
  color: #6b7280;
  font-size: 1rem;
}

/* Error states */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
  gap: 1rem;
}

.error-text {
  color: #dc2626;
  font-size: 1rem;
  text-align: center;
}

.retry-button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;
}

.retry-button:hover {
  background: #2563eb;
}

/* Newest sets */
.newest-sets-list {
  margin-bottom: 2rem;
}

.newest-set-item {
  padding: 3rem 0;
}

.alternate-bg:nth-child(odd) {
  background: #fafafa;
}

.load-more-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
}

/* Featured sets grid */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

/* End content states */
.end-content-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 0;
  gap: 1rem;
}

.end-content-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 1.25rem;
}

.emoji {
  font-size: 2rem;
}

.create-set-button {
  background: #10b981;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s;
}

.create-set-button:hover {
  background: #059669;
  transform: translateY(-1px);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
  gap: 1rem;
}

.empty-state-text {
  color: #6b7280;
  font-size: 1rem;
  text-align: center;
}

.end-message {
  color: #6b7280;
  font-size: 1.2rem;
  text-align: center;
  margin: 1rem 0;
}

/* Sentinel for infinite scroll */
.sentinel {
  height: 1rem;
}

/* Animations */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.4s ease-in-out;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Responsive design */
@media (max-width: 768px) {
  .container-main {
    padding: 0 0.5rem;
  }
  
  .section-title {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  .cards-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
  }
  
  .newest-set-item {
    padding: 2rem 0;
  }
  
  .newest-sets-section,
  .featured-sets-section {
    padding: 2rem 0;
  }
}

@media (max-width: 480px) {
  .cards-grid {
    grid-template-columns: 1fr;
  }
  
  .section-title {
    font-size: 1.25rem;
  }
}
</style>
