import { apiEndpoints, api } from '@/api'
import type { AxiosError } from 'axios'
import type { Card } from '@/types/card'
import type { SetPrice } from '@/types'

// Split into separate interfaces for better organization
export interface ViewHistory {
    id: number
    userId: number
    setId: number
    numCardsViewed: number
    completed: boolean
    completedAt: string | null
    startedAt: string
    setTitle?: string
    setThumbnail?: string
    Set?: {
        id: number
        title: string
    }
}

export interface HistoryState {
  cards: Card[]
  title: string
  description: string
  categoryId: number | null
  tags: string[]
  price: SetPrice
  thumbnail: string | null
  lastUpdated: number
}

// Constants
const STORAGE_KEY = 'set_wizard_history'
const MAX_STACK_SIZE = 50
const MAX_STORAGE_SIZE = 5 * 1024 * 1024 // 5MB limit for localStorage

// Error types
export class HistoryError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message)
    this.name = 'HistoryError'
  }
}

export class StorageError extends HistoryError {
  constructor(message: string, cause?: unknown) {
    super(message, cause)
    this.name = 'StorageError'
  }
}

// Separate service for viewing history
export class ViewHistoryService {
  async startViewing(setId: number): Promise<ViewHistory> {
    try {
      const response = await api.post(apiEndpoints.history.base, { 
        set_id: setId,
        num_cards_viewed: 0,
        completed: false
      })
      return response.data
    } catch (error) {
      throw new HistoryError('Failed to start viewing history', error)
    }
  }

  async updateProgress(historyId: number, data: { 
    numCardsViewed?: number
    completed?: boolean 
  }): Promise<ViewHistory> {
    try {
      const updateData = {
        num_cards_viewed: data.numCardsViewed,
        completed: data.completed
      }
      const response = await api.patch(`${apiEndpoints.history}/${historyId}`, updateData)
      return response.data
    } catch (error) {
      throw new HistoryError('Failed to update viewing progress', error)
    }
  }

  async getHistoryBySetId(setId: number): Promise<ViewHistory | null> {
    try {
      const response = await api.get(`${apiEndpoints.history}/${setId}`)
      return response.data
    } catch (error) {
      const axiosError = error as AxiosError
      if (axiosError.response?.status === 404) {
        return null
      }
      throw new HistoryError('Failed to fetch viewing history', error)
    }
  }
}

// Main history service for undo/redo
export class HistoryService {
  private undoStack: HistoryState[] = []
  private redoStack: HistoryState[] = []
  private isUndoRedoInProgress = false

  constructor() {
    this.loadFromStorage()
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) return

      const parsed = JSON.parse(data)
      if (!this.isValidStorageData(parsed)) {
        throw new StorageError('Invalid storage data structure')
      }

      this.undoStack = parsed.undoStack
      this.redoStack = parsed.redoStack
    } catch (error) {
      console.error('Error loading history from storage:', error)
      this.clearHistory()
      throw new StorageError('Failed to load history from storage', error)
    }
  }

  private saveToStorage(): void {
    try {
      const data = JSON.stringify({
        undoStack: this.undoStack,
        redoStack: this.redoStack
      })

      // Check if data would exceed storage limit
      if (data.length > MAX_STORAGE_SIZE) {
        this.reduceStorageSize()
      }

      localStorage.setItem(STORAGE_KEY, data)
    } catch (error) {
      console.error('Error saving history to storage:', error)
      throw new StorageError('Failed to save history to storage', error)
    }
  }

  private reduceStorageSize(): void {
    // Remove oldest states until we're under the limit
    while (this.undoStack.length > 1) {
      this.undoStack.shift()
      const data = JSON.stringify({
        undoStack: this.undoStack,
        redoStack: this.redoStack
      })
      if (data.length <= MAX_STORAGE_SIZE) break
    }
  }

  private isValidStorageData(data: unknown): data is { undoStack: HistoryState[], redoStack: HistoryState[] } {
    return (
      typeof data === 'object' &&
      data !== null &&
      'undoStack' in data &&
      'redoStack' in data &&
      Array.isArray((data as any).undoStack) &&
      Array.isArray((data as any).redoStack)
    )
  }

  takeSnapshot(state: Omit<HistoryState, 'lastUpdated'>): void {
    if (this.isUndoRedoInProgress) return

    const snapshot: HistoryState = {
      ...state,
      lastUpdated: Date.now()
    }

    // Deep clone to prevent reference issues
    this.undoStack.push(JSON.parse(JSON.stringify(snapshot)))
    this.redoStack = [] // Clear redo stack on new action

    if (this.undoStack.length > MAX_STACK_SIZE) {
      this.undoStack.shift() // Remove oldest
    }

    this.saveToStorage()
  }

  undo(): HistoryState | null {
    if (!this.canUndo()) return null

    this.isUndoRedoInProgress = true
    try {
      const current = this.undoStack.pop()
      if (current) {
        this.redoStack.push(current)
      }

      const previousState = this.undoStack[this.undoStack.length - 1]
      if (previousState) {
        this.saveToStorage()
      }
      return previousState || null
    } finally {
      this.isUndoRedoInProgress = false
    }
  }

  redo(): HistoryState | null {
    if (this.redoStack.length === 0) return null
    const state = this.redoStack.pop()
    if (state) {
      this.undoStack.push(state)
    }
    return state || null
  }

  clearHistory(): void {
    this.undoStack = []
    this.redoStack = []
    this.saveToStorage()
  }

  canUndo(): boolean {
    return this.undoStack.length > 1 // Keep at least initial state
  }

  canRedo(): boolean {
    return this.redoStack.length > 0
  }

  getStackSizes(): { undo: number, redo: number } {
    return {
      undo: this.undoStack.length,
      redo: this.redoStack.length
    }
  }
}

// Export singleton instances
export const viewHistoryService = new ViewHistoryService()
export const historyService = new HistoryService() 