import { describe, it, expect, beforeEach } from 'vitest'
import { ref, type Ref } from 'vue'
import { useCardNavigation } from '../useCardNavigation'
import type { Card } from '@/types/card'

describe('useCardNavigation', () => {
  const mockCards: Card[] = [
    { 
      id: 1, 
      title: 'Card 1',
      front: { content: 'Q1', mediaUrl: null, layout: 'default' }, 
      back: { content: 'A1', mediaUrl: null, layout: 'default' },
      hint: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reviewCount: 0,
      difficulty: 0,
      userId: '1',
      deckId: '1'
    },
    { 
      id: 2, 
      title: 'Card 2',
      front: { content: 'Q2', mediaUrl: null, layout: 'default' }, 
      back: { content: 'A2', mediaUrl: null, layout: 'default' },
      hint: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reviewCount: 0,
      difficulty: 0,
      userId: '1',
      deckId: '1'
    },
    { 
      id: 3, 
      title: 'Card 3',
      front: { content: 'Q3', mediaUrl: null, layout: 'default' }, 
      back: { content: 'A3', mediaUrl: null, layout: 'default' },
      hint: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reviewCount: 0,
      difficulty: 0,
      userId: '1',
      deckId: '1'
    }
  ]

  let cards: Ref<Card[]>

  beforeEach(() => {
    cards = ref(mockCards)
  })

  it('initializes with first card and front side', () => {
    const { currentIndex, flipped } = useCardNavigation(cards)

    expect(currentIndex.value).toBe(0)
    expect(flipped.value).toBe(false)
  })

  it('flips card when handleCardFlip is called', () => {
    const { flipped, handleCardFlip } = useCardNavigation(cards)

    expect(flipped.value).toBe(false)
    handleCardFlip()
    expect(flipped.value).toBe(true)
    handleCardFlip()
    expect(flipped.value).toBe(false)
  })

  it('forces flip state when forceFlip parameter is provided', () => {
    const { flipped, handleCardFlip } = useCardNavigation(cards)

    handleCardFlip(true)
    expect(flipped.value).toBe(true)
    handleCardFlip(true)
    expect(flipped.value).toBe(true)
    handleCardFlip(false)
    expect(flipped.value).toBe(false)
  })

  it('increments currentFlip counter on each flip', () => {
    const { currentFlip, handleCardFlip } = useCardNavigation(cards)

    expect(currentFlip.value).toBe(0)
    handleCardFlip()
    expect(currentFlip.value).toBe(1)
    handleCardFlip()
    expect(currentFlip.value).toBe(2)
  })

  it('flips card to back on first nextCard call', () => {
    const { flipped, currentIndex, nextCard } = useCardNavigation(cards)

    expect(flipped.value).toBe(false)
    nextCard()
    expect(flipped.value).toBe(true)
    expect(currentIndex.value).toBe(0)
  })

  it('advances to next card on second nextCard call', () => {
    const { currentIndex, flipped, nextCard } = useCardNavigation(cards)

    nextCard() // Flip to back
    expect(currentIndex.value).toBe(0)
    expect(flipped.value).toBe(true)

    nextCard() // Move to next card
    expect(currentIndex.value).toBe(1)
    expect(flipped.value).toBe(false)
  })

  it('does nothing when nextCard is called on last card back', () => {
    const { currentIndex, flipped, nextCard } = useCardNavigation(cards)

    currentIndex.value = 2
    flipped.value = true

    nextCard()
    expect(currentIndex.value).toBe(2)
    expect(flipped.value).toBe(true)
  })

  it('flips to front when prevCard is called on back', () => {
    const { currentIndex, flipped, nextCard, prevCard } = useCardNavigation(cards)

    nextCard() // Flip to back
    expect(flipped.value).toBe(true)

    prevCard()
    expect(flipped.value).toBe(false)
    expect(currentIndex.value).toBe(0)
  })

  it('goes to previous card back when prevCard is called on front', () => {
    const { currentIndex, flipped, nextCard, prevCard } = useCardNavigation(cards)

    nextCard() // Flip
    nextCard() // Move to card 2
    expect(currentIndex.value).toBe(1)
    expect(flipped.value).toBe(false)

    prevCard()
    expect(currentIndex.value).toBe(0)
    expect(flipped.value).toBe(true)
  })

  it('does nothing when prevCard is called on first card front', () => {
    const { currentIndex, flipped, prevCard } = useCardNavigation(cards)

    prevCard()
    expect(currentIndex.value).toBe(0)
    expect(flipped.value).toBe(false)
  })

  it('isPrevDisabled returns true only on first card front', () => {
    const { isPrevDisabled, nextCard } = useCardNavigation(cards)

    expect(isPrevDisabled.value).toBe(true)

    nextCard() // Flip to back
    expect(isPrevDisabled.value).toBe(false)

    nextCard() // Next card
    expect(isPrevDisabled.value).toBe(false)
  })

  it('resets navigation to initial state', () => {
    const { currentIndex, flipped, currentFlip, nextCard, handleCardFlip, resetNavigation } = useCardNavigation(cards)

    nextCard()
    nextCard()
    handleCardFlip()
    expect(currentIndex.value).toBe(1)
    expect(currentFlip.value).toBeGreaterThan(0)

    resetNavigation()
    expect(currentIndex.value).toBe(0)
    expect(flipped.value).toBe(false)
    expect(currentFlip.value).toBe(0)
  })

  it('handles navigation through all cards', () => {
    const { currentIndex, flipped, nextCard } = useCardNavigation(cards)

    // Card 1 front -> back
    expect(currentIndex.value).toBe(0)
    expect(flipped.value).toBe(false)
    nextCard()
    expect(flipped.value).toBe(true)

    // Card 1 back -> Card 2 front
    nextCard()
    expect(currentIndex.value).toBe(1)
    expect(flipped.value).toBe(false)

    // Card 2 front -> back
    nextCard()
    expect(flipped.value).toBe(true)

    // Card 2 back -> Card 3 front
    nextCard()
    expect(currentIndex.value).toBe(2)
    expect(flipped.value).toBe(false)

    // Card 3 front -> back
    nextCard()
    expect(flipped.value).toBe(true)

    // Can't go further
    nextCard()
    expect(currentIndex.value).toBe(2)
    expect(flipped.value).toBe(true)
  })
})

