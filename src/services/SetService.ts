import type { Card, CardLayout } from '@/types/card'
import type { Set, SetCreate, SetUpdate } from '@/types/set'
import { VALIDATION_LIMITS } from '@/constants/validation'
import { api } from '@/api'

export class SetService {
  static createEmptySet(): Set {
    return {
      id: this.generateId(),
      title: '',
      description: '',
      category: '',
      type: 'free',
      userId: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0,
      likes: 0,
      cardsCount: 0,
      tags: [],
      isPublic: false,
      price: {
        type: 'free'
      },
      educatorId: 0,
      educatorName: '',
      thumbnail: '',
      hidden: false,
      cards: [],
      isArchived: false
    }
  }

  private static generateId(): number {
    return Date.now()
  }

  static validateSet(set: Set): { isValid: boolean; error?: string } {
    if (!set.title.trim()) {
      return { isValid: false, error: 'Title is required.' }
    }

    if (set.title.length > VALIDATION_LIMITS.CARD.MAX_CHARS) {
      return { isValid: false, error: `Title cannot exceed ${VALIDATION_LIMITS.CARD.MAX_CHARS} characters.` }
    }

    if (set.description && set.description.length > VALIDATION_LIMITS.CARD.MAX_CHARS) {
      return { isValid: false, error: `Description cannot exceed ${VALIDATION_LIMITS.CARD.MAX_CHARS} characters.` }
    }

    if (set.cards.length === 0) {
      return { isValid: false, error: 'At least one card is required.' }
    }

    return { isValid: true }
  }

  static updateLocalSet(sets: Set[], updatedSet: Set): Set[] {
    return sets.map(set => set.id === updatedSet.id ? updatedSet : set)
  }

  static deleteLocalSet(sets: Set[], id: number): Set[] {
    return sets.filter(set => set.id !== id)
  }

  static createEmptySetCreate(): SetCreate {
    return {
      title: '',
      description: '',
      categoryId: 0,
      tags: [],
      isPublic: false,
      isArchived: false,
      price: '0',
      isSubscriberOnly: false,
      cards: []
    }
  }

  static createEmptySetUpdate(): SetUpdate {
    return {
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
    }
  }

  static async fetchSet(setId: number): Promise<Set> {
    const response = await api.get(`/sets/${setId}`)
    return response.data
  }

  static async fetchSetCards(setId: number): Promise<Card[]> {
    const response = await api.get(`/sets/${setId}/cards`)
    const cardsData = response.data.cards || [];
    return cardsData.map((card: any) => this.transformCard(card))
  }

  // Helper method to transform backend card format to frontend Card type
  static transformCard(card: {
    id: string | number;
    title?: string;
    description?: string;
    front?: { text?: string; imageUrl?: string; layout?: string };
    back?: { text?: string; imageUrl?: string; layout?: string };
    hint?: string | null;
    createdAt: string | Date;
    updatedAt: string | Date;
    reviewCount?: number;
    difficulty?: number;
    userId?: string;
    deckId?: string;
    isArchived?: boolean;
    isPublic?: boolean;
  }): Card {
    // Preserve existing card ID if it exists, otherwise generate a new one
    const cardId = card.id ? Number(card.id) : this.generateId();
    
    return {
      id: cardId,
      title: card.title || '',
      description: card.description || '',
      front: {
        layout: (card.front?.layout || 'default') as CardLayout,
        content: card.front?.text || '',
        mediaUrl: card.front?.imageUrl || '',
      },
      back: {
        layout: (card.back?.layout || 'default') as CardLayout,
        content: card.back?.text || '',
        mediaUrl: card.back?.imageUrl || '',
      },
      hint: card.hint || null,
      createdAt: new Date(card.createdAt),
      updatedAt: new Date(card.updatedAt),
      reviewCount: card.reviewCount || 0,
      difficulty: card.difficulty || 0,
      userId: card.userId || '',
      deckId: card.deckId || '',
      isArchived: card.isArchived || false,
      isPublic: card.isPublic || false
    }
  }

  static async createSet(formData: FormData): Promise<any> {
    const response = await api.post('/sets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  }

  static async updateSet(id: number, formData: FormData): Promise<any> {
    const response = await api.patch(`/sets/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  }

  static async deleteSet(setId: number): Promise<void> {
    await api.delete(`/sets/${setId}`)
  }
} 