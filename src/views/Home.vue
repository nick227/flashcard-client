<template>
  <div class="home-page">
    <!-- Featured Sets Grid -->
    <section class="featured-sets-section">
      <div class="container-main">
        <!-- Search Input -->
        <div class="search-container">
          <SearchInput 
            :model-value="searchQuery" 
            @update:model-value="updateSearch" 
            @submit="updateSearch" 
            :disabled="loading"
            placeholder="Search flashcard sets..." 
          />
        </div>
        
        <!-- Search Results Indicator -->
        <div v-if="searchQuery && sets?.length" class="search-results-info">
          <p>Search results for: <strong>"{{ searchQuery }}"</strong></p>
          <button @click="clearSearch" class="clear-search-btn">Clear Search</button>
        </div>
        
        <!-- No Results Message -->
        <div v-if="searchQuery && !loading && !sets?.length" class="no-results">
          <p>No sets found for "<strong>{{ searchQuery }}</strong>"</p>
          <button @click="clearSearch" class="retry-button">Clear Search</button>
        </div>
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
        
        <!-- Sets Grid with Row Pattern -->
        <div v-if="sets?.length" ref="cardsGridRef" class="cards-container" role="grid" aria-label="Featured flashcard sets">
          <div 
            v-for="(row, rowIndex) in organizedRows" 
            :key="`row-${rowIndex}`"
            :class="row.isContent ? 'content-row' : 'cards-row'"
            :style="{ gridTemplateColumns: row.widths }"
          >
            <!-- Render HTML content row -->
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div v-if="row.isContent" class="content-section" v-html="row.content"></div>
            
            <!-- Render card row -->
            <SetPreviewCard 
              v-else
              v-for="set in row.sets" 
              :key="set.id" 
              :set="set" 
              theme="small" 
              @view="viewSet"
              :class="{ 'opacity-50': isTransitioning }" 
              role="gridcell"
            />
          </div>
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
import SetPreviewCard from '@/components/cards/SetPreviewCard.vue'
import CategoryCloud from '@/components/common/CategoryCloud.vue'
import StatsSection from '@/components/common/StatsSection.vue'
import FunnyLoadingIndicator from '@/components/common/FunnyLoadingIndicator.vue'
import LoadMoreButton from '@/components/common/LoadMoreButton.vue'
import { useSets } from '@/composables/useSets'
import type { Set } from '@/types/set'
import SearchInput from '@/components/common/SearchInput.vue'

const router = useRouter()
const sentinel = ref<HTMLElement | null>(null)

// Batch loading state for featured sets
const batchDelay = ref(0)
let batchTimeout: ReturnType<typeof setTimeout> | null = null
const isBatchWaiting = ref(false)
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
  currentPage,
  searchQuery,
  updateSearch
} = useSets()

// Navigation handler
const viewSet = (setId: number) => {
  router.push({ path: '/study/' + setId })
}

// Search handlers
const clearSearch = () => {
  updateSearch('')
}

// Define row pattern with width ratios
// Each entry can be:
//   - A number: creates that many equal-width columns (e.g., 3 = [1,1,1])
//   - An array: defines width ratio for each column (e.g., [3,3,2] = 3fr 3fr 2fr)
//   - A string: HTML content for a full-width text/content row
const rowPattern: Array<number | number[] | string> = [
  // Opening Hero - grab attention with featured card
  3,              // Full-width spotlight card
  5,              // 5 equal columns - maximum content
  3,              // Full-width spotlight card
  3,              // Full-width spotlight card
  3,              // Full-width spotlight card
  3,              // Full-width spotlight card
  3,              // Full-width spotlight card
  3,              // Full-width spotlight card
  '<h2>Flash cards are a tried and true method to focus on essentials.</h2><p>Give your brain a break from videos.</p>',
  
  // Magazine Style - create visual interest
  [2, 1, 1],      // 3 columns: spotlight left, two smaller right
  5,              // 5 equal columns - maximum content
  // Rhythm Section - professional consistency
  '<h2>Try our ai-assisted flash cards wizard.</h2><a href="/creator">Make a flash card set in seconds.</a>',
  3,              // 3 equal columns - classic grid
  3,              // Repeat for rhythm
  // Asymmetric Break - modern & dynamic  
  [1, 2, 1],      // 3 columns: center spotlight (golden ratio feel)
  
  // Featured Duo - storytelling layout
  [3, 2],         // 2 columns: featured + secondary
  '<p>Let me know if you have any questions.</p>',
  5,              // 5 equal columns - maximum content
  // Rhythm Section - professional consistency
  3,              // 3 equal columns - classic grid
  3,              // Repeat for rhythm
  
  // Editorial Style - sophisticated close
  [1, 1, 2],      // 3 columns: spotlight right
  
  // Repeat cycle maintains visual rhythm
]

// Organize sets into rows based on pattern
const organizedRows = computed(() => {
  if (!sets.value?.length) return []
  
  const rows: Array<{ widths: string; sets: Set[]; content?: string; isContent?: boolean }> = []
  let setIndex = 0
  let patternIndex = 0
  
  while (setIndex < sets.value.length || patternIndex === 0) {
    const pattern = rowPattern[patternIndex % rowPattern.length]
    
    // Handle string content rows
    if (typeof pattern === 'string') {
      rows.push({
        widths: '1fr',
        sets: [],
        content: pattern,
        isContent: true
      })
      patternIndex++
      continue
    }
    
    // Convert pattern to width array
    let widthArray: number[]
    if (typeof pattern === 'number') {
      // Simple number: create equal columns
      widthArray = Array(pattern).fill(1)
    } else {
      // Array: use as-is
      widthArray = pattern
    }
    
    const numColumns = widthArray.length
    const rowSets = sets.value.slice(setIndex, setIndex + numColumns)
    
    if (rowSets.length > 0) {
      // Convert width array to CSS grid template
      const gridTemplate = widthArray.map(w => `${w}fr`).join(' ')
      rows.push({ 
        widths: gridTemplate,
        sets: rowSets,
        isContent: false
      })
      setIndex += numColumns
    } else {
      break
    }
    
    patternIndex++
  }
  
  return rows
})

// Intersection Observer for infinite scroll
let observer: IntersectionObserver | null = null
const isLoadingMore = ref(false)

const triggerNextBatch = async () => {
  if (isBatchWaiting.value || loading.value || showLoadMoreButton.value || isLoadingMore.value || !hasMore.value) {
    return
  }

  // Only increment batch count if we're not at the first page
  if (currentPage.value > 1) {
    batchCount.value++
  }

  isLoadingMore.value = true
  isBatchWaiting.value = true
  batchDelay.value = Math.floor(Math.random() * 3000) + 500
  
  batchTimeout = setTimeout(async () => {
    try {
      await loadSets()
    } finally {
      isBatchWaiting.value = false
      isLoadingMore.value = false
    }
  }, batchDelay.value)
}

const handleLoadMore = async () => {
  if (isLoadingMore.value) return
  
  batchCount.value = 0
  isBatchWaiting.value = false
  if (batchTimeout) {
    clearTimeout(batchTimeout)
    batchTimeout = null
  }
  
  isLoadingMore.value = true
  try {
    await loadSets()
  } finally {
    isLoadingMore.value = false
  }
}

// Initialize the component
onMounted(async () => {
  try {
    await initialize()
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error initializing Home page:', error)
  }

  // Set up intersection observer for infinite scroll
  setTimeout(() => {
    if (sentinel.value && hasMore.value) {
      observer = new IntersectionObserver((entries) => {
        const entry = entries[0]
        // Only trigger if intersecting and not already loading
        if (entry.isIntersecting && hasMore.value && !loading.value && !isBatchWaiting.value && !isLoadingMore.value) {
          triggerNextBatch()
        }
      }, {
        threshold: 0.1,
        rootMargin: '100px' // Reduced from 200px to prevent premature triggering
      })

      observer.observe(sentinel.value)
    }
  }, 300) // Increased delay to ensure DOM is ready
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

.random-sets-section,
.featured-sets-section {
  padding: 1em 0;
}

.cta-section {
  padding: 2rem 0;
}

.stats-section {
  padding: 2rem 0 4rem;
}

/* Container */
.container-main {
  max-width: 70%;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Search Container */
.search-container {
  margin-bottom: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

/* Search Results Info */
.search-results-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
}

.search-results-info p {
  margin: 0;
  color: #0369a1;
  font-size: 0.95rem;
}

.search-results-info strong {
  font-weight: 600;
}

.clear-search-btn {
  background: white;
  color: #0369a1;
  border: 1px solid #bae6fd;
  padding: 0.4rem 0.9rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
  font-weight: 500;
}

.clear-search-btn:hover {
  background: #e0f2fe;
  border-color: #7dd3fc;
}

/* No Results */
.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  background: #fef2f2;
  border: 2px dashed #fca5a5;
  border-radius: 0.75rem;
  margin-bottom: 2rem;
  gap: 1rem;
}

.no-results p {
  color: #991b1b;
  font-size: 1.1rem;
  text-align: center;
  margin: 0;
}

.no-results strong {
  font-weight: 600;
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
.random-sets-list {
  margin-bottom: 2rem;
}

.random-set-item {
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

/* Featured sets container */
.cards-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.cards-row {
  display: grid;
  gap: 1.5rem;
  width: 100%;
  margin-bottom: 4rem;
}

.content-row {
  width: 100%;
  margin-bottom: 3rem;
}

.content-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 1rem;
  padding: 3rem 2rem;
  color: white;
  text-align: center;
}

.content-section h2 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.content-section p {
  font-size: 1.125rem;
  line-height: 1.6;
  opacity: 0.95;
  margin: 0;
}

.content-section a {
  color: white;
  text-decoration: underline;
  font-weight: 600;
  transition: opacity 0.2s;
}

.content-section a:hover {
  opacity: 0.8;
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
  
  .cards-container {
    gap: 1rem;
  }
  
  .cards-row {
    gap: 1rem;
  }
  
  /* Simplify to 2 columns on tablets */
  .cards-row {
    grid-template-columns: repeat(2, 1fr) !important;
  }
  
  .content-section {
    padding: 2rem 1.5rem;
  }
  
  .content-section h2 {
    font-size: 1.5rem;
  }
  
  .content-section p {
    font-size: 1rem;
  }
  
  .search-results-info {
    flex-direction: column;
    gap: 0.75rem;
    text-align: center;
  }
  
  .no-results p {
    font-size: 1rem;
  }
  
  .random-set-item {
    padding: 2rem 0;
  }
  
  .random-sets-section,
  .featured-sets-section {
    padding: 2rem 0;
  }
}

@media (max-width: 480px) {
  /* Single column on mobile */
  .cards-row {
    grid-template-columns: 1fr !important;
  }
  
  .content-section {
    padding: 1.5rem 1rem;
  }
  
  .content-section h2 {
    font-size: 1.25rem;
  }
  
  .section-title {
    font-size: 1.25rem;
  }
}
</style>
