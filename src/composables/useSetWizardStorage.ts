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

// --- Normalization helper ---
function normalizeCard(card: any): Card {
  return {
    ...card,
    front: {
      content: card.front?.content ?? '',
      mediaUrl: card.front?.mediaUrl ?? null,
      layout: card.front?.layout ?? 'default'
    },
    back: {
      content: card.back?.content ?? '',
      mediaUrl: card.back?.mediaUrl ?? null,
      layout: card.back?.layout ?? 'default'
    },
    hint: card.hint ?? null,
    front_image: card.front_image ?? null,
    back_image: card.back_image ?? null,
    layout_front: card.layout_front ?? undefined,
    layout_back: card.layout_back ?? undefined
  }
}

export function useSetWizardStorage() {
  const savedProgress = ref<SavedProgress | null>(null)

  function saveProgress(progress: SavedProgress) {
    try {
      // Ensure cards have all required properties
      const processedProgress = {
        ...progress,
        submitted: false, // Mark as work-in-progress
        cards: progress.cards.map(normalizeCard)
      }
      // Log only the cards array for debugging
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
        // Normalize cards on load
        progress.cards = (progress.cards || []).map(normalizeCard)
        // Log only the cards array for debugging
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