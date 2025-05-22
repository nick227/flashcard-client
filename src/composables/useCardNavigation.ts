import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import type { FlashCard } from '@/types'
import { useToaster } from './useToaster'

export function useCardNavigation(cards: Ref<FlashCard[]>) {
  const currentIndex = ref(0)
  const flipped = ref(false)
  const currentFlip = ref(0)
  const { toast } = useToaster()

  const isNextDisabled = computed(() => {
    if (currentIndex.value === cards.value.length - 1 && flipped.value) {
      return true
    }
    return false
  })

  const isPrevDisabled = computed(() => {
    if (currentIndex.value === 0 && !flipped.value) {
      return true
    }
    return false
  })

  const resetNavigation = () => {
    currentIndex.value = 0
    flipped.value = false
  }

  const nextCard = () => {
    if (currentIndex.value === cards.value.length - 1) {
      if (!flipped.value) {
        flipped.value = true
        currentFlip.value++
        toast('You have reached the end of the set!', 'info')
      }
      return
    }

    if (!flipped.value) {
      flipped.value = true
      currentFlip.value++
      return
    }

    currentIndex.value++
    flipped.value = false
    currentFlip.value++
  }

  const prevCard = () => {
    if (currentIndex.value === 0) {
      if (flipped.value) {
        flipped.value = false
        currentFlip.value--
      }
      return
    }

    if (flipped.value) {
      flipped.value = false
      currentFlip.value--
      return
    }

    currentIndex.value--
    flipped.value = true
    currentFlip.value--
  }

  const handleCardFlip = (isFlipped: boolean) => {
    if (isFlipped) {
      currentFlip.value++
    } else {
      currentFlip.value--
    }
    flipped.value = isFlipped

    if (isFlipped && currentIndex.value === cards.value.length - 1) {
      toast('You have reached the end of the set!', 'info')
    }
  }

  return {
    currentIndex,
    flipped,
    currentFlip,
    isNextDisabled,
    isPrevDisabled,
    nextCard,
    prevCard,
    handleCardFlip,
    resetNavigation
  }
} 