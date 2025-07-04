<template>
  <div :ref="setCardRef as any" v-if="set" class="card flex flex-col overflow-hidden rounded-sm bg-white duration-300 preview-card" :class="theme">
    <!-- Image Container -->
    <div @click="handleView" class="relative cursor-pointer" @mouseenter="startPreview" @mouseleave="stopPreview"
      @touchstart="startPreview" @touchend="stopPreview">
      <div class="thumbnail-container h-full w-full object-cover cursor-pointer">
        <CardContent v-if="previewCard && currentCardSide" :card="previewCard" :side="currentCardSide"
          :is-editing="false" :is-flipped="false" />
        <img v-else-if="set.image || set.thumbnail" v-show="!thumbnailError"
          :src="set.image || set.thumbnail || '/images/default-set.png'" :alt="set.title"
          @error="handleThumbnailImageError" @load="handleThumbnailImageLoad" class="h-full w-full object-cover"
          loading="lazy" />
        <div v-if="(!previewCard && !currentCardSide) && (!set.image && !set.thumbnail || thumbnailError)"
          class="h-full w-full bg-gray-200 flex items-center justify-center">
          <i class="fas fa-image text-gray-400 text-2xl"></i>
        </div>
      </div>
      <!-- Price Badge -->
      <div class="absolute top-2 right-2">
        <span v-if="typeof set.price === 'number' ? set.price > 0 : set.price.type !== 'free'"
          class="rounded-full bg-black bg-opacity-60 px-2 py-1 text-xs font-bold text-white">
          ${{ typeof set.price === 'number' ? set.price : set.price.amount || 0 }}
        </span>
      </div>
      <!-- Timer Bar-->
      <div class="timer-bar">
        <div v-if="timerProgress" class="timer-bar-fill" :style="{ width: `${timerProgress}%` }"></div>
      </div>
    </div>


    <!-- Content Container -->
    <div class="flex flex-grow flex-col p-4">
      <div class="flex items-start gap-3">
        <!-- Educator Avatar -->
        <div @click="handleUserView" class="flex-shrink-0 cursor-pointer">
          <img v-if="set.educatorImage" v-show="!educatorImageError"
            :src="set.educatorImage || '/images/default-avatar.png'" :alt="set.educatorName"
            class="h-10 w-10 rounded-full object-cover" loading="lazy" @error="handleEducatorImageError"
            @load="handleEducatorImageLoad" />
          <div v-if="!set.educatorImage || educatorImageError"
            class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
            <i class="fas fa-user text-gray-400 text-2xl"></i>
          </div>
        </div>

        <div class="min-w-0 flex-grow">
          <!-- Title -->
          <h3 @click="handleView"
            class="truncate-2-lines text-base font-semibold leading-tight text-gray-800 hover:text-blue-600 card-title">
            {{ set.title }}
          </h3>

          <!-- Educator Name & Stats -->
          <div class="mt-1">
            <a @click="handleUserView" class="text-sm text-gray-500 hover:text-blue-600">
              {{ set.educatorName }}
            </a>
            <div class="flex items-center space-x-2 text-xs text-gray-500">
              <span>{{ formatNumber(views) }} views</span>
              <span aria-hidden="true">&middot;</span>
              <span>{{ formatNumber(likes) }} likes</span>
              <span aria-hidden="true">&middot;</span>
              <span>{{ cards }} cards</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { cachedApiEndpoints } from '@/services/CachedApiService'
import { useSetCards } from '@/composables/useSetCards'
import { useCardPreview } from '@/composables/useCardPreview'
import { useCardPreviewOnView } from '@/composables/useCardPreviewOnView'
import CardContent from '../common/CardContent.vue'
import { useIsMobile } from '@/composables/useIsMobile'

const router = useRouter()

const props = defineProps<{
  theme?: string,
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
    cards?: Array<{
      id: number
      front: { content: string; mediaUrl: string | null; layout: string }
      back: { content: string; mediaUrl: string | null; layout: string }
      hint?: string | null
      front_image?: string | null
      back_image?: string | null
      layout_front?: string
      layout_back?: string
    }>
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

const emit = defineEmits<{
  (e: 'view', setId: number): void
}>()

const timerProgress = ref(0)

// Error handling for images
const thumbnailError = ref(false)
const educatorImageError = ref(false)

const isLoadingStats = ref(false)
const localViews = ref(0)
const localLikes = ref(0)
const localCards = ref(0)

const { cards: setCards, fetchSetCards } = useSetCards()

const cardRoot = ref<HTMLElement | null>(null)
const setCardRef = (el: Element | null) => {
  cardRoot.value = (el instanceof HTMLElement) ? el : null
}

const { previewCard, currentCardSide, startPreview, stopPreview } = useCardPreview(setCards, fetchSetCards, props.set?.id ?? 0, 3600, timerProgress)

const isMobile = useIsMobile()
if (isMobile.value) {
  useCardPreviewOnView(
    cardRoot,
    startPreview,
    stopPreview,
    ref(document.body)
  )
}

const handleView = () => {
  if (!props.set) return
  emit('view', props.set.id)
}

const handleUserView = () => {
  if (!props.set) return
  router.push(`/u/${props.set.educatorName}`)
}

const handleThumbnailImageError = () => {
  thumbnailError.value = true
}

const handleThumbnailImageLoad = () => {
  thumbnailError.value = false
}

const handleEducatorImageError = () => {
  educatorImageError.value = true
}

const handleEducatorImageLoad = () => {
  educatorImageError.value = false
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
  } finally {
    isLoadingStats.value = false
  }
}

onMounted(async () => {
  if (!props.set) return
  fetchStats()
  await nextTick()
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

.preview-card {
  cursor: pointer !important;
  max-width: var(--card-max-width);
}

.thumbnail-container {
  position: relative;
  height: 470px;
  cursor: pointer;
}

.timer-bar {
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  border-radius: 2px;
  background: transparent;
  margin-top: 10px;
}

.timer-bar-fill {
  height: 100%;
  background-color: blue;
}

.small .thumbnail-container {
  position: relative;
  height: 300px;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  cursor: pointer;
}
</style>