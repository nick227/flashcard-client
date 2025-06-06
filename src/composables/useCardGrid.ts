import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import type { Card } from '@/types/card'

interface CardViewState {
  id: number
  frontViewed: boolean
  backViewed: boolean
}

export function useCardGrid(cards: Ref<Card[]>) {
  // Single source of truth for view state
  const activeView = ref<'grid' | 'mobile' | null>(null)
  const gridCardStates = ref<Record<number, boolean>>({})
  const viewedCards = ref<CardViewState[]>([])

  // Computed for compatibility
  const showGridView = computed(() => activeView.value === 'grid')
  const showMobileView = computed(() => activeView.value === 'mobile')

  const toggleGridView = () => {
    if (activeView.value !== 'grid') {
      activeView.value = 'grid'
      setTimeout(() => {
        window.scrollTo({
          top: 640,
          behavior: 'smooth'
        })
      }, 20)
    } else {
      activeView.value = null
    }
  }

  const toggleMobileView = () => {
    if (activeView.value !== 'mobile') {
      activeView.value = 'mobile'
    } else {
      activeView.value = null
    }
  }

  // Fisher-Yates shuffle algorithm
  const shuffleArray = (array: Card[]) => {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray
  }

  const syncGridStates = (newCards: Card[]) => {
    const newStates: Record<number, boolean> = {}
    newCards.forEach(card => {
      newStates[card.id] = gridCardStates.value[card.id] || false
    })
    gridCardStates.value = newStates
  }

  const shuffleCardOrder = () => {
    // Shuffle using Fisher-Yates
    const shuffledCards = shuffleArray([...cards.value])
    
    // Sync grid states with new order
    syncGridStates(shuffledCards)

    return {
      newOrder: shuffledCards
    }
  }

  const handleGridCardFlip = (cardId: number, isFlipped: boolean) => {
    gridCardStates.value[cardId] = isFlipped

    const cardState = viewedCards.value.find(c => c.id === cardId)
    if (cardState) {
      if (isFlipped) cardState.backViewed = true
      else cardState.frontViewed = true
    } else {
      viewedCards.value.push({
        id: cardId,
        frontViewed: !isFlipped,
        backViewed: isFlipped
      })
    }
  }

  return {
    showGridView,
    showMobileView,
    gridCardStates,
    viewedCards,
    toggleGridView,
    toggleMobileView,
    handleGridCardFlip,
    shuffleCardOrder
  }
} 