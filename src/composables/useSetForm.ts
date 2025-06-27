import { ref, computed } from 'vue'
import type { Card } from '@/types/card'
import type { SetPrice } from '@/types'
import { CardService } from '@/services/CardService'

export function useSetForm() {
  const title = ref('')
  const description = ref('')
  const category = ref(0)
  const setTags = ref<string[]>([])
  const setPrice = ref<SetPrice>({ type: 'free' })
  const thumbnailFile = ref<File | null>(null)
  const setThumbnail = ref<string | null>(null)
  const cards = ref<Card[]>([])
  const formSubmitted = ref(false)
  const cardsTouched = ref(false)
  const setGenerating = ref(false)

  const hasBlankCard = computed(() => {
    return cards.value.some(card => {
      // Check if any cell in front or back is empty
      const frontHasContent = card.front.content?.trim() || false
      const backHasContent = card.back.content?.trim() || false
      return !frontHasContent || !backHasContent
    })
  })

  const hasLongContent = computed(() => {
    return cards.value.some(card => {
      // Check text length in front and back
      const frontHasLongContent = card.front?.content?.length && card.front.content.length > 500 || false
      const backHasLongContent = card.back?.content?.length && card.back.content.length > 500 || false
      return frontHasLongContent || backHasLongContent
    })
  })

  const validateForm = () => {
    formSubmitted.value = true
    const { isValid, error } = CardService.validateCards(cards.value)
    if (!isValid) {
      return { isValid, error }
    }
    return { isValid: true }
  }

  const resetForm = () => {
    title.value = ''
    description.value = ''
    category.value = 0
    cards.value = []
  }

  const addCard = () => {
    const tempDeckId = `temp-${Date.now()}` // Create a temporary deckId
    const newCard = CardService.createEmptyCard(tempDeckId)
    cards.value.unshift(newCard)
    cardsTouched.value = true
  }

  const deleteCard = (index: number) => {
    cards.value.splice(index, 1)
    cardsTouched.value = true
  }

  const updateCard = (updatedCard: Card) => {
    const index = cards.value.findIndex(c => c.id === updatedCard.id)
    if (index !== -1) {
      cards.value[index] = updatedCard
      cardsTouched.value = true
    }
  }

  const updateOrder = (newOrder: Card[]) => {
    cards.value = [...newOrder]
    cardsTouched.value = true
  }

  return {
    title,
    description,
    category,
    setTags,
    setPrice,
    thumbnailFile,
    setThumbnail,
    cards,
    formSubmitted,
    cardsTouched,
    hasBlankCard,
    hasLongContent,
    setGenerating,
    validateForm,
    resetForm,
    addCard,
    deleteCard,
    updateCard,
    updateOrder
  }
}