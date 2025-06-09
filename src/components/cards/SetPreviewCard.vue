<template>
  <div class="card group">
    <!-- Image Container -->
    <div class="relative h-48 overflow-hidden">
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
      <div class="flex flex-wrap gap-1.5 mb-4 min-h-[1.5rem]">
        <span 
          v-for="tag in set.tags" 
          :key="tag"
          class="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
        >
          {{ tag }}
        </span>
      </div>

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
  set: {
    id: number
    title: string
    description: string
    image?: string
    thumbnail?: string
    educatorName: string
    price: number | { type: 'free' | 'premium' | 'subscribers'; amount?: number }
    tags: string[]
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
    educatorImage?: string
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
  emit('view', props.set.id)
}

const handleImageError = () => {
  imageLoadError.value = true
}

const handleUserView = () => {
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
    console.log('[Stats] Fetching stats for set', props.set.id)
    
    const [viewsRes, likesRes, cardsRes] = await Promise.all([
      cachedApiEndpoints.getBatchSetViews([props.set.id]),
      cachedApiEndpoints.getBatchSetLikes([props.set.id]),
      cachedApiEndpoints.getBatchSetCards([props.set.id])
    ])
    
    console.log('[Stats] Raw responses for set', props.set.id, ':', {
      views: viewsRes,
      likes: likesRes,
      cards: cardsRes
    })

    // Extract data from the message property
    const viewsData = (viewsRes as { message?: Record<string, number> })?.message || {}
    const likesData = (likesRes as { message?: Record<string, number> })?.message || {}
    const cardsData = (cardsRes as { message?: Record<string, number> })?.message || {}
    
    console.log('[Stats] Extracted data for set', props.set.id, ':', {
      viewsData,
      likesData,
      cardsData,
      setId: props.set.id
    })
    
    localViews.value = viewsData[props.set.id] || 0
    localLikes.value = likesData[props.set.id] || 0
    localCards.value = cardsData[props.set.id] || 0

    console.log('[Stats] Final stats for set', props.set.id, ':', {
      views: {
        value: localViews.value,
        raw: viewsData[props.set.id],
        exists: props.set.id in viewsData
      },
      likes: {
        value: localLikes.value,
        raw: likesData[props.set.id],
        exists: props.set.id in likesData
      },
      cards: {
        value: localCards.value,
        raw: cardsData[props.set.id],
        exists: props.set.id in cardsData
      }
    })
  } catch (error) {
    console.error('[Stats] Error fetching stats for set', props.set.id, ':', error)
  } finally {
    isLoadingStats.value = false
  }
}

// Fetch stats when component is mounted
onMounted(() => {
  fetchStats()
})

// Computed properties for stats with proper fallbacks
const views = computed(() => {
  const value = localViews.value || (typeof props.set.views === 'number' ? props.set.views : 0)
  console.log('[Stats] Computed views for set', props.set.id, ':', {
    propValue: props.set.views,
    localValue: localViews.value,
    finalValue: value
  })
  return value
})

const likes = computed(() => {
  const value = localLikes.value || (typeof props.set.likes === 'number' ? props.set.likes : 0)
  console.log('[Stats] Computed likes for set', props.set.id, ':', {
    propValue: props.set.likes,
    localValue: localLikes.value,
    finalValue: value
  })
  return value
})

const cards = computed(() => {
  let value = localCards.value
  if (!value) {
    if (Array.isArray(props.set.cards)) {
      value = props.set.cards.length
    } else if (typeof props.set.cardsCount === 'number') {
      value = props.set.cardsCount
    }
  }
  console.log('[Stats] Computed cards for set', props.set.id, ':', {
    isArray: Array.isArray(props.set.cards),
    arrayLength: Array.isArray(props.set.cards) ? props.set.cards.length : null,
    cardsCount: props.set.cardsCount,
    localValue: localCards.value,
    finalValue: value
  })
  return value
})
</script>

<style scoped>
.card {
  @apply bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300;
  min-height: 360px;
  display: flex;
  flex-direction: column;
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
</style>