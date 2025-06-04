import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import type { FlashCard } from '@/types/card'

export function useCardNavigation(cards: Ref<FlashCard[]>) {
  const currentIndex = ref(0)
  const flipped = ref(false)
  const currentFlip = ref(0)

  const isPrevDisabled = computed(() => currentIndex.value === 0 && !flipped.value)
  const isNextDisabled = computed(() => {
    // Only disable next if we're at the last card AND it's flipped
    return currentIndex.value === cards.value.length - 1 && flipped.value
  })

  const prevCard = () => {
    if (flipped.value) {
      // If card is flipped, just unflip it
      flipped.value = false
      currentFlip.value = currentIndex.value * 2
    } else if (currentIndex.value > 0) {
      // If not flipped and not at first card, go to previous card
      currentIndex.value--
      currentFlip.value = currentIndex.value * 2
    }
  }

  const nextCard = () => {
    if (!flipped.value) {
      // If card is not flipped, flip it
      flipped.value = true
      currentFlip.value = (currentIndex.value * 2) + 1
    } else if (currentIndex.value < cards.value.length - 1) {
      // If flipped and not at last card, go to next card
      currentIndex.value++
      flipped.value = false
      currentFlip.value = currentIndex.value * 2
    }
  }

  const handleCardFlip = (newFlipped: boolean) => {
    flipped.value = newFlipped
    currentFlip.value = (currentIndex.value * 2) + (newFlipped ? 1 : 0)
  }

  return {
    currentIndex,
    flipped,
    currentFlip,
    isPrevDisabled,
    isNextDisabled,
    prevCard,
    nextCard,
    handleCardFlip
  }
} 