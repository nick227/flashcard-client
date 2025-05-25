import { ref } from 'vue'
import type { Ref } from 'vue'
import type { FlashCard } from '@/types'

interface CardViewState {
  id: number
  frontViewed: boolean
  backViewed: boolean
}

export function useCardGrid(cards: Ref<FlashCard[]>) {
  const showGridView = ref(false)
  const gridCardStates = ref<Record<number, boolean>>({})
  const viewedCards = ref<CardViewState[]>([])

  const toggleGridView = () => {
    showGridView.value = !showGridView.value
    if (showGridView.value) {
      setTimeout(() => {
        window.scrollTo({
          top: 640,
          behavior: 'smooth'
        })
      }, 20)
    }
  }

  // Fisher-Yates shuffle algorithm
  const shuffleArray = (array: FlashCard[]) => {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray
  }

  const syncGridStates = (newCards: FlashCard[]) => {
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
    gridCardStates,
    viewedCards,
    toggleGridView,
    handleGridCardFlip,
    shuffleCardOrder
  }
} 