import type { Card, CardSideContent, ContentCell, CardLayout } from '@/types/card'
import { createTextCell, createMediaCell, createEmptyCell, validateCell } from '@/utils/cellUtils'

const DEFAULT_LAYOUT: CardLayout = 'default'

export function migrateToNewFormat(oldCard: any): Card {
  // Create default cells based on old format
  const frontCells: ContentCell[] = []
  const backCells: ContentCell[] = []

  // Handle front content
  if (oldCard.text_front) {
    frontCells.push(createTextCell(oldCard.text_front))
  }
  if (oldCard.image_url_front) {
    frontCells.push(createMediaCell(oldCard.image_url_front))
  }

  // Handle back content
  if (oldCard.text_back) {
    backCells.push(createTextCell(oldCard.text_back))
  }
  if (oldCard.image_url_back) {
    backCells.push(createMediaCell(oldCard.image_url_back))
  }

  // Ensure at least one cell exists for each side
  if (frontCells.length === 0) {
    frontCells.push(createEmptyCell())
  }
  if (backCells.length === 0) {
    backCells.push(createEmptyCell())
  }

  // Create the new card structure
  return {
    id: oldCard.id || '',
    title: oldCard.title || '',
    front: {
      layout: oldCard.layout_front || DEFAULT_LAYOUT,
      cells: frontCells
    },
    back: {
      layout: oldCard.layout_back || DEFAULT_LAYOUT,
      cells: backCells
    },
    hint: oldCard.hint || '',
    createdAt: oldCard.createdAt || new Date().toISOString(),
    updatedAt: oldCard.updatedAt || new Date().toISOString(),
    reviewCount: oldCard.reviewCount || 0,
    difficulty: oldCard.difficulty || 0,
    userId: oldCard.userId || '',
    deckId: oldCard.deckId || ''
  }
}

export function validateCard(card: Card): boolean {
  // Basic validation
  if (!card.id || !card.title || !card.deckId || !card.userId) {
    return false
  }

  // Validate front and back content
  if (!validateCardSide(card.front) || !validateCardSide(card.back)) {
    return false
  }

  return true
}

function validateCardSide(side: CardSideContent): boolean {
  if (!side.layout || !Array.isArray(side.cells)) {
    return false
  }

  // Validate each cell
  return side.cells.every(validateCell)
} 