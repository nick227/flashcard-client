import { computed } from 'vue'
import type { Ref } from 'vue'
import type { FlashCard } from '@/types/card'

export function useCardProgress(cards: Ref<FlashCard[]>, currentFlip: Ref<number>) {
  const progressPercent = computed(() => {
    if (!cards.value.length) return 0
    
    // Calculate progress based on current card index and flip state
    const totalCards = cards.value.length
    const currentCard = Math.floor(currentFlip.value / 2)
    const isFlipped = currentFlip.value % 2 === 1
    
    // Progress is based on cards viewed (front and back)
    // Each card contributes 2 points (front and back)
    // Progress is complete when we've seen all cards' backs
    const progress = ((currentCard * 2 + (isFlipped ? 1 : 0)) / (totalCards * 2)) * 100
    
    // Ensure we reach 100% when we've seen the back of the last card
    if (currentCard === totalCards - 1 && isFlipped) {
      return 100
    }
    
    return Math.min(100, Math.round(progress))
  })

  return {
    progressPercent
  }
} 