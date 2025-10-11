import { ref, computed, watch, onUnmounted, type Ref } from 'vue'
import type { CardSideContent, CardLayout } from '@/types/card'

// ============================================================================
// Browser API Safety Guards
// ============================================================================

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined'

const safePerformance = {
  now: (): number => {
    if (isBrowser && typeof performance !== 'undefined') {
      return performance.now()
    }
    return Date.now()
  }
}

const safeRequestAnimationFrame = (callback: () => void): number => {
  if (isBrowser && typeof requestAnimationFrame !== 'undefined') {
    return requestAnimationFrame(callback)
  }
  return setTimeout(callback, 16) as unknown as number
}

const safeCancelAnimationFrame = (id: number): void => {
  if (isBrowser && typeof cancelAnimationFrame !== 'undefined') {
    cancelAnimationFrame(id)
  } else {
    clearTimeout(id as unknown as ReturnType<typeof setTimeout>)
  }
}

// ============================================================================
// Card Transformation Utilities
// ============================================================================

export interface RawCardInput {
  id?: string | number
  front?: Partial<CardSideContent> & { text?: string; imageUrl?: string }
  back?: Partial<CardSideContent> & { text?: string; imageUrl?: string }
  front_image?: string | null
  back_image?: string | null
  layout_front?: string
  layout_back?: string
  hint?: string | null
  title?: string
  description?: string
  createdAt?: string | Date
  updatedAt?: string | Date
}

export interface TransformedCard {
  id: string | number
  front: CardSideContent
  back: CardSideContent
  hint: string | null
}

export function transformCard(card: RawCardInput | null | undefined): TransformedCard | null {
  if (!card || card.id == null) return null
  
  const frontLayout = (card.front?.layout ?? card.layout_front ?? 'default') as CardLayout
  const backLayout = (card.back?.layout ?? card.layout_back ?? 'default') as CardLayout
  
  // Return clean shape - no field leakage
  return {
    id: card.id,
    hint: card.hint ?? null,
    front: {
      content: card.front?.content ?? card.front?.text ?? '',
      mediaUrl: card.front?.mediaUrl ?? card.front?.imageUrl ?? card.front_image ?? null,
      layout: frontLayout
    },
    back: {
      content: card.back?.content ?? card.back?.text ?? '',
      mediaUrl: card.back?.mediaUrl ?? card.back?.imageUrl ?? card.back_image ?? null,
      layout: backLayout
    }
  }
}

// ============================================================================
// Timer Progress Manager - SRP: Manages animation frame timer
// ============================================================================

class TimerProgressManager {
  private rafId: number | null = null
  private startTime = 0
  private pausedTime = 0
  private duration = 0
  private progressRef: Ref<number>
  private isPaused = false
  private visibilityListener: (() => void) | null = null

  constructor(progressRef: Ref<number>) {
    this.progressRef = progressRef
    this.setupVisibilityHandling()
  }

  private setupVisibilityHandling(): void {
    if (!isBrowser) return

    this.visibilityListener = () => {
      if (document.hidden && this.rafId !== null && !this.isPaused) {
        this.pause()
      } else if (!document.hidden && this.isPaused) {
        this.resume()
      }
    }

    document.addEventListener('visibilitychange', this.visibilityListener)
  }

  start(durationMs: number): void {
    this.stop()
    this.duration = Math.max(durationMs, 100)
    this.startTime = safePerformance.now()
    this.pausedTime = 0
    this.isPaused = false
    this.progressRef.value = 0
    this.animate()
  }

  private pause(): void {
    if (this.rafId !== null && !this.isPaused) {
      this.pausedTime = safePerformance.now() - this.startTime
      this.isPaused = true
      safeCancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  private resume(): void {
    if (this.isPaused) {
      this.startTime = safePerformance.now() - this.pausedTime
      this.isPaused = false
      this.animate()
    }
  }

  private animate = (): void => {
    if (this.isPaused) return

    const elapsed = safePerformance.now() - this.startTime
    this.progressRef.value = Math.min((elapsed / this.duration) * 100, 100)

    if (this.progressRef.value < 100) {
      this.rafId = safeRequestAnimationFrame(this.animate)
    } else {
      this.rafId = null
    }
  }

  stop(): void {
    if (this.rafId !== null) {
      safeCancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.progressRef.value = 0
    this.isPaused = false
    this.pausedTime = 0
  }

  cleanup(): void {
    this.stop()
    if (this.visibilityListener && isBrowser) {
      document.removeEventListener('visibilitychange', this.visibilityListener)
      this.visibilityListener = null
    }
  }

  isRunning(): boolean {
    return this.rafId !== null || this.isPaused
  }
}

// ============================================================================
// Card Cycle Manager - SRP: Manages card index and side cycling
// ============================================================================

class CardCycleManager {
  private cardIndex = 0
  private side: 'front' | 'back' = 'front'
  private totalCards: number

  constructor(totalCards: number) {
    this.totalCards = Math.max(totalCards, 0)
  }

  getCurrentIndex(): number {
    return this.cardIndex
  }

  getCurrentSide(): 'front' | 'back' {
    return this.side
  }

  reset(): void {
    this.cardIndex = 0
    this.side = 'front'
  }

  advance(): { cardIndex: number; side: 'front' | 'back'; isNewCard: boolean } {
    if (this.totalCards === 0) {
      return {
        cardIndex: 0,
        side: 'front',
        isNewCard: false
      }
    }

    let isNewCard = false

    if (this.side === 'front') {
      this.side = 'back'
    } else {
      this.cardIndex = (this.cardIndex + 1) % this.totalCards
      this.side = 'front'
      isNewCard = true
    }

    return {
      cardIndex: this.cardIndex,
      side: this.side,
      isNewCard
    }
  }

  updateTotalCards(count: number): void {
    this.totalCards = Math.max(count, 0)
    
    // Clamp index to valid range
    if (this.totalCards === 0) {
      this.cardIndex = 0
      this.side = 'front'
    } else if (this.cardIndex >= this.totalCards) {
      this.cardIndex = this.cardIndex % this.totalCards
    }
  }
}

// ============================================================================
// Debounce Utility - Closure-based for safe destructuring
// ============================================================================

function createDebouncer(delayMs: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const cancel = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  const debounce = (callback: () => void): void => {
    cancel()
    timeoutId = setTimeout(() => {
      timeoutId = null
      callback()
    }, delayMs)
  }

  const isPending = (): boolean => {
    return timeoutId !== null
  }

  return {
    debounce,
    cancel,
    cleanup: cancel,  // Alias for consistency
    isPending
  }
}

// ============================================================================
// Main Card Preview Composable
// ============================================================================

export function useCardPreview(
  cards: Ref<RawCardInput[]>,
  fetchCards: (setId: number) => Promise<void>,
  setId: Ref<number> | number,
  intervalMs = 3600,
  timerProgress: Ref<number>
) {
  const previewCard = ref<TransformedCard | null>(null)
  const currentCardSide = ref<'front' | 'back' | null>(null)
  const error = ref<string | null>(null)
  const isRunningRef = ref(false)
  
  let cycleManager: CardCycleManager | null = null
  let timerManager: TimerProgressManager | null = null
  let cycleTimeout: ReturnType<typeof setTimeout> | null = null
  let isPausedByVisibility = false
  let visibilityListener: (() => void) | null = null
  let shouldBeRunning = false  // Intent flag for auto-restart

  const startDebouncer = createDebouncer(100)
  const stopDebouncer = createDebouncer(150)

  // Normalize setId to a ref
  const setIdRef = computed(() => typeof setId === 'number' ? setId : setId.value)
  
  // Make intervalMs reactive
  const intervalMsRef = ref(Math.max(intervalMs, 100))

  // ============================================================================
  // Card Loading
  // ============================================================================

  async function ensureCardsLoaded(): Promise<boolean> {
    if (cards.value.length === 0) {
      try {
        await fetchCards(setIdRef.value)
      } catch {
        // Failed to load cards
        return false
      }
    }
    return cards.value.length > 0
  }

  // ============================================================================
  // State Management
  // ============================================================================

  function updatePreviewCard(): void {
    if (!cycleManager || !cards.value.length) return

    const cardIndex = cycleManager.getCurrentIndex()
    const side = cycleManager.getCurrentSide()

    previewCard.value = transformCard(cards.value[cardIndex])
    currentCardSide.value = side
  }

  function clearPreviewState(): void {
    previewCard.value = null
    currentCardSide.value = null
  }

  // ============================================================================
  // Cycle Control
  // ============================================================================

  function advanceCycle(): void {
    if (!cycleManager || !cards.value.length) return

    const { isNewCard } = cycleManager.advance()
    updatePreviewCard()

    // Timer only runs on front cards (new card)
    if (isNewCard && timerManager) {
      timerManager.start(intervalMsRef.value)
    }
  }

  // Use recursive setTimeout instead of setInterval for better timing accuracy
  function scheduleCycle(): void {
    if (cycleTimeout !== null) return

    if (isBrowser) {
      cycleTimeout = setTimeout(() => {
        cycleTimeout = null
        
        if (!isPausedByVisibility && isRunningRef.value) {
          advanceCycle()
          scheduleCycle()  // Schedule next cycle
        }
      }, intervalMsRef.value)
    }
  }

  function stopCycle(): void {
    if (cycleTimeout !== null) {
      clearTimeout(cycleTimeout)
      cycleTimeout = null
    }
  }
  
  function pauseCycleByVisibility(): void {
    isPausedByVisibility = true
    stopCycle()  // Stop cycle when hidden
  }
  
  function resumeCycleByVisibility(): void {
    isPausedByVisibility = false
    if (isRunningRef.value) {
      scheduleCycle()  // Resume cycle when visible
    }
  }
  
  function setupVisibilityHandling(): void {
    if (!isBrowser || visibilityListener) return  // Prevent duplicate listeners
    
    visibilityListener = () => {
      if (document.hidden) {
        pauseCycleByVisibility()
      } else {
        resumeCycleByVisibility()
      }
    }
    
    document.addEventListener('visibilitychange', visibilityListener)
  }
  
  function cleanupVisibilityHandling(): void {
    if (visibilityListener && isBrowser) {
      document.removeEventListener('visibilitychange', visibilityListener)
      visibilityListener = null
    }
  }

  // ============================================================================
  // Cleanup All Resources
  // ============================================================================

  function cleanupAll(): void {
    // Cancel pending debounces FIRST to prevent execution after cleanup
    startDebouncer.cancel()
    stopDebouncer.cancel()
    
    isRunningRef.value = false
    shouldBeRunning = false
    isPausedByVisibility = false
    stopCycle()
    timerManager?.cleanup()
    clearPreviewState()
    cleanupVisibilityHandling()
    
    cycleManager = null
    timerManager = null
    error.value = null
  }

  // ============================================================================
  // Public API
  // ============================================================================

  // Core start logic without debouncing - for instant restarts
  async function startCore(): Promise<void> {
    // Set running flag IMMEDIATELY to prevent race conditions
    isRunningRef.value = true
    shouldBeRunning = true
    error.value = null
    
    try {
      stopDebouncer.cancel()

      const loaded = await ensureCardsLoaded()
      if (!loaded) {
        error.value = 'Failed to load cards'
        isRunningRef.value = false
        shouldBeRunning = false
        return
      }

      isPausedByVisibility = false
      cycleManager = new CardCycleManager(cards.value.length)
      timerManager = new TimerProgressManager(timerProgress)

      cycleManager.reset()
      updatePreviewCard()
      timerManager.start(intervalMsRef.value)
      scheduleCycle()
      setupVisibilityHandling()
    } catch (err) {
      // Reset on failure
      error.value = err instanceof Error ? err.message : 'Unknown error'
      isRunningRef.value = false
      shouldBeRunning = false
      cleanupAll()
    }
  }

  // Public start with debouncing for user interactions
  async function startPreview(): Promise<void> {
    startDebouncer.debounce(async () => {
      if (isRunningRef.value) return
      await startCore()
    })
  }

  function stopPreview(): void {
    stopDebouncer.debounce(() => {
      if (!isRunningRef.value) return
      startDebouncer.cancel()

      shouldBeRunning = false
      isRunningRef.value = false
      isPausedByVisibility = false
      stopCycle()
      timerManager?.cleanup()  // Use cleanup() not stop()
      clearPreviewState()
      cleanupVisibilityHandling()
      
      // Reset progress for clear visual feedback
      timerProgress.value = 0
      
      cycleManager = null
      timerManager = null
    })
  }

  // ============================================================================
  // Reactivity - Watch for Changes
  // ============================================================================

  // Update cycle manager when cards array changes
  watch(() => cards.value.length, (newLength, oldLength) => {
    if (newLength === 0) {
      // Cards became empty - clear state but remember intent
      if (cycleManager) {
        cleanupAll()
      }
    } else {
      // Update total and clamp index if manager exists
      if (cycleManager) {
        cycleManager.updateTotalCards(newLength)
        
        // Live refresh: update current preview when count changes
        if (isRunningRef.value && newLength !== oldLength) {
          updatePreviewCard()
        }
      }
      
      // Auto-restart: if we should be running but aren't (cards repopulated)
      if (shouldBeRunning && !isRunningRef.value) {
        startCore()
      }
    }
  })

  // Instant restart when setId changes - use startCore() to bypass debounce
  watch(setIdRef, async (newSetId, oldSetId) => {
    if (newSetId !== oldSetId && isRunningRef.value) {
      cleanupAll()
      await startCore()  // Instant restart without debounce
    }
  })
  
  // Note: intervalMs is a parameter, not reactive. To make interval changes reactive,
  // pass a Ref<number> instead of a number. The intervalMsRef is initialized once at creation.

  // ============================================================================
  // Lifecycle Cleanup
  // ============================================================================

  onUnmounted(() => {
    cleanupAll()
  })

  return {
    previewCard: computed(() => previewCard.value),
    currentCardSide: computed(() => currentCardSide.value),
    isRunning: computed(() => isRunningRef.value),
    error: computed(() => error.value),
    startPreview,
    stopPreview
  }
} 