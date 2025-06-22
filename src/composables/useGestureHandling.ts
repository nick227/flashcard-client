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

interface Point {
  x: number
  y: number
}

interface Movement {
  diffX: number
  diffY: number
}

export function useGestureHandling(
  callbacks: GestureCallbacks,
  options: GestureOptions = {}
) {
  // Constants
  const SWIPE_THRESHOLD = options.swipeThreshold || 50
  const CLICK_DELAY = options.clickDelay || 300
  const FLIP_ANIMATION_DURATION = options.flipAnimationDuration || 300
  const SWIPE_COOLDOWN = 500

  // State
  const isFlipping = ref(false)
  const isNavigating = ref(false)
  const isSwiping = ref(false)
  const lastClickTime = ref(0)
  const touchStartPoint = ref<Point>({ x: 0, y: 0 })
  const lastSwipeTime = ref(0)
  
  // Timeouts
  const flipTimeout = ref<number | null>(null)
  const clickTimeout = ref<number | null>(null)

  // Cached DOM elements and utilities
  let cardElement: HTMLElement | null = null
  let textElements: NodeListOf<HTMLElement> | null = null
  let selection: Selection | null = null

  // DOM Management
  const initCachedElements = () => {
    cardElement = document.querySelector('.flashcard-scaffold')
    textElements = document.querySelectorAll('.card-text') as NodeListOf<HTMLElement>
    selection = window.getSelection()
  }

  const clearCachedElements = () => {
    cardElement = null
    textElements = null
    selection = null
  }

  // Timeout Management
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

  // Text Selection Management
  const clearTextHighlights = () => {
    if (textElements) {
      textElements.forEach(element => {
        element.classList.remove('highlight')
      })
    }
  }

  const clearSelection = () => {
    if (selection) {
      selection.removeAllRanges()
    }
  }

  const hasTextSelection = (): boolean => {
    return Boolean(selection?.toString())
  }

  const selectTextElement = (element: HTMLElement) => {
    const range = document.createRange()
    range.selectNodeContents(element)
    clearSelection()
    selection?.addRange(range)
    element.classList.add('highlight')
  }

  // Gesture Detection
  const isHorizontalSwipe = (movement: Movement): boolean => {
    return Math.abs(movement.diffX) > Math.abs(movement.diffY)
  }

  const isSwipeThresholdMet = (movement: Movement): boolean => {
    return Math.abs(movement.diffX) > SWIPE_THRESHOLD
  }

  const isSignificantDrag = (movement: Movement): boolean => {
    return Math.abs(movement.diffX) > SWIPE_THRESHOLD || Math.abs(movement.diffY) > SWIPE_THRESHOLD
  }

  // Movement Calculation
  const calculateMovement = (currentPoint: Point): Movement => {
    return {
      diffX: currentPoint.x - touchStartPoint.value.x,
      diffY: currentPoint.y - touchStartPoint.value.y
    }
  }

  const getTouchPoint = (e: TouchEvent): Point => {
    return {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    }
  }

  const getMousePoint = (e: MouseEvent): Point => {
    return {
      x: e.clientX,
      y: e.clientY
    }
  }

  // State Management
  const startSwipe = (point: Point) => {
    isSwiping.value = false
    touchStartPoint.value = point
    isSwiping.value = true
  }

  const endSwipe = () => {
    isSwiping.value = false
  }

  const isInEditMode = (): boolean => {
    return Boolean(options.editable)
  }

  const isActionBlocked = (): boolean => {
    return isFlipping.value || isNavigating.value
  }

  // Timing Management
  const isClickTooSoon = (): boolean => {
    const now = Date.now()
    const timeSinceLastClick = now - lastClickTime.value
    return timeSinceLastClick < CLICK_DELAY
  }

  const isSwipeTooSoon = (): boolean => {
    const now = Date.now()
    const timeSinceLastSwipe = now - lastSwipeTime.value
    return timeSinceLastSwipe < SWIPE_COOLDOWN
  }

  const updateClickTime = () => {
    lastClickTime.value = Date.now()
  }

  const updateSwipeTime = () => {
    lastSwipeTime.value = Date.now()
  }

  // Action Handlers
  const handleFlip = () => {
    if (isActionBlocked()) return
    
    clearSelection()
    clearTextHighlights()
    
    isFlipping.value = true
    callbacks.onFlip()
    
    flipTimeout.value = window.setTimeout(() => {
      isFlipping.value = false
    }, FLIP_ANIMATION_DURATION)
  }

  const handleNavigation = (movement: Movement) => {
    if (isSwipeTooSoon()) {
      endSwipe()
      return
    }
    
    if (isSwipeThresholdMet(movement) && isHorizontalSwipe(movement)) {
      updateSwipeTime()
      movement.diffX < 0 ? callbacks.onNext() : callbacks.onPrev()
    }
    
    endSwipe()
  }

  // Click Handling
  const handleCardClick = () => {
    if (isInEditMode()) return
    if (hasTextSelection()) {
      clearClickTimeout()
      return
    }
    
    clearSelection()
    clearTextHighlights()
    
    if (isClickTooSoon()) {
      clearClickTimeout()
      return
    }
    
    updateClickTime()
    clickTimeout.value = window.setTimeout(handleFlip, CLICK_DELAY)
  }

  const handleDoubleClick = (e: MouseEvent) => {
    if (hasTextSelection()) return

    const textElement = (e.target as HTMLElement).closest('.card-text') as HTMLElement
    if (!textElement) return

    selectTextElement(textElement)
  }

  // Event Handlers
  const onTouchStart = (e: TouchEvent) => {
    startSwipe(getTouchPoint(e))
  }

  const onTouchEnd = (e: TouchEvent) => {
    if (!isSwiping.value) return
    
    const movement = calculateMovement(getTouchPoint(e))
    handleNavigation(movement)
  }

  const onMouseDown = (e: MouseEvent) => {
    startSwipe(getMousePoint(e))
  }

  const onMouseUp = (e: MouseEvent) => {
    if (!isSwiping.value) return
    
    const movement = calculateMovement(getMousePoint(e))
    
    if (isSignificantDrag(movement)) {
      handleNavigation(movement)
    } else {
      endSwipe()
    }
  }

  const handleDocumentClick = (e: MouseEvent) => {
    if (!cardElement || !cardElement.contains(e.target as Node)) {
      clearTextHighlights()
      clearSelection()
    }
  }

  // Lifecycle
  onMounted(() => {
    initCachedElements()
    document.addEventListener('mousedown', handleDocumentClick)
  })

  onUnmounted(() => {
    clearTimeouts()
    const element = document.querySelector('.flashcard-scaffold')
    if (element && (element as any)._touchMoveHandler) {
      element.removeEventListener('touchmove', (element as any)._touchMoveHandler)
    }
    document.removeEventListener('mousedown', handleDocumentClick)
    clearCachedElements()
  })

  const resetState = () => {
    clearTimeouts()
    isNavigating.value = true
    isFlipping.value = false
    
    setTimeout(() => {
      isNavigating.value = false
      initCachedElements()
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