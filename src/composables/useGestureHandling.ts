import { ref, onMounted, onUnmounted } from 'vue'

interface GestureCallbacks {
  onFlip: () => void
  onNext: () => void
  onPrev: () => void
}

interface GestureOptions {
  swipeThreshold?: number
  clickDelay?: number
  flipAnimationDuration?: number
  editable?: boolean
}

export function useGestureHandling(
  callbacks: GestureCallbacks,
  options: GestureOptions = {}
) {
  // Constants
  const SWIPE_THRESHOLD = options.swipeThreshold || 50
  const CLICK_DELAY = options.clickDelay || 300
  const FLIP_ANIMATION_DURATION = options.flipAnimationDuration || 300

  // State
  const isFlipping = ref(false)
  const isNavigating = ref(false)
  const isSwiping = ref(false)
  const lastClickTime = ref(0)
  const touchStartX = ref(0)
  const touchStartY = ref(0)
  const lastSwipeTime = ref(0)
  
  // Timeouts
  const flipTimeout = ref<number | null>(null)
  const clickTimeout = ref<number | null>(null)

  // Utility functions
  const clearClickTimeout = () => {
    if (clickTimeout.value) {
      clearTimeout(clickTimeout.value)
      clickTimeout.value = null
    }
  }

  const clearTimeouts = () => {
    if (flipTimeout.value) {
      clearTimeout(flipTimeout.value)
      flipTimeout.value = null
    }
    clearClickTimeout()
  }

  // Gesture detection
  const isHorizontalSwipe = (diffX: number, diffY: number): boolean => {
    return Math.abs(diffX) > Math.abs(diffY)
  }

  // Click handling
  const handleCardClick = () => {
    const now = Date.now()
    const timeSinceLastClick = now - lastClickTime.value
    
    // If in edit mode, don't handle clicks for flipping
    if (options.editable) {
      return
    }
    
    // Check if user is selecting text
    const selection = window.getSelection()
    if (selection?.toString()) {
      clearClickTimeout()
      return
    }
    
    // Remove selection if clicking without text selected
    if (!selection?.toString()) {
      selection?.removeAllRanges()
      const textElements = document.querySelectorAll('.card-text')
      textElements.forEach(element => {
        element.classList.remove('highlight')
      })
    }
    
    if (timeSinceLastClick < CLICK_DELAY) {
      clearClickTimeout()
      return
    }
    
    lastClickTime.value = now
    
    if (!options.editable) {
      clickTimeout.value = window.setTimeout(handleFlip, CLICK_DELAY)
    }
  }

  const handleDoubleClick = (e: MouseEvent) => {
    // Check if user is selecting text
    const selection = window.getSelection()
    if (selection?.toString()) {
      // If text is already selected, don't do anything
      return
    }

    // Get the text element that was double-clicked
    const textElement = (e.target as HTMLElement).closest('.card-text')
    if (!textElement) return

    // Create a range to select the text
    const range = document.createRange()
    range.selectNodeContents(textElement)
    
    // Clear any existing selection and add our new one
    selection?.removeAllRanges()
    selection?.addRange(range)

    // Add highlight class for visual feedback
    textElement.classList.add('highlight')
  }

  // Flip handling
  const handleFlip = () => {
    if (isFlipping.value || isNavigating.value) {
      return
    }
    
    // Clear selection when flipping
    const selection = window.getSelection()
    selection?.removeAllRanges()
    
    // Remove highlight
    const textElements = document.querySelectorAll('.card-text')
    textElements.forEach(element => {
      element.classList.remove('highlight')
    })
    
    isFlipping.value = true
    callbacks.onFlip()
    
    flipTimeout.value = window.setTimeout(() => {
      isFlipping.value = false
    }, FLIP_ANIMATION_DURATION)
  }

  // Swipe handling
  const handleSwipeEnd = (diffX: number, diffY: number) => {
    const now = Date.now()
    const timeSinceLastSwipe = now - lastSwipeTime.value
    
    // Add cooldown to prevent rapid-fire swiping
    if (timeSinceLastSwipe < 500) {
      isSwiping.value = false
      return
    }
    
    if (Math.abs(diffX) > SWIPE_THRESHOLD && isHorizontalSwipe(diffX, diffY)) {
      lastSwipeTime.value = now
      // Navigate without resetting card flip state
      if (diffX < 0) {
        callbacks.onNext()
      } else {
        callbacks.onPrev()
      }
    }
    isSwiping.value = false
  }

  // Touch event handlers
  const onTouchStart = (e: TouchEvent) => {
    // Reset state on new touch
    isSwiping.value = false
    touchStartX.value = e.changedTouches[0].clientX
    touchStartY.value = e.changedTouches[0].clientY
    isSwiping.value = true
  }

  const onTouchEnd = (e: TouchEvent) => {
    if (!isSwiping.value) {
      return
    }
    
    const diffX = e.changedTouches[0].clientX - touchStartX.value
    const diffY = e.changedTouches[0].clientY - touchStartY.value
    handleSwipeEnd(diffX, diffY)
  }

  // Mouse event handlers
  const onMouseDown = (e: MouseEvent) => {
    // Reset state on new mouse interaction
    isSwiping.value = false
    touchStartX.value = e.clientX
    touchStartY.value = e.clientY
    isSwiping.value = true
    // Don't prevent default - let click events work
  }

  const onMouseUp = (e: MouseEvent) => {
    if (!isSwiping.value) {
      return
    }
    
    const diffX = e.clientX - touchStartX.value
    const diffY = e.clientY - touchStartY.value
    
    // Only handle as swipe if it's a significant drag
    if (Math.abs(diffX) > SWIPE_THRESHOLD || Math.abs(diffY) > SWIPE_THRESHOLD) {
      handleSwipeEnd(diffX, diffY)
    }
    isSwiping.value = false
  }

  // Document click handler for deselection
  const handleDocumentClick = (e: MouseEvent) => {
    const cardEl = document.querySelector('.flashcard-scaffold')
    if (!cardEl) return
    if (!cardEl.contains(e.target as Node)) {
      // Remove highlight
      const textElements = document.querySelectorAll('.card-text')
      textElements.forEach(element => {
        element.classList.remove('highlight')
      })
      // Remove selection
      const selection = window.getSelection()
      selection?.removeAllRanges()
    }
  }

  // Lifecycle
  onMounted(() => {
    const element = document.querySelector('.flashcard-scaffold')
    if (element) {
      // Remove the touchmove handler entirely - it's interfering with touch events
      // The touchstart/touchend events should be sufficient for swipe detection
    }
    document.addEventListener('mousedown', handleDocumentClick)
  })

  onUnmounted(() => {
    clearTimeouts()
    const element = document.querySelector('.flashcard-scaffold')
    if (element && (element as any)._touchMoveHandler) {
      element.removeEventListener('touchmove', (element as any)._touchMoveHandler)
    }
    document.removeEventListener('mousedown', handleDocumentClick)
  })

  // Reset state when card changes
  const resetState = () => {
    clearTimeouts()
    isNavigating.value = true
    isFlipping.value = false
    
    setTimeout(() => {
      isNavigating.value = false
    }, 50)
  }

  return {
    // State
    isFlipping,
    isNavigating,
    isSwiping,
    
    // Event handlers
    handleCardClick,
    handleDoubleClick,
    onTouchStart,
    onTouchEnd,
    onMouseDown,
    onMouseUp,
    
    // Utility
    resetState,
    clearTimeouts
  }
} 