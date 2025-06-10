<template>
  <div v-if="set" class="card group">
    <!-- Image Container -->
    <div class="relative img-container">
      <img 
        @click="handleView"
        :src="imageLoadError ? '/images/default-set.png' : (set.image || set.thumbnail || '/images/default-set.png')" 
        :alt="set.title"
        class="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
        @error="handleImageError"
        v-if="!imageLoadError"
      />
      <div v-if="imageLoadError" class="w-full h-full">
        <img src="https://picsum.photos/200/300" :alt="set.title" class="w-full h-full object-cover">
      </div>
      <!-- Price Badge -->
      <div class="absolute top-3 right-3">
        <span 
          v-if="typeof set.price === 'number' ? set.price > 0 : set.price.type !== 'free'" 
          class="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-full shadow-sm"
        >
          ${{ typeof set.price === 'number' ? set.price : set.price.amount || 0 }}
        </span>
      </div>
    </div>
    
    <!-- Content Container -->
    <div class="p-5 flex flex-col h-[calc(360px-12rem)]">
      <!-- Title -->
      <h3 
        @click="handleView" 
        class="text-lg font-semibold mb-2 cursor-pointer line-clamp-1 hover:text-blue-600 transition-colors"
      >
        {{ set.title }}
      </h3>

      <!-- Description -->
      <p class="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">{{ set.description }}</p>
      
      <!-- Tags -->
        <template v-if="set.tags">
          <div class="flex flex-wrap gap-1.5 mb-4 min-h-[1.5rem]">
          <span 
            v-for="tag in set.tags" 
            :key="tag"
            class="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
          >
            {{ tag }}
          </span>
        </div>
        </template>

      <!-- Footer -->
      <div class="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
        <a 
          @click="handleUserView" 
          class="text-sm text-gray-500 cursor-pointer hover:text-blue-600 transition-colors truncate max-w-[40%]"
        >
          {{ set.educatorName }}
        </a>

        <!-- Stats -->
        <div class="flex items-center space-x-4 text-sm text-gray-500">
          <span class="flex items-center" title="Views">
            <EyeIcon class="w-4 h-4 mr-1" />
            {{ formatNumber(views) }}
          </span>
          <span class="flex items-center" title="Likes">
            <HeartIcon class="w-4 h-4 mr-1" />
            {{ formatNumber(likes) }}
          </span>
          <span class="flex items-center" title="Cards">
            <DocumentIcon class="w-4 h-4 mr-1" />
            {{ formatNumber(cards) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { EyeIcon, HeartIcon, DocumentIcon } from '@heroicons/vue/24/outline'
import { useRouter } from 'vue-router'
import { cachedApiEndpoints } from '@/services/CachedApiService'

const router = useRouter()

const props = defineProps<{
  set?: {
    id: number
    title: string
    description: string
    image?: string | null
    thumbnail?: string | null
    educatorName: string
    price: number | { type: 'free' | 'premium' | 'subscribers'; amount?: number }
    tags?: string[]
    views?: number
    likes?: number
    cards?: { id: number; setId: number; front: string; back: string; hint?: string }[]
    cardsCount?: number
    category?: string
    createdAt?: string
    updatedAt?: string
    type?: string
    isPublic?: boolean
    isPurchased?: boolean
    isLiked?: boolean
    hidden?: boolean
    educatorId?: number
    educatorImage?: string | null
  }
}>()

const emit = defineEmits<{
  (e: 'view', setId: number): void
}>()

const imageLoadError = ref(false)
const isLoadingStats = ref(false)
const localViews = ref(0)
const localLikes = ref(0)
const localCards = ref(0)

const handleView = () => {
  if (!props.set) return
  emit('view', props.set.id)
}

const handleImageError = () => {
  imageLoadError.value = true
}

const handleUserView = () => {
  if (!props.set) return
  router.push(`/u/${props.set.educatorName}`)
}

// Format number with K/M suffix for large numbers
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// Fetch stats for the set
const fetchStats = async () => {
  if (!props.set?.id) return

  try {
    isLoadingStats.value = true
    
    const [viewsRes, likesRes, cardsRes] = await Promise.all([
      cachedApiEndpoints.getBatchSetViews([props.set.id]),
      cachedApiEndpoints.getBatchSetLikes([props.set.id]),
      cachedApiEndpoints.getBatchSetCards([props.set.id])
    ])

    // Extract data from the message property
    const viewsData = (viewsRes as { message?: Record<string, number> })?.message || {}
    const likesData = (likesRes as { message?: Record<string, number> })?.message || {}
    const cardsData = (cardsRes as { message?: Record<string, number> })?.message || {}
    
    localViews.value = viewsData[props.set.id] || 0
    localLikes.value = likesData[props.set.id] || 0
    localCards.value = cardsData[props.set.id] || 0
    
  } catch (error) {
    console.error('[Stats] Error fetching stats for set', props.set?.id, ':', error)
  } finally {
    isLoadingStats.value = false
  }
}

// Fetch stats when component is mounted
onMounted(() => {
  if (!props.set) return
  fetchStats()
})

// Computed properties for stats with proper fallbacks
const views = computed(() => {
  if (!props.set) return 0
  const value = localViews.value || (typeof props.set.views === 'number' ? props.set.views : 0)
  return value
})

const likes = computed(() => {
  if (!props.set) return 0
  const value = localLikes.value || (typeof props.set.likes === 'number' ? props.set.likes : 0)
  return value
})

const cards = computed(() => {
  if (!props.set) return 0
  let value = localCards.value
  if (!value) {
    if (Array.isArray(props.set.cards)) {
      value = props.set.cards.length
    } else if (typeof props.set.cardsCount === 'number') {
      value = props.set.cardsCount
    }
  }
  return value
})
</script>

<style scoped>
.card {
  @apply bg-white rounded-xl transition-all duration-300;
  min-height: 455px;
  display: flex;
  flex-direction: column;
  border-top-left-radius: 1rem;
  border-top-right-radius: 1rem;
  overflow: hidden;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Remove default margin from h3 */
h3 {
  margin: 0;
}
.img-container {
  height: 385px;
  width: 100%;
  border-top-left-radius: 1rem;
  border-top-right-radius: 1rem;
  overflow: hidden;
}
.img-container img {
  border-top-left-radius: 1rem;
  border-top-right-radius: 1rem;
}
</style>