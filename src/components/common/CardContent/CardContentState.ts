import { ref, watch } from 'vue'
import type { Card, CardSide, CardLayout, ContentCell } from '@/types/card'
import { createEmptyCell, normalizeCellsForLayout, getLayoutCellCount } from '@/utils/cellUtils'

export function useCardContentState(props: { card: Card; side: CardSide }) {
  const cardState = ref<Card>(JSON.parse(JSON.stringify(props.card)))
  const currentSide = ref<CardSide>(props.side)

  // Ensure valid layout and cell count on initialization
  const initializeCardState = (card: Card) => {
    const newCard = JSON.parse(JSON.stringify(card))
    ;(['front', 'back'] as CardSide[]).forEach(side => {
      const layout = newCard[side].layout || 'default'
      const cells = newCard[side].cells || []
      const expectedCellCount = getLayoutCellCount(layout as CardLayout)
      
      if (cells.length !== expectedCellCount) {
        newCard[side].cells = normalizeCellsForLayout(cells, layout as CardLayout)
      }
    })
    return newCard
  }

  // Watch for card changes to update our local state
  watch(() => props.card, (newCard) => {
    cardState.value = initializeCardState(newCard)
  }, { deep: true })

  // Watch for side changes
  watch(() => props.side, (newSide) => {
    currentSide.value = newSide
  })

  const updateCard = (updatedCard: Card) => {
    cardState.value = initializeCardState(updatedCard)
  }

  const updateLayout = (side: CardSide, layout: CardLayout) => {
    const currentCells = cardState.value[side].cells || []
    const currentLayout = cardState.value[side].layout
    
    if (layout === currentLayout) {
      return
    }

    cardState.value[side].layout = layout
    
    // Normalize cells to match new layout
    cardState.value[side].cells = normalizeCellsForLayout(currentCells, layout)
  }

  const addCell = (side: CardSide, type: 'text' | 'media' = 'text', force: boolean = false) => {
    const cells = cardState.value[side].cells || []
    const layout = cardState.value[side].layout
    const maxCells = getLayoutCellCount(layout as CardLayout)
    
    if (!force && cells.length >= maxCells) {
      console.warn(`Cannot add more cells to ${layout} layout (max: ${maxCells})`)
      return
    }
    
    const newCell: ContentCell = type === 'text' 
      ? createEmptyCell()
      : { type: 'media', content: '', mediaUrl: null }
    
    const updatedCard = {
      ...cardState.value,
      [side]: {
        ...cardState.value[side],
        cells: [...cells, newCell]
      }
    }
    cardState.value = updatedCard
  }

  const updateCell = (side: CardSide, index: number, updates: Partial<ContentCell>) => {
    const cells = cardState.value[side].cells || []
    if (index < 0 || index >= cells.length) {
      console.warn(`Invalid cell index: ${index}`)
      return
    }
    
    const updatedCells = cells.map((cell, i) => 
      i === index ? { ...cell, ...updates } : cell
    )
    
    const updatedCard = {
      ...cardState.value,
      [side]: {
        ...cardState.value[side],
        cells: updatedCells
      }
    }
    cardState.value = updatedCard
  }

  const removeCell = (side: CardSide, index: number) => {
    const cells = cardState.value[side].cells || []
    const layout = cardState.value[side].layout
    const minCells = getLayoutCellCount(layout as CardLayout)
    
    if (cells.length <= minCells) {
      console.warn(`Cannot remove cell from ${layout} layout (minimum: ${minCells})`)
      return
    }
    
    const updatedCells = cells.filter((_, i) => i !== index)
    const updatedCard = {
      ...cardState.value,
      [side]: {
        ...cardState.value[side],
        cells: updatedCells
      }
    }
    cardState.value = updatedCard
  }

  const toggleSide = () => {
    currentSide.value = currentSide.value === 'front' ? 'back' : 'front'
  }

  return {
    cardState,
    currentSide,
    updateCard,
    updateLayout,
    addCell,
    updateCell,
    removeCell,
    toggleSide
  }
} 