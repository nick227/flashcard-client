import type { Card, CardLayout } from '@/types/card'
import { VALIDATION_LIMITS } from '@/constants/validation'
import { migrateToNewFormat } from '@/utils/cardMigration'
import { createEmptyCell, cellHasContent } from '@/utils/cellUtils'

const DEFAULT_LAYOUT: CardLayout = 'default'

const createEmptyCardSide = () => ({
  layout: DEFAULT_LAYOUT,
  cells: [createEmptyCell()]
})

export class CardService {
  static createEmptyCard(deckId: string, userId?: string): Card {
    return {
      id: this.generateId(),
      title: '',
      front: createEmptyCardSide(),
      back: createEmptyCardSide(),
      hint: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reviewCount: 0,
      difficulty: 0,
      userId: userId || '',
      deckId
    }
  }

  private static generateId(): number {
    return Date.now()
  }

  static validateCards(cards: Card[]): { isValid: boolean; error?: string } {
    if (cards.length === 0) {
      return { isValid: false, error: 'At least one card is required.' }
    }

    const hasBlankCard = cards.some(card => {
      // Check front content
      const frontHasContent = card.front.cells?.some(cellHasContent) || false

      // Check back content
      const backHasContent = card.back.cells?.some(cellHasContent) || false

      return !frontHasContent || !backHasContent
    })

    if (hasBlankCard) {
      return { isValid: false, error: 'All cards must have content in both front and back.' }
    }

    const hasLongContent = cards.some(card => 
      card.front.cells?.some(cell => cell.content && cell.content.length > VALIDATION_LIMITS.CARD.MAX_CHARS) || 
      card.back.cells?.some(cell => cell.content && cell.content.length > VALIDATION_LIMITS.CARD.MAX_CHARS) ||
      (card.hint && card.hint.length > VALIDATION_LIMITS.CARD.MAX_CHARS) || false
    )
    if (hasLongContent) {
      return { isValid: false, error: `Card content cannot exceed ${VALIDATION_LIMITS.CARD.MAX_CHARS} characters.` }
    }

    return { isValid: true }
  }

  static updateCard(cards: Card[], updatedCard: Card): Card[] {
    return cards.map(card => card.id === updatedCard.id ? updatedCard : card)
  }

  static deleteCard(cards: Card[], id: number): Card[] {
    return cards.filter(card => card.id !== id)
  }

  static reorderCards(newOrder: Card[]): Card[] {
    return newOrder
  }

  static migrateCard(oldCard: any): Card {
    return migrateToNewFormat(oldCard)
  }
} 