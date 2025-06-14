import { ref, computed } from 'vue'
import type { SetPrice } from '@/types'
import type { CardView } from '@/types/card'
import { CardService } from '@/services/CardService'

export function useSetForm() {
  const title = ref('')
  const description = ref('')
  const category = ref<number>(0)
  const cards = ref<CardView[]>([])
  const setTags = ref<string[]>([])
  const setPrice = ref<SetPrice>({ type: 'free', amount: 0 })
  const thumbnailFile = ref<File | null>(null)
  const setThumbnail = ref<string | null>(null)
  const formSubmitted = ref(false)
  const cardsTouched = ref(false)
  const setGenerating = ref(false)

  const hasBlankCard = computed(() => {
    return cards.value.some(card => {
      const frontHasContent = card.front.text.trim() !== '' || card.front.imageUrl !== null
      const backHasContent = card.back.text.trim() !== '' || card.back.imageUrl !== null
      return !frontHasContent || !backHasContent
    })
  })

  const hasLongContent = computed(() => {
    return cards.value.some(card => {
      // Check text length in front and back
      const frontHasLongContent = card.front.text.length > 500
      const backHasLongContent = card.back.text.length > 500
      return frontHasLongContent || backHasLongContent
    })
  })

  const validateForm = () => {
    if (!title.value.trim()) {
      return { isValid: false, error: 'Please enter a title' }
    }

    if (!description.value.trim()) {
      return { isValid: false, error: 'Please enter a description' }
    }

    if (!category.value) {
      return { isValid: false, error: 'Please select a category' }
    }

    if (cards.value.length === 0) {
      return { isValid: false, error: 'Please add at least one card' }
    }

    if (hasBlankCard.value) {
      return { isValid: false, error: 'Please fill in all card content' }
    }

    if (hasLongContent.value) {
      return { isValid: false, error: 'Some cards have content that is too long (max 500 characters)' }
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
    if (hasBlankCard.value) return
    const newCard = CardService.createNewCard()
    cards.value = [newCard, ...cards.value]
  }

  const updateCard = (updatedCard: CardView) => {
    console.log('Updating card:', updatedCard)
    cards.value = CardService.updateCard(cards.value, updatedCard)
  }

  const deleteCard = (id: number) => {
    cards.value = CardService.deleteCard(cards.value, id)
  }

  const updateOrder = (newOrder: CardView[]) => {
    cards.value = CardService.reorderCards(cards.value, newOrder)
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
    validateForm,
    resetForm,
    addCard,
    updateCard,
    deleteCard,
    updateOrder,
    setGenerating
  }
}