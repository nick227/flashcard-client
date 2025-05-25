<template>
  <div class="container flex flex-col items-center justify-start w-full px-4 py-12 mb-32">
    <div v-if="loading" class="text-gray-500 text-lg">Loading cards...</div>
    <div v-if="historyLoading" class="text-gray-500 text-sm">Loading history...</div>
    <div v-if="historyError" class="text-red-500 text-sm">{{ historyError }}</div>
    <div v-else-if="error" class="text-red-500 text-lg">{{ error }}</div>
    <div v-else-if="!set" class="text-gray-500 text-lg">Set not found</div>
    <div v-else-if="unauthorized && set" class="w-full max-w-4xl mx-auto">
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
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
            <button v-if="accessDetails?.setType === 'subscriber'" @click="redirectToCheckout(setId)"
              class="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg transition-colors flex items-center">
              <i class="fas fa-user-plus mr-2"></i>
              Subscribe to Educator
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- No Cards -->
    <div v-else-if="!cards || cards.length === 0" class="w-full max-w-4xl mx-auto">
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
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
      <CardHeader v-if="set" :set="set" :is-liked="isLiked" :set-likes="setLikes" @download="downloadSet"
        @toggle-like="toggleLikeSet" />

      <!-- Main Card Area -->
      <div class="main-card-area flex-1 min-h-[600px] flex flex-col" tabindex="0" :class="{ 'fullscreen': isFullScreen }">
        <!-- Single Card View -->
        <div class="flex-1 flex flex-col">
          <div class="flex-1 flex items-center justify-center">
            <FlashCardScaffold v-if="cards && cards.length > 0 && cards[currentIndex]" :card="cards[currentIndex]"
              :flipped="flipped" :current-flip="currentFlip" @flip="handleCardFlip" />
            <div v-else class="text-center text-gray-500 py-8">
              No cards available to display
            </div>
          </div>
          <CardControls 
            v-if="cards && cards.length > 0" 
            :current-index="currentIndex" 
            :total-cards="cards.length"
            :is-prev-disabled="isPrevDisabled" 
            :is-next-disabled="isNextDisabled" 
            :progress-percent="progressPercent"
            :show-exit="isFullScreen"
            mode="view"
            @prev="prevCard" 
            @next="handleNextCardWithHistory" 
          />
        </div>
      </div>

      <!-- Bottom Controls -->
      <div class="flex justify-center w-full mb-4">
        <div class="flex gap-2">
          <a @click="handleShuffle" class="button-round" href="javascript:void(0)"><i class="fa-solid fa-shuffle"></i> Shuffle Cards</a>
          <a @click="toggleGridView" class="button-round" href="javascript:void(0)"><i class="fa-solid fa-table-cells"></i> Grid View</a>
          <a @click="toggleFullScreen" class="button-round" href="javascript:void(0)"><i class="fa-solid fa-expand"></i> Full-Screen</a>
        </div>
        <CardHint v-if="cards[currentIndex]?.hint" :hint="cards[currentIndex].hint || ''" @show-hint="showHintToast" />
      </div>

      <!-- Grid View -->
      <div v-if="showGridView" class="mt-4">
        <CardGrid 
          :cards="cards" 
          :grid-card-states="gridCardStates" 
          :flipped="gridFlipped"
          :current-flip="gridCurrentFlip"
          @card-flip="handleGridCardFlip" 
        />
      </div>
    </div>
    <Toaster :toasts="toasts" @remove="remove" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import { apiEndpoints, api } from '@/api'
import FlashCardScaffold from '@/components/common/FlashCardScaffold.vue'
import CardControls from './CardControls.vue'
import CardGrid from './CardGrid.vue'
import CardHeader from './CardHeader.vue'
import CardHint from './CardHint.vue'
import { useCardNavigation } from '@/composables/useCardNavigation.ts'
import { useCardProgress } from '@/composables/useCardProgress.ts'
import { useCardLikes } from '@/composables/useCardLikes.ts'
import { useCardGrid } from '@/composables/useCardGrid.ts'
import type { FlashCard, FlashCardSet } from '@/types'
import { useRouter, useRoute } from 'vue-router'
import { useToaster } from '@/composables/useToaster'
import Toaster from '@/components/common/Toaster.vue'
import { useViewHistory } from '@/composables/useViewHistory'

const props = defineProps<{
  setId: number | string
}>()

const route = useRoute()
const router = useRouter()
const { toast, toasts, remove } = useToaster()
const loading = ref(true)
const checkoutLoading = ref(false)
const cards = ref<FlashCard[]>([])
const set = ref<FlashCardSet | null>(null)
const unauthorized = ref(false)
const accessDetails = ref<any>(null)
const error = ref('')

// Use composables
const {
  currentIndex,
  flipped,
  currentFlip,
  isPrevDisabled,
  isNextDisabled,
  prevCard,
  nextCard: handleNextCard,
  handleCardFlip: handleCardNavigation,
  resetNavigation
} = useCardNavigation(cards)

const {
  progressPercent
} = useCardProgress(cards, currentFlip)

const {
  isLiked,
  setLikes,
  toggleLikeSet,
  fetchUserLikeForSet,
  fetchSetLikes
} = useCardLikes(props.setId)

const {
  showGridView,
  gridCardStates,
  viewedCards,
  toggleGridView,
  shuffleCardOrder,
  handleGridCardFlip
} = useCardGrid(cards)

// Separate state for grid view
const gridFlipped = ref(false)
const gridCurrentFlip = ref(0)

// Reset grid state when toggling views
watch(showGridView, (newValue) => {
  if (newValue) {
    gridFlipped.value = false
    gridCurrentFlip.value = 0
  }
})

const showHint = ref(false)

const isFullScreen = ref(false)

const toggleFullScreen = () => {
  const mainCardArea = document.querySelector('.main-card-area') as HTMLElement | null
  if (!mainCardArea) return

  if (!document.fullscreenElement) {
    mainCardArea.requestFullscreen()
    isFullScreen.value = true
    document.addEventListener('fullscreenchange', handleFullScreenChange)
    // Ensure focus after entering fullscreen
    setTimeout(() => {
      mainCardArea.focus()
    }, 100)
  } else {
    document.exitFullscreen()
    isFullScreen.value = false
  }
}

const handleFullScreenChange = () => {
  isFullScreen.value = !!document.fullscreenElement
  const mainCardArea = document.querySelector('.main-card-area') as HTMLElement | null
  if (mainCardArea) {
    // Ensure focus after fullscreen change
    setTimeout(() => {
      mainCardArea.focus()
    }, 100)
  }
}

const showHintToast = () => {
  const hint = cards.value[currentIndex.value]?.hint
  if (hint) {
    toast(hint, 'info')
  }
}

function formatPrice(price: number | undefined): string {
  if (!price) return '0.00'
  return price.toFixed(2)
}

const {
    loading: historyLoading,
    error: historyError,
    initializeHistory,
    updateCardsViewed,
    markAsCompleted
} = useViewHistory(Number(props.setId))

const fetchSet = async () => {
    if (!props.setId) {
        console.error('No setId provided to fetchSet!')
        return
    }
    try {
        const res = await axios.get(`${apiEndpoints.sets}/${props.setId}`)
        set.value = res.data

        // Check for access information
        if (res.data.access && !res.data.access.hasAccess) {
            unauthorized.value = true
            accessDetails.value = res.data.access
            cards.value = []
        } else {
            unauthorized.value = false
            accessDetails.value = null

            const cardsData = Array.isArray(res.data.cards) ? res.data.cards : []
            cards.value = cardsData.map((card: { id: number; setId: number; front: string; back: string; hint?: string }) => ({
                id: card.id,
                setId: card.setId,
                front: card.front || '',
                back: card.back || '',
                hint: card.hint || ''
            }))

            // Initialize history tracking
            await initializeHistory()

            // Reset state
            currentIndex.value = 0
            flipped.value = false
            showHint.value = false
            currentFlip.value = 0

            // Initialize viewed cards
            viewedCards.value = cards.value.map(card => ({
                id: card.id,
                frontViewed: false,
                backViewed: false
            }))
        }
    } catch (err) {
        console.error('FlashCardViewer - Failed to fetch set:', err)
        error.value = 'Failed to load flashcard set'
    } finally {
        loading.value = false
    }
}

const downloadSet = async () => {
  try {
    const res = await axios.get(`${apiEndpoints.sets}/${props.setId}`)
    const url = res.data.downloadUrl
    if (url) {
      window.open(url, '_blank')
    } else {
      console.error('No download URL found for this set.')
    }
  } catch (err) {
    console.error('Failed to fetch download URL:', err)
  }
}

// Stripe
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

const redirectToCheckout = async (setId: number | string) => {
  checkoutLoading.value = true
  try {
    const { data } = await api.get(`${apiEndpoints.checkout}/${setId}`)
    const stripe = await stripePromise
    if (data.url && stripe) {
      window.location.href = data.url
    }
  } catch (error) {
    toast('Failed to create checkout session', 'error')
  } finally {
    checkoutLoading.value = false
  }
}

// Keyboard navigation
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isFullScreen.value) {
    document.exitFullscreen()
    return
  }

  switch (e.key) {
    case 'ArrowLeft':
      prevCard()
      break
    case 'ArrowRight':
      handleNextCardWithHistory()
      break
    case 'h':
      if (cards.value[currentIndex.value]?.hint) {
        showHint.value = !showHint.value
      }
      break
  }
}

// Check for canceled checkout
onMounted(async () => {
  if (route.query.canceled === 'true') {
    toast('Checkout was canceled. You can try again when you\'re ready.', 'info')
    router.replace({ path: route.path })
  }

  // Add global keyboard listener
  window.addEventListener('keydown', handleKeyDown)
})

// Watch for setId changes and fetch data
watch(() => props.setId, async (newId) => {
  if (newId) {
    loading.value = true
    await fetchSet()
    await Promise.all([
      fetchUserLikeForSet(),
      fetchSetLikes()
    ])
  }
}, { immediate: true })

// Cleanup
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('fullscreenchange', handleFullScreenChange)
})

const handleShuffle = () => {
  const { newOrder } = shuffleCardOrder()
  
  // Reset navigation state
  resetNavigation()
  
  // Update cards with new order
  cards.value = newOrder
}

// Update handleCardFlip to track viewed cards
const handleCardFlip = async () => {
    console.log('Card flipped, current state:', {
        currentIndex: currentIndex.value,
        flipped: flipped.value,
        viewedCards: viewedCards.value
    })

    // Call the navigation handler first
    handleCardNavigation(!flipped.value)

    // Update viewed cards state
    if (cards.value[currentIndex.value]) {
        const cardId = cards.value[currentIndex.value].id
        const cardState = viewedCards.value.find(state => state.id === cardId)
        if (cardState) {
            if (!flipped.value) {
                cardState.frontViewed = true
            } else {
                cardState.backViewed = true
            }
        }
    }

    // Update history with number of cards viewed
    const uniqueViewedCards = viewedCards.value.filter(card => card.frontViewed || card.backViewed).length
    console.log('Updating cards viewed:', uniqueViewedCards)
    await updateCardsViewed(uniqueViewedCards)

    // Check if this is the last card and both sides have been viewed
    if (currentIndex.value === cards.value.length - 1 && 
        flipped.value && 
        viewedCards.value.every(card => card.frontViewed && card.backViewed)) {
        console.log('Marking set as completed')
        await markAsCompleted()
    }
}

// Update nextCard to check for completion
const handleNextCardWithHistory = async () => {
    if (isNextDisabled.value) return

    // Call the navigation handler first
    handleNextCard()

    // If we're at the last card and it's flipped, mark as completed
    if (currentIndex.value === cards.value.length - 1 && flipped.value) {
        await markAsCompleted()
    }
}
</script>