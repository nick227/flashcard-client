import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import type { Card } from '@/types/card'
import { useCardNavigation } from './useCardNavigation'
import { useViewHistory } from './useViewHistory'
import { useCardProgress } from './useCardProgress'

interface CardViewState {
  id: number
  frontViewed: boolean
  backViewed: boolean
}

export function useCardViewer(cards: Ref<Card[]>, setId: number) {
  const {
    currentIndex,
    flipped,
    currentFlip,
    isPrevDisabled,
    prevCard,
    nextCard,
    handleCardFlip,
    resetNavigation
  } = useCardNavigation(cards)

  const {
    loading: historyLoading,
    error: historyError,
    initializeHistory,
    markAsCompleted
  } = useViewHistory(setId)

  const viewedCards = ref<CardViewState[]>([])
  const hasStarted = ref(false)

  const { progressPercent, currentStep, totalSteps } = useCardProgress(cards, currentIndex, flipped)

  const isNextDisabled = computed(() => {
    const isLastCard = currentIndex.value === cards.value.length - 1
    return isLastCard && flipped.value
  })

  const handleCardFlipWithHistory = async () => {
    // Call the navigation handler
    handleCardFlip()

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

    // Check if set is complete (all cards viewed both sides)
    const isComplete = viewedCards.value.every(card => card.frontViewed && card.backViewed)
    if (isComplete) {
      await markAsCompleted()
    }
  }

  const handleNextCardWithHistory = async () => {
    // If we haven't started yet, flip the current card instead of advancing
    if (!hasStarted.value) {
      hasStarted.value = true
      handleCardFlipWithHistory()
      return
    }

    // Use the simplified navigation
    nextCard()
  }

  const handlePrevCardWithHistory = () => {
    // Use the simplified navigation
    prevCard()
  }

  const initializeViewer = async () => {
    // Initialize viewed cards
    viewedCards.value = cards.value.map(card => ({
      id: typeof card.id === 'string' ? parseInt(card.id, 10) : card.id,
      frontViewed: false,
      backViewed: false
    }))

    // Reset hasStarted
    hasStarted.value = false

    // Initialize history
    await initializeHistory()
  }

  const handleRestart = async () => {
    // Reset navigation state
    resetNavigation()
    
    // Reset viewed cards state
    viewedCards.value = cards.value.map(card => ({
      id: typeof card.id === 'string' ? parseInt(card.id, 10) : card.id,
      frontViewed: false,
      backViewed: false
    }))

    // Reset hasStarted
    hasStarted.value = false
  }

  return {
    currentIndex,
    flipped,
    currentFlip,
    isPrevDisabled,
    isNextDisabled,
    progressPercent,
    currentStep,
    totalSteps,
    historyLoading,
    historyError,
    viewedCards,
    handleCardFlip: handleCardFlipWithHistory,
    handleNextCardWithHistory,
    prevCard: handlePrevCardWithHistory,
    initializeViewer,
    handleRestart
  }
} 