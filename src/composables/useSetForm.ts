import { ref, computed } from 'vue'
import type { SetPrice } from '@/types'
import type { Card } from '@/types/card'
import { CardService } from '@/services/CardService'
import { VALIDATION_LIMITS } from '@/constants/validation'

export function useSetForm() {
  const setTitle = ref('')
  const setDescription = ref('')
  const setCategoryId = ref<number | null>(null)
  const setTags = ref<string[]>([])
  const setPrice = ref<SetPrice>({ type: 'free', amount: 0 })
  const thumbnailFile = ref<File | null>(null)
  const setThumbnail = ref<string | null>(null)
  const cards = ref<Card[]>([])
  const formSubmitted = ref(false)
  const cardsTouched = ref(false)
  const setGenerating = ref(false)

  const hasBlankCard = computed(() => cards.value.some((card: Card) =>
    !card.front.text && !card.front.imageUrl ||
    !card.back.text && !card.back.imageUrl
  ))

  const canSubmit = computed(() => {
    return setTitle.value && 
           setDescription.value && 
           setCategoryId.value && 
           cards.value.length > 0 && 
           !hasBlankCard.value
  })

  const validateForm = () => {
    if (!setTitle.value) {
      return { isValid: false, error: 'Please enter a title' }
    }
    if (!setDescription.value) {
      return { isValid: false, error: 'Please enter a description' }
    }
    if (!setCategoryId.value) {
      return { isValid: false, error: 'Please select a category' }
    }
    if (cards.value.length === 0) {
      return { isValid: false, error: 'Please add at least one card' }
    }
    if (hasBlankCard.value) {
      return { isValid: false, error: 'Please fill in all card content' }
    }

    // Check card content length
    const hasLongContent = cards.value.some((card: Card) =>
      (card.front.text && card.front.text.length > VALIDATION_LIMITS.CARD.MAX_CHARS) ||
      (card.back.text && card.back.text.length > VALIDATION_LIMITS.CARD.MAX_CHARS)
    )
    if (hasLongContent) {
      return { isValid: false, error: `Card content cannot exceed ${VALIDATION_LIMITS.CARD.MAX_CHARS} characters.` }
    }

    return { isValid: true }
  }

  const addCard = () => {
    if (hasBlankCard.value) return
    const newCard = CardService.createNewCard()
    cards.value = [newCard, ...cards.value]
  }

  const updateCard = (updatedCard: Card) => {
    cards.value = CardService.updateCard(cards.value, updatedCard)
  }

  const deleteCard = (id: number) => {
    cards.value = CardService.deleteCard(cards.value, id)
  }

  const updateOrder = (newOrder: Card[]) => {
    cards.value = CardService.reorderCards(cards.value, newOrder)
  }

  return {
    setTitle,
    setDescription,
    setCategoryId,
    setTags,
    setPrice,
    thumbnailFile,
    setThumbnail,
    cards,
    formSubmitted,
    cardsTouched,
    hasBlankCard,
    canSubmit,
    validateForm,
    addCard,
    updateCard,
    deleteCard,
    updateOrder,
    setGenerating
  }
}