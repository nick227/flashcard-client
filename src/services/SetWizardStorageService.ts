import type { Card } from '@/types/card'
import type { SetPrice } from '@/types'

interface SetWizardState {
  title: string
  description: string
  categoryId: number | null
  tags: string[]
  price: SetPrice
  thumbnail: string | null
  cards: Card[]
  lastUpdated: number
}

const STORAGE_KEY = 'set_wizard_progress'
const MAX_STORAGE_AGE = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

export class SetWizardStorageService {
  static saveProgress(state: Omit<SetWizardState, 'lastUpdated'>) {
    // Validate input before saving
    if (!this.isValidInputState(state)) {
      console.error('Invalid state provided to saveProgress')
      return
    }

    const data: SetWizardState = {
      ...state,
      lastUpdated: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  static loadProgress(): SetWizardState | null {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return null

    try {
      const parsed = JSON.parse(data) as SetWizardState
      
      // Check if the data is too old
      if (Date.now() - parsed.lastUpdated > MAX_STORAGE_AGE) {
        console.log('Stored progress is too old, clearing...')
        this.clearProgress()
        return null
      }

      // Validate the data structure
      if (!this.isValidState(parsed)) {
        console.error('Invalid state structure in localStorage')
        this.clearProgress()
        return null
      }

      // Validate card structure
      if (!this.areCardsValid(parsed.cards)) {
        console.error('Invalid card structure in stored data')
        this.clearProgress()
        return null
      }

      return parsed
    } catch (e) {
      console.error('Error parsing set wizard progress:', e)
      this.clearProgress()
      return null
    }
  }

  static clearProgress() {
    localStorage.removeItem(STORAGE_KEY)
  }

  private static isValidInputState(state: Omit<SetWizardState, 'lastUpdated'>): boolean {
    return (
      typeof state === 'object' &&
      state !== null &&
      typeof state.title === 'string' &&
      state.title.length > 0 &&
      typeof state.description === 'string' &&
      state.description.length > 0 &&
      (typeof state.categoryId === 'number' || state.categoryId === null) &&
      Array.isArray(state.tags) &&
      state.tags.every(tag => typeof tag === 'string') &&
      this.isValidPrice(state.price) &&
      (typeof state.thumbnail === 'string' || state.thumbnail === null) &&
      Array.isArray(state.cards)
    )
  }

  private static isValidState(state: any): state is SetWizardState {
    return (
      this.isValidInputState(state) &&
      typeof state.lastUpdated === 'number' &&
      !isNaN(state.lastUpdated) &&
      state.lastUpdated > 0
    )
  }

  private static isValidPrice(price: any): price is SetPrice {
    return (
      typeof price === 'object' &&
      price !== null &&
      typeof price.type === 'string' &&
      ['free', 'premium', 'subscribers'].includes(price.type) &&
      typeof price.amount === 'number' &&
      !isNaN(price.amount) &&
      price.amount >= 0
    )
  }

  private static areCardsValid(cards: any[]): boolean {
    return Array.isArray(cards) && cards.every(card => 
      typeof card === 'object' &&
      card !== null &&
      typeof card.id === 'number' &&
      typeof card.setId === 'number' &&
      typeof card.front === 'object' &&
      card.front !== null &&
      typeof card.front.text === 'string' &&
      (typeof card.front.imageUrl === 'string' || card.front.imageUrl === null) &&
      typeof card.back === 'object' &&
      card.back !== null &&
      typeof card.back.text === 'string' &&
      (typeof card.back.imageUrl === 'string' || card.back.imageUrl === null) &&
      (typeof card.hint === 'string' || card.hint === null)
    )
  }
} 