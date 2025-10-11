<template>
  <div :ref="setCardRef as any" v-if="set" class="card flex flex-col overflow-hidden rounded-sm bg-white duration-300 preview-card" :class="theme">
    <!-- Image Container -->
    <button 
      @click="handleView" 
      class="relative cursor-pointer border-0 p-0 bg-transparent w-full text-left" 
      @mouseenter="startPreview" 
      @mouseleave="stopPreview"
      @touchstart.passive="handleTouchStart" 
      @touchend.passive="handleTouchEnd"
      :aria-label="`View ${set.title} flashcard set`"
      type="button">
      <div class="thumbnail-container w-full object-cover cursor-pointer">
        <CardContent v-if="previewCard && currentCardSide" :card="previewCard as any" :side="currentCardSide"
          :is-editing="false" :is-flipped="false" />
        <img v-else-if="set.image || set.thumbnail" v-show="!thumbnailError"
          :src="set.image || set.thumbnail || '/images/default-set.png'" 
          :alt="`${set.title} preview`"
          @error="handleThumbnailImageError" 
          @load="handleThumbnailImageLoad" 
          class="h-full w-full object-cover"
          loading="lazy" 
          decoding="async" />
        <div v-if="(!previewCard && !currentCardSide) && (!(set.image || set.thumbnail) || thumbnailError)"
          class="h-full w-full bg-gray-200 flex items-center justify-center"
          role="img"
          :aria-label="`No image available for ${set.title}`">
          <i class="fas fa-image text-gray-400 text-2xl" aria-hidden="true"></i>
        </div>
      </div>
      <!-- Price Badge -->
      <div v-if="showPriceBadge && priceBadgeText" class="absolute top-2 right-2 pointer-events-none">
        <span class="rounded-full bg-black bg-opacity-60 px-2 py-1 text-xs font-bold text-white">
          {{ priceBadgeText }}
        </span>
      </div>
      <!-- Timer Bar-->
      <div v-if="timerProgress > 0" class="timer-bar" role="progressbar" :aria-valuenow="timerProgress" :aria-valuetext="`${Math.round(timerProgress)}% complete`" aria-valuemin="0" aria-valuemax="100">
        <div class="timer-bar-fill" :style="{ width: `${timerProgress}%` }"></div>
      </div>
    </button>


    <!-- Content Container -->
    <div class="flex flex-grow flex-col p-4">
      <div class="flex items-start gap-3">
        <!-- Educator Avatar -->
        <RouterLink 
          :to="educatorUrl"
          class="flex-shrink-0 cursor-pointer"
          :aria-label="`View ${set.educatorName}'s profile`">
          <img v-if="set.educatorImage" v-show="!educatorImageError"
            :src="set.educatorImage || '/images/default-avatar.png'" 
            :alt="`${set.educatorName}'s avatar`"
            class="h-10 w-10 rounded-full object-cover" 
            loading="lazy" 
            decoding="async"
            @error="handleEducatorImageError"
            @load="handleEducatorImageLoad" />
          <div v-if="!set.educatorImage || educatorImageError"
            class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center"
            role="img"
            :aria-label="`${set.educatorName}'s avatar placeholder`">
            <i class="fas fa-user text-gray-400 text-2xl" aria-hidden="true"></i>
          </div>
        </RouterLink>

        <div class="min-w-0 flex-grow">
          <!-- Title -->
          <button
            @click="handleView"
            class="truncate-2-lines text-base font-semibold leading-tight text-gray-800 hover:text-blue-600 card-title border-0 p-0 bg-transparent text-left w-full cursor-pointer"
            :aria-label="`View ${set.title}`"
            type="button">
            {{ set.title }}
          </button>

          <!-- Educator Name & Stats -->
          <div class="mt-1">
            <RouterLink
              :to="educatorUrl"
              class="text-sm text-gray-500 hover:text-blue-600"
              :aria-label="`View ${set.educatorName}'s profile`">
              {{ set.educatorName }}
            </RouterLink>
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
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { RouterLink } from 'vue-router'
import { cachedApiEndpoints } from '@/services/CachedApiService'
import { useSetCards } from '@/composables/useSetCards'
import { useCardPreview } from '@/composables/useCardPreview'
import { useCardPreviewOnView } from '@/composables/useCardPreviewOnView'
import CardContent from '../common/CardContent.vue'
import { useIsMobile } from '@/composables/useIsMobile'

// SSR safety check
const isBrowser = typeof window !== 'undefined'

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
const setCardRef = (el: HTMLElement | null) => {
  cardRoot.value = el
}

const setIdRef = computed(() => props.set?.id ?? 0)

const { previewCard, currentCardSide, startPreview, stopPreview } = useCardPreview(setCards, fetchSetCards, setIdRef, 3600, timerProgress)

const isMobile = useIsMobile()
let cleanupPreview: (() => void) | null = null

const handleView = () => {
  if (!props.set) return
  window.location.href = `/sets/${props.set.id}`
  // emit('view', props.set.id)
}

// Computed educator URL with proper encoding
const educatorUrl = computed(() => {
  if (!props.set) return '/u/'
  return `/u/${encodeURIComponent(props.set.educatorName)}`
})

const handleTouchStart = () => {
  startPreview()
}

const handleTouchEnd = () => {
  stopPreview()
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

// Format number with locale-independent Intl.NumberFormat
const numberFormatter = new Intl.NumberFormat(undefined, {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 1
})

const formatNumber = (num: number | null | undefined): string => {
  if (num == null || isNaN(num)) return '0'
  return numberFormatter.format(num)
}

// Price badge computed properties - single source of truth
const showPriceBadge = computed(() => {
  if (!props.set) return false
  const price = props.set.price
  if (typeof price === 'number') {
    return price > 0
  }
  return price.type !== 'free'
})

const priceBadgeText = computed(() => {
  if (!props.set) return ''
  const price = props.set.price
  
  if (typeof price === 'number') {
    return price > 0 ? `$${price.toFixed(2)}` : ''
  }
  
  // Handle object price
  if (price.type === 'premium') {
    return price.amount && price.amount > 0 ? `$${price.amount.toFixed(2)}` : 'Premium'
  }
  
  if (price.type === 'subscribers') {
    return price.amount && price.amount > 0 ? `$${price.amount.toFixed(2)}` : 'Subscribers'
  }
  
  return ''
})

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

    // Safe access with string keys
    const setIdKey = String(props.set.id)
    localViews.value = (viewsRes as Record<string, number>)[setIdKey] ?? 0
    localLikes.value = (likesRes as Record<string, number>)[setIdKey] ?? 0
    localCards.value = (cardsRes as Record<string, number>)[setIdKey] ?? 0

  } catch {
    // Silent fail - use existing data
  } finally {
    isLoadingStats.value = false
  }
}

// Watch set.id and refetch when it changes
watch(() => props.set?.id, async (newId, oldId) => {
  if (newId && newId !== oldId) {
    await fetchStats()
    await fetchSetCards(newId)
  }
}, { immediate: false })

onMounted(async () => {
  if (!props.set) return
  
  // Initial data fetch
  await Promise.all([
    fetchStats(),
    fetchSetCards(props.set.id)
  ])
  
  await nextTick()
  
  // Attach preview on view for mobile after DOM is ready (SSR-safe)
  if (isBrowser && isMobile.value && cardRoot.value) {
    cleanupPreview = useCardPreviewOnView(
      cardRoot,
      startPreview,
      stopPreview,
      ref(document.body)
    )
  }
})

onUnmounted(() => {
  stopPreview()
  if (cleanupPreview) {
    cleanupPreview()
    cleanupPreview = null
  }
})

// Computed properties for stats with proper fallbacks
const views = computed(() => {
  if (!props.set) return 0
  return localViews.value || (typeof props.set.views === 'number' ? props.set.views : 0)
})

const likes = computed(() => {
  if (!props.set) return 0
  return localLikes.value || (typeof props.set.likes === 'number' ? props.set.likes : 0)
})

const cards = computed(() => {
  if (!props.set) return 0
  if (localCards.value) return localCards.value
  if (Array.isArray(props.set.cards)) return props.set.cards.length
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
  aspect-ratio: 16 / 9;
  cursor: pointer;
  overflow: hidden;
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
  background-color: var(--timer-bar-color, #3b82f6);
  transition: width 0.1s linear;
}

.small .thumbnail-container {
  position: relative;
  aspect-ratio: 4 / 3;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  cursor: pointer;
}

/* Ensure buttons look like text/links */
button.card-title,
button.text-sm {
  font: inherit;
  line-height: inherit;
}

/* Focus styles for accessibility */
button:focus-visible,
a:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-radius: 2px;
}
</style>