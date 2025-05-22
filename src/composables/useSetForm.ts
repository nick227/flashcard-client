import { ref, computed } from 'vue'
import type { FlashCard, SetPrice } from '@/types'
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
  const cards = ref<FlashCard[]>([])
  const formSubmitted = ref(false)
  const cardsTouched = ref(false)

  const hasBlankCard = computed(() => cards.value.some(card => !card.front.trim() || !card.back.trim()))

  const canSubmit = computed(() => {
    return (
      setTitle.value.trim() &&
      setDescription.value.trim() &&
      setCategoryId.value &&
      cards.value.length > 0 &&
      !hasBlankCard.value
    )
  })

  const validateForm = () => {
    if (!setTitle.value.trim()) {
      return { isValid: false, error: 'Set title is required.' }
    }
    if (!setDescription.value.trim()) {
      return { isValid: false, error: 'Set description is required.' }
    }
    if (!setCategoryId.value) {
      return { isValid: false, error: 'Set category is required.' }
    }

    if (thumbnailFile.value) {
      if (!VALIDATION_LIMITS.THUMBNAIL.ALLOWED_TYPES.includes(thumbnailFile.value.type)) {
        return { isValid: false, error: 'Thumbnail must be a valid image file (JPEG, PNG, GIF, or WebP).' }
      }
      if (thumbnailFile.value.size > VALIDATION_LIMITS.THUMBNAIL.MAX_SIZE_BYTES) {
        return { isValid: false, error: `Thumbnail size must be less than ${VALIDATION_LIMITS.THUMBNAIL.MAX_SIZE_MB}MB.` }
      }
    }

    const cardsValidation = CardService.validateCards(cards.value)
    if (!cardsValidation.isValid) {
      return cardsValidation
    }

    // Check card content length
    const hasLongContent = cards.value.some(card => 
      card.front.length > VALIDATION_LIMITS.CARD.MAX_CHARS || 
      card.back.length > VALIDATION_LIMITS.CARD.MAX_CHARS ||
      (card.hint && card.hint.length > VALIDATION_LIMITS.CARD.MAX_CHARS)
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

  const updateCard = (updatedCard: FlashCard) => {
    cards.value = CardService.updateCard(cards.value, updatedCard)
  }

  const deleteCard = (id: number) => {
    cards.value = CardService.deleteCard(cards.value, id)
  }

  const updateOrder = (newOrder: FlashCard[]) => {
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
    updateOrder
  }
} 