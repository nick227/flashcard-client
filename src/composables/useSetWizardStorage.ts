import { ref } from 'vue'
import type { CardView } from '@/types/card'
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
  cards: CardView[]
}

export function useSetWizardStorage() {
  const savedProgress = ref<SavedProgress | null>(null)

  function saveProgress(progress: SavedProgress) {
    localStorage.setItem(SET_WIZARD_PROGRESS_KEY, JSON.stringify(progress))
    savedProgress.value = progress
  }

  function loadProgress(): SavedProgress | null {
    const stored = localStorage.getItem(SET_WIZARD_PROGRESS_KEY)
    if (stored) {
      try {
        const progress = JSON.parse(stored) as SavedProgress
        savedProgress.value = progress
        return progress
      } catch (error) {
        console.error('Error loading saved progress:', error)
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
    clearProgress
  }
} 