import type { Card } from '@/types/card'
import { VALIDATION_LIMITS } from '@/constants/validation'

export class CardService {
  static generateId(): number {
    return Date.now() + Math.floor(Math.random() * 1000)
  }

  static createNewCard(): Card {
    return {
      id: this.generateId(),
      front: {
        text: '',
        imageUrl: null,
        layout: 'default'
      },
      back: {
        text: '',
        imageUrl: null,
        layout: 'default'
      },
      hint: null,
      setId: 0, // Temporary ID until saved
    }
  }

  static validateCards(cards: Card[]): { isValid: boolean; error?: string } {
    if (cards.length === 0) {
      return { isValid: false, error: 'At least one card is required.' }
    }

    const hasBlankCard = cards.some(card => {
      const frontHasContent = card.front.text || card.front.imageUrl
      const backHasContent = card.back.text || card.back.imageUrl
      return !frontHasContent || !backHasContent
    })

    if (hasBlankCard) {
      return { isValid: false, error: 'All cards must have either text or an image on both front and back.' }
    }

    const hasLongContent = cards.some(card => 
      (card.front.text && card.front.text.length > VALIDATION_LIMITS.CARD.MAX_CHARS) || 
      (card.back.text && card.back.text.length > VALIDATION_LIMITS.CARD.MAX_CHARS) ||
      (card.hint && card.hint.length > VALIDATION_LIMITS.CARD.MAX_CHARS)
    )
    if (hasLongContent) {
      return { isValid: false, error: `Card content cannot exceed ${VALIDATION_LIMITS.CARD.MAX_CHARS} characters.` }
    }

    return { isValid: true }
  }

  static updateCard(cards: Card[], updatedCard: Card): Card[] {
    return cards.map(card => card.id === updatedCard.id ? { ...updatedCard } : card)
  }

  static deleteCard(cards: Card[], id: number): Card[] {
    return cards.filter(card => card.id !== id)
  }

  static reorderCards(_cards: Card[], newOrder: Card[]): Card[] {
    return newOrder
  }
} 