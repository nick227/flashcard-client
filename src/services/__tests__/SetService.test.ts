import { describe, it, expect } from 'vitest'
import { SetService } from '../SetService'
import type { Set } from '@/types/set'

describe('SetService', () => {
  describe('createEmptySet', () => {
    it('creates a set with default values', () => {
      const set = SetService.createEmptySet()

      expect(set).toMatchObject({
        title: '',
        description: '',
        category: '',
        type: 'free',
        views: 0,
        likes: 0,
        cardsCount: 0,
        tags: [],
        isPublic: false,
        hidden: false,
        cards: [],
        isArchived: false
      })
      expect(set.id).toBeDefined()
      expect(set.createdAt).toBeDefined()
      expect(set.updatedAt).toBeDefined()
    })

    it('generates valid IDs', () => {
      const set = SetService.createEmptySet()

      expect(set.id).toBeDefined()
      expect(typeof set.id).toBe('number')
      expect(set.id).toBeGreaterThan(0)
    })
  })

  describe('validateSet', () => {
    const createValidSet = (): Set => ({
      ...SetService.createEmptySet(),
      title: 'Valid Title',
      description: 'Valid Description',
      cards: [{ id: 1 } as any]
    })

    it('validates a complete set', () => {
      const set = createValidSet()
      const result = SetService.validateSet(set)

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('rejects set without title', () => {
      const set = createValidSet()
      set.title = ''

      const result = SetService.validateSet(set)

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Title is required.')
    })

    it('rejects set with whitespace-only title', () => {
      const set = createValidSet()
      set.title = '   '

      const result = SetService.validateSet(set)

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Title is required.')
    })

    it('rejects set with title exceeding max length', () => {
      const set = createValidSet()
      set.title = 'a'.repeat(2001) // Exceeds 2000 char limit

      const result = SetService.validateSet(set)

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('cannot exceed')
    })

    it('rejects set with description exceeding max length', () => {
      const set = createValidSet()
      set.description = 'a'.repeat(2001) // Exceeds 2000 char limit

      const result = SetService.validateSet(set)

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Description cannot exceed')
    })

    it('rejects set without cards', () => {
      const set = createValidSet()
      set.cards = []

      const result = SetService.validateSet(set)

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('At least one card is required.')
    })

    it('accepts set with valid description length', () => {
      const set = createValidSet()
      set.description = 'a'.repeat(499)

      const result = SetService.validateSet(set)

      expect(result.isValid).toBe(true)
    })
  })

  describe('updateLocalSet', () => {
    it('updates the correct set', () => {
      const sets = [
        { id: 1, title: 'Set 1' } as Set,
        { id: 2, title: 'Set 2' } as Set,
        { id: 3, title: 'Set 3' } as Set
      ]

      const updatedSet = { ...sets[1], title: 'Updated Set 2' }
      const result = SetService.updateLocalSet(sets, updatedSet)

      expect(result[1].title).toBe('Updated Set 2')
      expect(result[0].title).toBe('Set 1')
      expect(result[2].title).toBe('Set 3')
    })

    it('returns new array without mutating original', () => {
      const sets = [
        { id: 1, title: 'Set 1' } as Set,
        { id: 2, title: 'Set 2' } as Set
      ]

      const updatedSet = { ...sets[0], title: 'Updated' }
      const result = SetService.updateLocalSet(sets, updatedSet)

      expect(result).not.toBe(sets)
      expect(sets[0].title).toBe('Set 1')
    })
  })

  describe('deleteLocalSet', () => {
    it('removes the correct set', () => {
      const sets = [
        { id: 1, title: 'Set 1' } as Set,
        { id: 2, title: 'Set 2' } as Set,
        { id: 3, title: 'Set 3' } as Set
      ]

      const result = SetService.deleteLocalSet(sets, 2)

      expect(result).toHaveLength(2)
      expect(result.find(s => s.id === 2)).toBeUndefined()
      expect(result.find(s => s.id === 1)).toBeDefined()
      expect(result.find(s => s.id === 3)).toBeDefined()
    })

    it('returns all sets if ID not found', () => {
      const sets = [
        { id: 1, title: 'Set 1' } as Set,
        { id: 2, title: 'Set 2' } as Set
      ]

      const result = SetService.deleteLocalSet(sets, 999)

      expect(result).toHaveLength(2)
    })
  })

  describe('transformCard', () => {
    it('transforms backend card format to frontend format', () => {
      const backendCard = {
        id: '123',
        title: 'Card Title',
        front: { text: 'Front text', imageUrl: 'front.jpg', layout: 'image' },
        back: { text: 'Back text', imageUrl: 'back.jpg', layout: 'text' },
        hint: 'Hint text',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
        reviewCount: 5,
        difficulty: 3
      }

      const result = SetService.transformCard(backendCard)

      expect(result).toMatchObject({
        id: 123,
        title: 'Card Title',
        front: {
          content: 'Front text',
          mediaUrl: 'front.jpg',
          layout: 'image'
        },
        back: {
          content: 'Back text',
          mediaUrl: 'back.jpg',
          layout: 'text'
        },
        hint: 'Hint text',
        reviewCount: 5,
        difficulty: 3
      })
      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.updatedAt).toBeInstanceOf(Date)
    })

    it('handles missing optional fields', () => {
      const backendCard = {
        id: 456,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      }

      const result = SetService.transformCard(backendCard)

      expect(result.title).toBe('')
      expect(result.front.content).toBe('')
      expect(result.front.mediaUrl).toBe('')
      expect(result.front.layout).toBe('default')
      expect(result.back.layout).toBe('default')
      expect(result.hint).toBeNull()
    })

    it('generates ID when not provided', () => {
      const backendCard = {
        id: undefined,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      }

      const result = SetService.transformCard(backendCard as any)

      expect(result.id).toBeDefined()
      expect(typeof result.id).toBe('number')
    })
  })

  describe('createEmptySetCreate', () => {
    it('creates empty SetCreate object', () => {
      const result = SetService.createEmptySetCreate()

      expect(result).toEqual({
        title: '',
        description: '',
        categoryId: 0,
        tags: [],
        isPublic: false,
        isArchived: false,
        price: '0',
        isSubscriberOnly: false,
        cards: []
      })
    })
  })

  describe('createEmptySetUpdate', () => {
    it('creates empty SetUpdate object', () => {
      const result = SetService.createEmptySetUpdate()

      expect(result).toEqual({
        id: 0,
        title: '',
        description: '',
        categoryId: 0,
        tags: [],
        isPublic: false,
        isArchived: false,
        price: '0',
        isSubscriberOnly: false,
        cards: []
      })
    })
  })
})

