import { ref, computed, type Ref } from 'vue'

export function transformCard(card: any): any {
  if (!card) return null
  return {
    ...card,
    front: {
      content: card.front?.content ?? card.front?.text ?? '',
      mediaUrl: card.front?.mediaUrl ?? card.front?.imageUrl ?? card.front_image ?? null,
      layout: card.front?.layout ?? card.layout_front ?? 'default'
    },
    back: {
      content: card.back?.content ?? card.back?.text ?? '',
      mediaUrl: card.back?.mediaUrl ?? card.back?.imageUrl ?? card.back_image ?? null,
      layout: card.back?.layout ?? card.layout_back ?? 'default'
    }
  }
}

export function useCardPreview(
  cards: Ref<any[]>,
  fetchCards: (setId: number) => Promise<void>,
  setId: number,
  intervalMs = 3600,
  timerProgress: Ref<number>
) {
  const previewCard = ref<any | null>(null)
  const currentCardSide = ref<'front' | 'back' | null>(null)
  let hoverInterval: number | null = null
  let timerInterval: number | null = null
  let timerStart = 0

  async function ensureCardsLoaded() {
    if (cards.value.length === 0) {
      await fetchCards(setId)
    }
    return cards.value.length > 0
  }

  function initializePreviewState(cardIndex = 0, side: 'front' | 'back' = 'front') {
    previewCard.value = transformCard(cards.value[cardIndex])
    currentCardSide.value = side
    startTimerProgress(intervalMs)
    return { cardIndex, side }
  }

  function startTimerProgress(duration: number) {
    timerProgress.value = 0
    timerStart = Date.now()
    if (timerInterval) clearInterval(timerInterval)
    timerInterval = window.setInterval(() => {
      const elapsed = Date.now() - timerStart
      timerProgress.value = Math.min((elapsed / duration) * 100, 100)
      if (timerProgress.value >= 100) {
        clearInterval(timerInterval!)
        timerInterval = null
      }
    }, 16) // ~60fps
  }

  function endTimerProgress() {
    timerProgress.value = 0
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  function startPreviewInterval(getIndexAndSide: () => { cardIndex: number, side: 'front' | 'back' }) {
    if (hoverInterval) return // Only start if not already running
    let { cardIndex, side } = getIndexAndSide()
    hoverInterval = window.setInterval(() => {
      if (!cards.value.length) return
      if (side === 'front') {
        side = 'back'
      } else {
        cardIndex = (cardIndex + 1) % cards.value.length
        side = 'front'
        startTimerProgress(intervalMs) 
      }
      previewCard.value = transformCard(cards.value[cardIndex])
      currentCardSide.value = side
    }, intervalMs)
  }

  async function startPreview() {
    const loaded = await ensureCardsLoaded()
    if (!loaded) return
    let cardIndex = 0
    let side: 'front' | 'back' = 'front'
    initializePreviewState(cardIndex, side)
    startPreviewInterval(() => ({ cardIndex, side }))
  }

  function stopPreview() {
    if (hoverInterval) {
      clearInterval(hoverInterval)
      hoverInterval = null
    }
    endTimerProgress()
    previewCard.value = null
    currentCardSide.value = null
  }

  return {
    previewCard: computed(() => previewCard.value),
    currentCardSide: computed(() => currentCardSide.value),
    startPreview,
    stopPreview
  }
} 