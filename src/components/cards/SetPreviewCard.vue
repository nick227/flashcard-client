<template>
  <div v-if="set" class="card">
    <!-- Image Container -->
    <div @click="handleView" class="relative img-container link"
      :style="{ backgroundImage: `url(${set.image || set.thumbnail || '/images/default-set.png'})` }">
      <!-- Price Badge -->
      <div class="absolute top-3 right-3">
        <span v-if="typeof set.price === 'number' ? set.price > 0 : set.price.type !== 'free'"
          class="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-full shadow-sm">
          ${{ typeof set.price === 'number' ? set.price : set.price.amount || 0 }}
        </span>
      </div>


      <!-- Category Badge -->
      <div v-if="set.category" @click="router.push({ path: '/browse/' + set.category })"
        class="text-xs px-2 py-0.5 rounded-full mb-2 cursor-pointer bg-gray-100 category-badge">
        {{ set.category }}
      </div>
    </div>

    <!-- Content Container -->
    <div class="flex flex-col content-container">
      <!-- Title -->
      <h3 @click="handleView"
        class="text-xl font-semibold mb-2 cursor-pointer hover:text-blue-600 transition-colors p-2"
        :style="{ backgroundColor: categoryColor }">
        {{ set.title }}
      </h3>

      <!-- Description -->
      <p class="text-gray-600 text-sm mb-4 flex-grow p-2">{{ set.description }}
        <!-- Tags -->
        <span v-for="tag in set.tags" :key="tag" class="tag text-xs rounded-full">
          {{ tag }}
        </span>
      </p>

      <!-- Footer -->
      <div class="flex items-center justify-between mt-auto pt-3 border-t bg-gray-100 p-2">
        <a @click="handleUserView"
          class="text-sm text-gray-500 cursor-pointer hover:text-blue-600 transition-colors truncate max-w-[40%]">
          {{ set.educatorName }}
        </a>


        <!-- Stats -->
        <div class="flex items-center space-x-4 text-sm text-gray-500 p-2">
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
import { useCategoryColor } from '@/composables/useCategoryColor'

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
    categoryId?: number
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

const { color: categoryColor } = useCategoryColor(props.set?.categoryId)

const emit = defineEmits<{
  (e: 'view', setId: number): void
}>()

const isLoadingStats = ref(false)
const localViews = ref(0)
const localLikes = ref(0)
const localCards = ref(0)

const handleView = () => {
  if (!props.set) return
  emit('view', props.set.id)
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

    // Extract data directly from the response
    localViews.value = (viewsRes as Record<string, number>)[props.set.id] || 0
    localLikes.value = (likesRes as Record<string, number>)[props.set.id] || 0
    localCards.value = (cardsRes as Record<string, number>)[props.set.id] || 0

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
  // First try to use the local cards count from the API
  if (localCards.value) return localCards.value
  // Then try to use the cards array length
  if (Array.isArray(props.set.cards)) return props.set.cards.length
  // Finally try to use the cardsCount property
  if (typeof props.set.cardsCount === 'number') return props.set.cardsCount
  return 0
})
</script>

<style scoped>
.card {
  min-height: 420px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Remove default margin from h3 */
h3 {
  margin: 0;
}

.img-container {
  width: 100%;
  height: 260px;
  content: "";
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.content-container {
  width: 100%;
  height: 180px;
}

.tag {
  text-decoration: underline;
  padding: 0.25rem;
  border-radius: 0.25rem;
  display: inline-block;
  margin-left: 0.5rem;
  float: right;
}
</style>