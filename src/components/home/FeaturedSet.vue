<template>
  <section v-if="set" class="featured-set">
    <div class="featured-content">
      <div class="featured-image">
        <a :href="`/sets/${set.id}`">
          <div class="w-full h-full rounded-xl shadow-xl overflow-hidden bg-gray-100 flex items-center justify-center">
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
          <div v-if="set.category" @click="router.push({ path: '/browse/' + set.category })" class="category-badge link">
            {{ set.category }}
          </div>
          <div v-else class="category-badge link">Uncategorized</div>
          <div class="text-sm text-gray-500">
            {{ formatDate(set.createdAt) }}
          </div>
        </div>

        <h2 class="title"><a :href="`/sets/${set.id}`">{{ set.title }}</a></h2>
        <p class="description">{{ set.description }}</p>
        
        <div class="tags-container">
          <span v-for="tag in set.tags" :key="tag" class="tag"><a :href="`/tags/${tag}`">{{ tag }}</a></span>
        </div>

        <div class="flex items-center gap-6 mt-4">
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
import type { FlashCardSet } from '@/types'
import { useRouter } from 'vue-router'
import { ref, watch, computed } from 'vue'
import { apiEndpoints } from '@/api'
import axios from 'axios'

const router = useRouter()
const likesCount = ref(0)
const viewsCount = ref(0)
const isLoadingLikes = ref(false)
const isLoadingViews = ref(false)
const thumbnailError = ref(false)

const props = defineProps<{
  set: FlashCardSet | null
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

// Watch for changes to the set prop
watch(() => props.set, async (newSet) => {
  if (newSet) {
    await Promise.all([
      fetchLikesCount(newSet.id),
      fetchViewsCount(newSet.id)
    ])
  }
}, { immediate: true })

async function fetchLikesCount(setId: number) {
  isLoadingLikes.value = true
  try {
    const response = await axios.get(`${apiEndpoints.sets}/${setId}/likes`)
    likesCount.value = response.data.count || 0
  } catch (error) {
    console.error('Error fetching likes count:', error)
    likesCount.value = 0
  } finally {
    isLoadingLikes.value = false
  }
}

async function fetchViewsCount(setId: number) {
  isLoadingViews.value = true
  try {
    const response = await axios.get(`${apiEndpoints.sets}/${setId}/views`)
    viewsCount.value = response.data.count || 0
  } catch (error) {
    console.error('Error fetching views count:', error)
    viewsCount.value = 0
  } finally {
    isLoadingViews.value = false
  }
}

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
  @apply w-full py-16 px-4 md:px-8 mb-16 bg-gradient-to-r from-gray-50 to-white;
}

.featured-content {
  @apply max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 items-center;
}

.featured-image {
  @apply w-full lg:w-1/2 min-h-[400px] lg:h-[500px];
}

.featured-image img {
  transition: opacity 0.2s ease;
}

.featured-image img:hover {
  opacity: 0.9;
}

.featured-image .text-4xl {
  font-size: 3rem;
  line-height: 1;
}
</style> 