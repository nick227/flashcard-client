import { computed } from 'vue'
import type { Ref } from 'vue'
import type { FlashCard } from '@/types'

export function useCardProgress(
  cards: Ref<FlashCard[]>,
  currentFlip: Ref<number>
) {
  const progressPercent = computed(() => {
    if (!cards.value.length) return 0
    const totalPossibleFlips = (cards.value.length * 2) - 1
    return (currentFlip.value / totalPossibleFlips) * 100
  })

  return {
    progressPercent
  }
} 