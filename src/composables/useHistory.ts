import { ref, computed } from 'vue'
import type { CardView } from '@/types/card'
import type { SetPrice } from '@/types'

const HISTORY_STORAGE_KEY = 'setWizardHistory'

export interface HistoryState {
  title: string
  description: string
  categoryId: number
  tags: string[]
  price: SetPrice
  cards: CardView[]
}

export function useHistory() {
  const history = ref<HistoryState[]>([])
  const currentIndex = ref(-1)

  const canUndo = computed(() => currentIndex.value > 0)
  const canRedo = computed(() => currentIndex.value < history.value.length - 1)

  function saveToStorage() {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify({
      history: history.value,
      currentIndex: currentIndex.value
    }))
  }

  function loadFromStorage() {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY)
    if (stored) {
      try {
        const { history: storedHistory, currentIndex: storedIndex } = JSON.parse(stored)
        history.value = storedHistory
        currentIndex.value = storedIndex
      } catch (error) {
        console.error('Error loading history from storage:', error)
        clearHistory()
      }
    }
  }

  function pushToHistory(state: HistoryState) {
    // Remove any future states if we're not at the end
    if (currentIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, currentIndex.value + 1)
    }

    // Add new state
    history.value.push(state)
    currentIndex.value = history.value.length - 1

    // Limit history size
    if (history.value.length > 50) {
      history.value = history.value.slice(-50)
      currentIndex.value = history.value.length - 1
    }

    // Save to storage
    saveToStorage()
  }

  function undo(): HistoryState | null {
    if (!canUndo.value) return null
    currentIndex.value--
    saveToStorage()
    return history.value[currentIndex.value]
  }

  function redo(): HistoryState | null {
    if (!canRedo.value) return null
    currentIndex.value++
    saveToStorage()
    return history.value[currentIndex.value]
  }

  function clearHistory() {
    history.value = []
    currentIndex.value = -1
    localStorage.removeItem(HISTORY_STORAGE_KEY)
  }

  // Load history from storage on initialization
  loadFromStorage()

  return {
    history,
    canUndo,
    canRedo,
    pushToHistory,
    undo,
    redo,
    clearHistory
  }
} 