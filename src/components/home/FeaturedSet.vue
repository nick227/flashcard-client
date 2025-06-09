<template>
  <section v-if="set" class="featured-set">
    <div class="featured-content">
      <div class="featured-image">
        <a :href="`/sets/${set.id}`">
          <div class="w-full h-full rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
            <img 
              v-if="set.thumbnail && !thumbnailError" 
              :src="set.thumbnail" 
              :alt="set.title + ' Thumbnail'" 
              class="w-full h-full object-cover"
              @error="handleThumbnailError"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <span class="text-8xl font-bold text-gray-400">{{ getFirstLetter }}</span>
            </div>
          </div>
        </a>
      </div>
      <div class="featured-info">
        <div class="flex items-center gap-4 mb-4">
          <div v-if="set.category" @click="router.push({ path: '/browse/' + set.category })" class="category-badge">
            {{ set.category }}
          </div>
          <div v-else class="category-badge link">Uncategorized</div>
          <div class="text-sm text-gray-500">
            {{ formatDate(set.createdAt) }}
          </div>
        </div>

        <h2 class="title my-0"><a :href="`/sets/${set.id}`">{{ set.title }}</a></h2>
        <p class="description">{{ set.description }}</p>
        
        <div v-if="set.tags" class="tags-container">
          <span v-for="tag in set.tags" :key="tag" class="tag"><a :href="`/tags/${tag}`">{{ tag }}</a></span>
        </div>
        <!-- set stats section -->
        <div class="flex items-center gap-6 mt-4">
          <div class="flex items-center gap-2">
            <i class="fas fa-layer-group text-green-500"></i>
            <span class="text-gray-600">{{ isLoadingCards ? '...' : cardsCount }}</span>
          </div>
          <div class="flex items-center gap-2">
            <i class="fas fa-heart text-red-500"></i>
            <span class="text-gray-600">{{ isLoadingLikes ? '...' : likesCount }}</span>
          </div>
          <div class="flex items-center gap-2">
            <i class="fas fa-eye text-blue-500"></i>
            <span class="text-gray-600">{{ isLoadingViews ? '...' : viewsCount }}</span>
          </div>
        </div>

        <div class="educator-info mt-4 flex items-center gap-3">
          <a :href="`/u/${set.educatorName}`"><img 
            v-if="educatorImage" 
            :src="educatorImage" 
            :alt="set.educatorName + ' avatar'"
            class="w-10 h-10 rounded-full object-cover"
          />
          <div v-else class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <i class="fas fa-user text-gray-500"></i>
          </div></a>
          <div>
            <div class="font-medium text-gray-900"><a :href="`/u/${set.educatorName}`">{{ set.educatorName }}</a></div>
          </div>
        </div>

        <div class="actions mt-8">
          <button class="button button-primary" @click="$emit('view', set.id)">
            Try This Set
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref, watch, computed } from 'vue'
import { cachedApiEndpoints } from '@/services/CachedApiService'
import type { Set } from '@/types/set'

const router = useRouter()
const likesCount = ref(0)
const viewsCount = ref(0)
const cardsCount = ref(0)
const isLoadingLikes = ref(false)
const isLoadingViews = ref(false)
const isLoadingCards = ref(false)
const isLoadingStats = ref(false)
const thumbnailError = ref(false)

const props = defineProps<{
  set: Set
}>()

// Computed property for educator image URL
const educatorImage = computed(() => {
  if (!props.set?.educatorId) return null
  return props.set.educatorImage
})

// Get first letter of title for fallback
const getFirstLetter = computed(() => {
  if (!props.set?.title) return '?'
  return props.set.title.charAt(0).toUpperCase()
})

const fetchStats = async () => {
  if (!props.set?.id) return

  try {
    isLoadingStats.value = true
    const [viewsRes, likesRes, cardsRes] = await Promise.all([
      cachedApiEndpoints.getBatchSetViews([props.set.id]),
      cachedApiEndpoints.getBatchSetLikes([props.set.id]),
      cachedApiEndpoints.getBatchSetCards([props.set.id])
    ])
    
    viewsCount.value = (viewsRes as Record<string, number>)[props.set.id] || 0
    likesCount.value = (likesRes as Record<string, number>)[props.set.id] || 0
    cardsCount.value = (cardsRes as Record<string, number>)[props.set.id] || 0
  } catch (error) {
    console.error('Error fetching stats:', error)
  } finally {
    isLoadingStats.value = false
  }
}

// Watch for changes to the set prop
watch(() => props.set, async (newSet) => {
  if (newSet) {
    await fetchStats()
  }
}, { immediate: true })

function formatDate(date: string) {
  const d = new Date(date)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
  return `${Math.floor(diffInDays / 365)} years ago`
}

const handleThumbnailError = () => {
  thumbnailError.value = true
}

defineEmits<{
  (e: 'view', setId: number): void
}>()
</script>

<style scoped>
.featured-set {
  @apply w-full py-8 md:py-16 md:px-8 mb-8 md:mb-16 bg-gradient-to-r from-gray-50 to-white overflow-hidden;
}

.featured-content {
  @apply max-w-7xl mx-auto flex flex-col lg:flex-row gap-4 md:gap-8 items-center;
}

.featured-image {
  @apply w-full lg:w-1/2 h-[340px] md:min-h-[400px] lg:h-[500px];
}

.featured-info {
  @apply w-full lg:w-1/2 flex flex-col gap-3 md:gap-4;
}

.title {
  @apply text-2xl md:text-3xl font-bold;
}

.description {
  @apply text-sm md:text-base text-gray-600;
}

.tags-container {
  @apply flex flex-wrap gap-1.5 mb-2;
}

.tag {
  @apply text-xs md:text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded;
}

.educator-info {
  @apply mt-2 md:mt-4;
}

.actions {
  @apply mt-4 md:mt-6;
}

.featured-image img {
  transition: opacity 0.2s ease;
}

.featured-image img:hover {
  opacity: 0.9;
}

.featured-image .text-8xl {
  font-size: clamp(3rem, 15vw, 6rem);
  line-height: 1;
}

.category-badge {
  @apply text-xs md:text-sm;
}

/* Ensure the image container doesn't overflow */
.w-full.h-full {
  @apply max-w-full;
}
</style> 