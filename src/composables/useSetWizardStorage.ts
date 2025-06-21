import { ref } from 'vue'
import type { Card } from '@/types/card'
import type { SetPrice } from '@/types'

const SET_WIZARD_PROGRESS_KEY = 'setWizardProgress'

export interface SavedProgress {
  title: string
  description: string
  categoryId: number
  tags: string[]
  price: SetPrice
  thumbnail: string | null
  thumbnailFile?: {
    data: string  // Base64 data
    type: string  // MIME type
    name: string  // File name
  } | null
  cards: Card[]
  cardImageFiles?: {
    [key: string]: {
      data: string  // Base64 data
      type: string  // MIME type
      name: string  // File name
    }
  }
  submitted?: boolean  // Track if this progress was successfully submitted
}

export function useSetWizardStorage() {
  const savedProgress = ref<SavedProgress | null>(null)

  function saveProgress(progress: SavedProgress) {
    try {
      // Ensure cards have all required properties
      const processedProgress = {
        ...progress,
        submitted: false, // Mark as work-in-progress
        cards: progress.cards.map(card => ({
          ...card,
          front: {
            ...card.front,
            text: card.front.text || '',
            imageUrl: card.front.imageUrl || null,
            layout: card.front.layout || 'two-row'
          },
          back: {
            ...card.back,
            text: card.back.text || '',
            imageUrl: card.back.imageUrl || null,
            layout: card.back.layout || 'two-row'
          }
        }))
      }
      localStorage.setItem(SET_WIZARD_PROGRESS_KEY, JSON.stringify(processedProgress))
      savedProgress.value = processedProgress
    } catch (error) {
      console.error('useSetWizardStorage - Error saving progress:', error)
    }
  }

  function markAsSubmitted() {
    try {
      const stored = localStorage.getItem(SET_WIZARD_PROGRESS_KEY)
      if (stored) {
        const progress = JSON.parse(stored) as SavedProgress
        progress.submitted = true
        localStorage.setItem(SET_WIZARD_PROGRESS_KEY, JSON.stringify(progress))
        savedProgress.value = progress
      }
    } catch (error) {
      console.error('useSetWizardStorage - Error marking progress as submitted:', error)
    }
  }

  function hasUnsubmittedProgress(): boolean {
    try {
      const stored = localStorage.getItem(SET_WIZARD_PROGRESS_KEY)
      if (stored) {
        const progress = JSON.parse(stored) as SavedProgress
        return !progress.submitted && (
          !!progress.title || 
          !!progress.description || 
          progress.cards.length > 0 ||
          !!progress.thumbnail
        )
      }
      return false
    } catch (error) {
      console.error('useSetWizardStorage - Error checking unsubmitted progress:', error)
      return false
    }
  }

  function loadProgress(): SavedProgress | null {
    const stored = localStorage.getItem(SET_WIZARD_PROGRESS_KEY)
    if (stored) {
      try {
        const progress = JSON.parse(stored) as SavedProgress
        savedProgress.value = progress
        return progress
      } catch (error) {
        console.error('useSetWizardStorage - Error loading saved progress:', error)
        return null
      }
    }
    return null
  }

  function clearProgress() {
    localStorage.removeItem(SET_WIZARD_PROGRESS_KEY)
    savedProgress.value = null
  }

  return {
    savedProgress,
    saveProgress,
    loadProgress,
    clearProgress,
    markAsSubmitted,
    hasUnsubmittedProgress
  }
} 