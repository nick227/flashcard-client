<template>
  <div v-if="!loading"
    class="container-main  flex flex-col items-center justify-start w-full px-4 py-2 mb-8 sm:mb-2 relative">
    <div style="width: 100%;">
      <div v-if="!set" class="text-gray-500 text-lg">Set not found</div>
      <div v-else-if="unauthorized && set" class="w-full max-w-4xl mx-auto">
        <div class="bg-white rounded-lg overflow-hidden">
          <!-- Set Header with Image -->
          <div class="relative bg-gray-200 h-96">
            <img v-if="set?.thumbnail" :src="set.thumbnail" :alt="set?.title" class="w-full h-full object-contain" />
            <div v-else class="w-full h-full flex items-center justify-center bg-gray-100">
              <i class="fas fa-book text-4xl text-gray-400"></i>
            </div>
          </div>

          <!-- Set Details -->
          <div class="p-8">
            <div class="flex items-center justify-between mb-4">
              <span class="inline-block px-3 py-1 text-sm font-semibold text-blue-600 bg-blue-100 rounded-full">
                {{ set?.category }}
              </span>
              <div v-if="accessDetails?.setType === 'premium'" class="text-xl font-bold text-green-600">
                ${{ formatPrice(set?.price?.amount) }}
              </div>
            </div>

            <h1 class="text-3xl font-bold mb-4">{{ set?.title }}</h1>
            <p class="text-gray-600 mb-8">{{ set?.description }}</p>

            <!-- Access Message -->
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
              <div class="flex">
                <div class="flex-shrink-0">
                  <i class="fas fa-lock text-blue-500 text-xl"></i>
                </div>
                <div class="ml-3">
                  <p class="text-blue-700 font-medium">{{ accessDetails?.message }}</p>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex justify-center gap-4">
              <button v-if="accessDetails?.setType === 'premium'" @click="redirectToCheckout(setId)"
                :disabled="checkoutLoading"
                class="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
                <i class="fas" :class="checkoutLoading ? 'fa-spinner fa-spin' : 'fa-shopping-cart'"></i>
                <span class="ml-2">{{ checkoutLoading ? 'Processing...' : 'Purchase Set' }}</span>
              </button>
              <button v-if="accessDetails?.setType === 'subscriber'" @click="subscribeToUnlockSet(set?.educatorId)"
                :disabled="subscribeLoading"
                class="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
                <i class="fas" :class="subscribeLoading ? 'fa-spinner fa-spin' : 'fa-user-plus'"></i>
                <span class="ml-2">{{ subscribeLoading ? 'Processing...' : 'Subscribe to Educator' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- No Cards -->
      <div v-else-if="!cards || cards.length === 0" class="w-full max-w-4xl mx-auto">
        <div class="bg-white rounded-lg overflow-hidden">
          <!-- Set Header with Image -->
          <div class="relative bg-gray-200 h-96">
            <img v-if="set?.thumbnail" :src="set.thumbnail" :alt="set?.title" class="w-full h-full object-contain" />
            <div v-else class="w-full h-full flex items-center justify-center bg-gray-100">
              <i class="fas fa-book text-4xl text-gray-400"></i>
            </div>
          </div>

          <!-- Set Details -->
          <div class="p-8">
            <div class="flex items-center justify-between mb-4">
              <div>
                <span class="inline-block px-3 py-1 text-sm font-semibold text-blue-600 bg-blue-100 rounded-full">
                  {{ set?.category }}
                </span>
              </div>
            </div>

            <h1 class="text-3xl font-bold mb-4">{{ set?.title }}</h1>
            <p class="text-gray-600 mb-8">{{ set?.description }}</p>

            <!-- Empty State Message -->
            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-8">
              <div class="flex">
                <div class="flex-shrink-0">
                  <i class="fas fa-exclamation-circle text-yellow-500 text-xl"></i>
                </div>
                <div class="ml-3">
                  <p class="text-yellow-700 font-medium">This set doesn't have any cards yet.</p>
                  <p class="text-yellow-600 mt-1">Check back later or contact the educator for more information.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Card Area -->
      <div v-else class="w-full max-w-3xl mx-auto flex flex-col">
        <!-- Header with Download and Like -->
        <CardHeader v-if="set && !likesLoading" :set="set" :is-liked="isLiked || false" :set-likes="setLikes || 0"
          @download="downloadSet" @toggle-like="toggleLike" />

        <!-- Main Card Area -->
        <div class="main-card-area" tabindex="0"
          :class="{ 'fullscreen': isFullScreen }">
          <!-- Single Card View -->
          <div class="flex-1 flex flex-col w-full">
            <div class="flex-1 flex items-center justify-center">
              <template v-if="autoPlay">
                <template v-if="cards.length === 0">
                  <div class="text-center text-gray-500 py-8">No cards available to preview.</div>
                </template>
                <template v-else>
                  <div class="autoplay-preview-container">
                    <CardContent
                      v-if="previewCard && currentCardSide"
                      :card="previewCard as any"
                      :side="currentCardSide"
                      :is-editing="false"
                      :is-flipped="false"
                    />
                    <div v-else class="text-center text-gray-500 py-8">
                      Loading preview...
                    </div>
                  </div>
                </template>
              </template>
              <template v-else>
                <FlashCardScaffold v-if="cards && cards.length > 0 && cards[currentIndex]" :card="cards[currentIndex]"
                  :flipped="flipped" :current-flip="currentFlip" @flip="handleCardFlip" @next="handleNextWithLog"
                  @prev="handlePrevWithLog" />
                <div v-else class="text-center text-gray-500 py-8">
                  No cards available to display
                </div>
              </template>
            </div>
            <!-- Timer Bar for autoplay -->
            <div v-if="autoPlay" class="timer-bar pt-4 mb-24">
              <div class="timer-bar-fill" :style="{ width: `${timerProgress}%` }"></div>
            </div>
            <div v-if="autoPlay && isFullScreen" class="w-full flex justify-center items-center mb-12">
              <button style="height:36px;" class="button button-round" @click="toggleFullScreen">Exit Full-Screen</button>
            </div>
            <CardControls v-if="cards && cards.length > 0 && !autoPlay" :current-index="currentIndex" :total-cards="cards.length"
              :is-prev-disabled="isPrevDisabled" :is-next-disabled="isNextDisabled" :progress-percent="progressPercent"
              :show-exit="isFullScreen" mode="view" @prev="prevCard" @next="handleNextCardWithHistory" />
          </div>
        </div>

        <!-- Bottom Controls -->
        <div class="flex justify-center w-full mb-4 flex-wrap main-controls">
          <a @click="toggleAutoPlay"
             class="button-round"
             :aria-pressed="autoPlay"
             :title="autoPlay ? 'Pause Autoplay' : 'Start Autoplay'"
             :disabled="autoPlayLoading">
            <i :class="autoPlay ? 'fa-solid fa-pause' : 'fa-solid fa-play'"></i>
          </a>
          <a @click="handleRestart" :disabled="autoPlay" class="button-round" href="javascript:void(0)">
            <i class="fa-solid fa-rotate-right"></i> Restart
          </a>
          <a @click="handleShuffle" :disabled="autoPlay" class="button-round" href="javascript:void(0)">
            <i class="fa-solid fa-shuffle"></i> Shuffle
          </a>
          <a @click="toggleFullScreen" :disabled="autoPlay" class="button-round" href="javascript:void(0)">
            <i class="fa-solid fa-expand"></i> Full-Screen
          </a>
          <a @click="toggleMobileView" :class="['button-round', { active: showMobileView }]" href="javascript:void(0)">
            <i class="fa-solid fa-mobile"></i> Mobile
          </a>
          <CardHint v-if="cards[currentIndex]?.hint" :hint="cards[currentIndex].hint || ''"
            @show-hint="() => showHintToast(cards[currentIndex]?.hint || '')" />
        </div>
      </div>

      <!-- Mobile View -->
      <div v-if="showMobileView" class="my-4 w-full">
        <CardRiverMobile :cards="cards" />
      </div>
    </div>
    <!-- Related Sets-->
    <div v-if="set && !props.hideRelatedSets" class="w-full my-16">
      <RelatedSets :set-id="set.id" />
    </div>

    <Toaster :toasts="toasts" @remove="remove" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { api, getApiUrl, apiEndpoints } from '@/api'
import FlashCardScaffold from '@/components/common/FlashCardScaffold.vue'
import CardControls from './CardControls.vue'
import CardHeader from './CardHeader.vue'
import CardHint from './CardHint.vue'
import RelatedSets from './RelatedSets.vue'
import { useCardLikes } from '@/composables/useCardLikes.ts'
import { useCardGrid } from '@/composables/useCardGrid.ts'
import type { Card, CardLayout } from '@/types/card'
import type { FlashCardSet } from '@/types'
import { useToaster } from '@/composables/useToaster'
import Toaster from '@/components/common/Toaster.vue'
import CardRiverMobile from './CardRiverMobile.vue'
import { useCardViewer } from '@/composables/useCardViewer'
import { useCardControls } from '@/composables/useCardControls'
// import { loadStripe } from '@stripe/stripe-js'
import { useCardPreview } from '@/composables/useCardPreview'
import CardContent from '@/components/common/CardContent.vue'

const props = defineProps<{
  setId: number | string
  hideRelatedSets?: boolean
  hideHistory?: boolean
}>()

const { toast, toasts, remove } = useToaster()
const loading = ref(true)
const checkoutLoading = ref(false)
const subscribeLoading = ref(false)
const cards = ref<Card[]>([])
const set = ref<FlashCardSet | null>(null)
const unauthorized = ref(false)
const accessDetails = ref<any>(null)
const error = ref('')
const autoPlay = ref(false)
const timerProgress = ref(0)

// Use composables
const {
  currentIndex,
  flipped,
  currentFlip,
  isPrevDisabled,
  isNextDisabled,
  progressPercent,
  viewedCards,
  handleCardFlip,
  handleNextCardWithHistory,
  prevCard,
  initializeViewer,
  handleRestart
} = useCardViewer(cards, Number(props.setId))

const {
  isFullScreen,
  toggleFullScreen,
  showHintToast
} = useCardControls(cards)

const {
  likes: setLikes,
  userLiked: isLiked,
  loading: likesLoading,
  toggleLike,
  fetchUserLikeForSet,
  fetchSetLikes
} = useCardLikes(Number(props.setId))

const {
  shuffleCardOrder,
  showMobileView,
  toggleMobileView
} = useCardGrid(cards)

// Track autoplay initialization/loading
const autoPlayLoading = ref(false)

// Shared function to fetch set and cards
async function loadSetAndCards(setId: number) {
  try {
    const res = await api.get(getApiUrl(`${apiEndpoints.sets.base}/${setId}`))
    return res.data
  } catch (err) {
    console.error('Error fetching set/cards:', err)
    return null
  }
}

// fetchSet uses shared loader and updates set and cards
const fetchSet = async (setId?: number) => {
  const id = setId ?? Number(props.setId)
  if (!id) {
    console.error('No setId provided to fetchSet!')
    return
  }
  try {
    const data = await loadSetAndCards(id)
    if (!data) return
    set.value = data
    if (data.access && !data.access.hasAccess) {
      unauthorized.value = true
      accessDetails.value = data.access
      cards.value = []
    } else {
      const cardsData = Array.isArray(data.cards) ? data.cards : []
      cards.value = cardsData.map((card: RawCard) => transformCard(card, data))
      if(!props.hideHistory) await initializeViewer()
      await initializeLikes()
    }
  } catch (err) {
    console.error('Error fetching set:', err)
    let message = 'Failed to load flashcard set'
    const e = err as any
    if (e.response && e.response.data) {
      const data = e.response.data
      if (data.error && typeof data.error === 'string') {
        if (data.error.includes('hidden') || data.error.includes('not available') || data.error.includes('SET_HIDDEN')) {
          message = 'This set is hidden or unavailable. If you are the owner, check your visibility settings.'
        } else {
          message = data.error
        }
      } else if (data.message && typeof data.message === 'string') {
        message = data.message
      }
    }
    error.value = message
  } finally {
    loading.value = false
  }
}

// Now useCardPreview can be safely called
const {
  previewCard,
  currentCardSide,
  startPreview,
  stopPreview
} = useCardPreview(cards, fetchSet, Number(props.setId), 3600, timerProgress)

const downloadSet = async () => {
  try {
    // Create CSV content with headers
    const headers = ['Front', 'Back', 'Hint', 'Front Image', 'Back Image', 'Front Layout', 'Back Layout']
    const rows = cards.value.map(card => {
      // Helper to safely format CSV field
      const formatField = (value: string | null | undefined): string => {
        if (!value) return '""'
        // Escape quotes and wrap in quotes
        return `"${value.replace(/"/g, '""')}"`
      }

      return [
        formatField(card.front.content),
        formatField(card.back.content),
        formatField(card.hint),
        formatField(card.front.mediaUrl),
        formatField(card.back.mediaUrl),
        formatField(card.front.layout),
        formatField(card.back.layout)
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${set.value?.title || 'flashcards'}.csv`
    document.body.appendChild(link)
    link.click()

    // Cleanup
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast('Flashcards downloaded successfully', 'success')
  } catch (error) {
    console.error('Failed to download flashcards:', error)
    toast('Failed to download flashcards', 'error')
  }
}

// const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

const redirectToCheckout = async (setId: number | string) => {
  checkoutLoading.value = true
  try {
    const { data } = await api.get(`/checkout/${setId}`)
    // const stripe = await stripePromise
    if (data.url) {
      window.location.href = data.url
    }
  } catch (error) {
    toast('Failed to create checkout session', 'error')
  } finally {
    checkoutLoading.value = false
  }
}

const subscribeToUnlockSet = async (userId: number | string) => {
  if (subscribeLoading.value) return
  subscribeLoading.value = true
  loading.value = true // Add loading state for set refresh
  try {
    const res = await api.post(`/subscriptions/${userId}`)
    if (res.status === 201 || res.status === 200) {
      toast('Successfully subscribed!', 'success')
      // Reset state before fetching
      unauthorized.value = false
      accessDetails.value = null
      // Refresh the set data to update access
      await fetchSet()
    }
  } catch (error: any) {
    console.error('Error handling subscription:', error)
    const errorMessage = error.response?.data?.error || 'Failed to subscribe. Please try again.'
    toast(errorMessage, 'error')
  } finally {
    subscribeLoading.value = false
    loading.value = false // Ensure loading state is cleared
  }
}

// Initialize likes state
const initializeLikes = async () => {
  try {
    await Promise.all([
      fetchUserLikeForSet(),
      fetchSetLikes()
    ])
  } catch (err) {
    console.error('Error initializing likes:', err)
  }
}

// Watch for setId changes and fetch data
watch(() => props.setId, async (newId) => {
  if (newId) {
    loading.value = true
    try {
      await fetchSet()
    } catch (err) {
      console.error('Error fetching set data:', err)
    } finally {
      loading.value = false
    }
  }
}, { immediate: true })

// Watch for setId changes to stop preview and reset autoplay
watch(() => props.setId, () => {
  stopPreview()
  autoPlay.value = false
})

// Cleanup on unmount
onUnmounted(() => {
  stopPreview()
})

const handleShuffle = () => {
  const currentProgress = currentIndex.value
  const { newOrder } = shuffleCardOrder()
  cards.value = [...newOrder]

  // Update viewed cards array with safe IDs
  viewedCards.value = newOrder.map(card => {
    const existingState = viewedCards.value.find(vc => vc.id === getCardId(card))
    return existingState || {
      id: getCardId(card),
      frontViewed: false,
      backViewed: false
    }
  })

  currentIndex.value = currentProgress
}

// Helper function to safely get card ID
function getCardId(card: Card): number {
  return typeof card.id === 'string' ? parseInt(card.id, 10) : card.id
}

// Wrapper functions with console logs for debugging
const handleNextWithLog = () => {
  handleNextCardWithHistory()
}

const handlePrevWithLog = () => {
  prevCard()
}

function formatPrice(price: number | undefined): string {
  if (!price) return '0.00'
  return price.toFixed(2)
}

const toggleAutoPlay = async () => {
  if (autoPlayLoading.value) return
  autoPlayLoading.value = true
  autoPlay.value = !autoPlay.value
  if (autoPlay.value) {
    await startPreview()
    setTimeout(() => {
      autoPlayLoading.value = false
    }, 300)
  } else {
    stopPreview()
    autoPlayLoading.value = false
  }
}

// Add type for raw card data from API
interface RawCard {
  id: number
  front: {
    text?: string
    imageUrl?: string
    layout?: CardLayout
  }
  back: {
    text?: string
    imageUrl?: string
    layout?: CardLayout
  }
  hint?: string
  createdAt?: string
  updatedAt?: string
  reviewCount?: number
  lastReviewed?: string
  difficulty?: number
  deckId?: string
}

// Helper function to transform a card
function transformCard(card: RawCard, setData: any): Card {
  return {
    id: Number(card.id),
    title: setData.title || '',
    description: setData.description || '',
    front: {
      layout: card.front.layout || 'default' as CardLayout,
      content: card.front.text || '',
      mediaUrl: card.front.imageUrl || null
    },
    back: {
      layout: card.back.layout || 'default' as CardLayout,
      content: card.back.text || '',
      mediaUrl: card.back.imageUrl || null
    },
    hint: card.hint || null,
    createdAt: card.createdAt || new Date().toISOString(),
    updatedAt: card.updatedAt || new Date().toISOString(),
    reviewCount: card.reviewCount || 0,
    difficulty: card.difficulty || 0,
    userId: setData.educatorId?.toString() || '0',
    deckId: card.deckId || ''
  }
}
</script>

<style scoped>
@media (max-width: 768px) {
  .main-controls a {
    width: 100%;
    text-align: center;
    margin-bottom: 6px;
  }
}

.autoplay-progress-indicator {
  text-align: center;
  color: #888;
  font-size: 1.1rem;
  margin-top: 0.5rem;
}

.autoplay-preview-container {
  width: 100%;
  height: 470px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.timer-bar {
  width: 100%;
  height: 3px;
  border-radius: 2px;
  background: transparent;
  margin-top: 10px;
  position: relative;
}

.timer-bar-fill {
  height: 100%;
  background-color: blue;
  transition: width 0.3s linear;
}

.main-card-area.fullscreen {
  position: fixed;
  inset: 0;
  padding: 0 1em;
  width: calc(100vw - 2em);
  height: 100vh;
  background: #fff;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: auto;
  min-height: unset;
  max-width: unset;
  box-shadow: none;
}
</style>