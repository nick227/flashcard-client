import type { FlashCard } from '@/types'
import { VALIDATION_LIMITS } from '@/constants/validation'

export class CardService {
  static generateId(): number {
    return Date.now() + Math.floor(Math.random() * 1000)
  }

  static createNewCard(): FlashCard {
    return {
      id: this.generateId(),
      front: '',
      back: '',
      setId: 0 // Temporary ID until saved
    }
  }

  static validateCards(cards: FlashCard[]): { isValid: boolean; error?: string } {
    if (cards.length === 0) {
      return { isValid: false, error: 'At least one card is required.' }
    }

    const hasBlankCard = cards.some(card => !card.front.trim() || !card.back.trim())
    if (hasBlankCard) {
      return { isValid: false, error: 'All cards must have both front and back.' }
    }

    const hasLongContent = cards.some(card => 
      card.front.length > VALIDATION_LIMITS.CARD.MAX_CHARS || 
      card.back.length > VALIDATION_LIMITS.CARD.MAX_CHARS ||
      (card.hint && card.hint.length > VALIDATION_LIMITS.CARD.MAX_CHARS)
    )
    if (hasLongContent) {
      return { isValid: false, error: `Card content cannot exceed ${VALIDATION_LIMITS.CARD.MAX_CHARS} characters.` }
    }

    return { isValid: true }
  }

  static updateCard(cards: FlashCard[], updatedCard: FlashCard): FlashCard[] {
    return cards.map(card => card.id === updatedCard.id ? { ...updatedCard } : card)
  }

  static deleteCard(cards: FlashCard[], id: number): FlashCard[] {
    return cards.filter(card => card.id !== id)
  }

  static reorderCards(_cards: FlashCard[], newOrder: FlashCard[]): FlashCard[] {
    return newOrder
  }
} 