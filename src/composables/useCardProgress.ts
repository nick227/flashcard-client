import { computed, type Ref } from 'vue'
import type { Card } from '@/types/card'

export function useCardProgress(cards: Ref<Card[]>, currentIndex: Ref<number>, flipped: Ref<boolean>) {
  const progressPercent = computed(() => {
    if (!cards.value.length) return 0
    
    // Calculate current position (0-based)
    // Each card has 2 states: front (0) and back (1)
    // Progress advances when viewing back of card
    const currentPosition = (currentIndex.value * 2) + (flipped.value ? 1 : 0)
    const totalPositions = (cards.value.length * 2) - 1 // Subtract 1 to make last back view complete
    
    // Calculate percentage
    return Math.min((currentPosition / totalPositions) * 100, 100)
  })

  const currentStep = computed(() => {
    if (!cards.value.length) return 0
    // Each card has 2 states: front (0) and back (1)
    return (currentIndex.value * 2) + (flipped.value ? 1 : 0)
  })

  const totalSteps = computed(() => (cards.value.length * 2) - 1)

  return {
    progressPercent,
    currentStep,
    totalSteps
  }
} 