import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import type { Card } from '@/types/card'

export function useCardNavigation(cards: Ref<Card[]>) {
  const currentIndex = ref(0)
  const flipped = ref(false)
  const currentFlip = ref(0)

  const isPrevDisabled = computed(() => currentIndex.value === 0 && !flipped.value)

  const handleCardFlip = (forceFlip?: boolean) => {
    flipped.value = forceFlip !== undefined ? forceFlip : !flipped.value
    currentFlip.value++
  }

  const nextCard = () => {
    // If not flipped, flip first
    if (!flipped.value) {
      handleCardFlip(true)
      return
    }

    // If we're at the last card, do nothing
    if (currentIndex.value >= cards.value.length - 1) {
      return
    }

    // Move to next card and show front
    currentIndex.value++
    flipped.value = false
  }

  const prevCard = () => {
    // If flipped, flip back first
    if (flipped.value) {
      handleCardFlip(false)
      return
    }

    // If we're at the first card, do nothing
    if (currentIndex.value <= 0) {
      return
    }

    // Move to previous card and show back
    currentIndex.value--
    flipped.value = true
  }

  const resetNavigation = () => {
    currentIndex.value = 0
    flipped.value = false
    currentFlip.value = 0
  }

  return {
    currentIndex,
    flipped,
    currentFlip,
    isPrevDisabled,
    nextCard,
    prevCard,
    handleCardFlip,
    resetNavigation
  }
} 