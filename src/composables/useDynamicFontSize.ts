import { computed, onUnmounted, ref, onMounted, watch } from 'vue'

interface FontSizeOptions {
  // Desktop settings
  desktopMaxSize?: number
  desktopMinSize?: number
  desktopBreakpoint1?: number  // Characters for first size reduction
  desktopBreakpoint2?: number  // Characters for minimum size
  // Mobile settings
  mobileMaxSize?: number
  mobileMinSize?: number
  mobileBreakpoint1?: number   // Characters for first size reduction
  mobileBreakpoint2?: number   // Characters for minimum size
  unit?: 'em' | 'rem' | 'px'
  containerRef?: HTMLElement | null
  mode?: 'edit' | 'view'
}

interface FontSizeResult {
  fontSize: string
  style: { fontSize: string }
  charCount: number
  isMinSize: boolean
  isMaxSize: boolean
}

// Default settings optimized for flashcard use case
const DEFAULT_OPTIONS: Required<Omit<FontSizeOptions, 'containerRef' | 'mode'>> = {
  // Desktop defaults
  desktopMaxSize: 4,
  desktopMinSize: 1,
  desktopBreakpoint1: 80,  // At 200 chars, size will be 1em
  desktopBreakpoint2: 300,  // At 350 chars, size will be 0.5em
  // Mobile defaults
  mobileMaxSize: 2,
  mobileMinSize: 0.5,
  mobileBreakpoint1: 50,   // At 150 chars, size will be 1em
  mobileBreakpoint2: 150,   // At 250 chars, size will be 0.5em
  unit: 'em'
}

// Maximum safe text length to prevent performance issues
const MAX_SAFE_TEXT_LENGTH = 10000

// Debounce function to limit resize calculations
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function useDynamicFontSize(text: string, options: FontSizeOptions = {}): FontSizeResult {
  // Input validation
  if (text === null || text === undefined) {
    console.warn('useDynamicFontSize: text is null or undefined')
    text = ''
  }

  // Truncate text if it exceeds maximum safe length
  if (text.length > MAX_SAFE_TEXT_LENGTH) {
    console.warn(`useDynamicFontSize: text length (${text.length}) exceeds maximum safe length (${MAX_SAFE_TEXT_LENGTH})`)
    text = text.slice(0, MAX_SAFE_TEXT_LENGTH)
  }

  // Validate and merge options
  const {
    desktopMaxSize = DEFAULT_OPTIONS.desktopMaxSize,
    desktopMinSize = DEFAULT_OPTIONS.desktopMinSize,
    desktopBreakpoint1 = DEFAULT_OPTIONS.desktopBreakpoint1,
    desktopBreakpoint2 = DEFAULT_OPTIONS.desktopBreakpoint2,
    mobileMaxSize = DEFAULT_OPTIONS.mobileMaxSize,
    mobileMinSize = DEFAULT_OPTIONS.mobileMinSize,
    mobileBreakpoint1 = DEFAULT_OPTIONS.mobileBreakpoint1,
    mobileBreakpoint2 = DEFAULT_OPTIONS.mobileBreakpoint2,
    unit = DEFAULT_OPTIONS.unit,
    containerRef = null,
    mode = 'view'
  } = options

  // Create reactive references
  const textRef = ref(text)
  const containerWidth = ref(0)
  const containerHeight = ref(0)
  const isMobile = ref(window.innerWidth < 768)

  // Memoize the text length calculation
  const charCount = computed(() => {
    const count = textRef.value?.length || 0
    return Math.min(count, MAX_SAFE_TEXT_LENGTH)
  })

  // Calculate if we're at min/max bounds
  const isMinSize = computed(() => charCount.value >= (isMobile.value ? mobileBreakpoint2 : desktopBreakpoint2))
  const isMaxSize = computed(() => charCount.value <= (isMobile.value ? mobileBreakpoint1 : desktopBreakpoint1))

  // Function to calculate optimal font size based on character count
  const calculateOptimalFontSize = () => {
    const count = charCount.value
    if (!textRef.value || count === 0) {
      return isMobile.value ? mobileMaxSize : desktopMaxSize
    }

    // Get current breakpoints and sizes based on device
    const maxSize = isMobile.value ? mobileMaxSize : desktopMaxSize
    const minSize = isMobile.value ? mobileMinSize : desktopMinSize
    const breakpoint1 = isMobile.value ? mobileBreakpoint1 : desktopBreakpoint1
    const breakpoint2 = isMobile.value ? mobileBreakpoint2 : desktopBreakpoint2

    // Calculate size based on character count
    if (count <= breakpoint1) {
      // For text under breakpoint1, scale from maxSize to 1em
      const ratio = count / breakpoint1
      return maxSize - (ratio * (maxSize - 1))
    } else if (count >= breakpoint2) {
      return minSize
    } else {
      // For text between breakpoint1 and breakpoint2, scale from 1em to minSize
      const range = breakpoint2 - breakpoint1
      const sizeRange = 1 - minSize
      const ratio = (count - breakpoint1) / range
      return 1 - (ratio * sizeRange)
    }
  }

  // Calculate font size with device awareness
  const fontSize = computed(() => {
    const size = calculateOptimalFontSize()
    // Apply mode-specific adjustments
    const modeFactor = mode === 'edit' ? 0.9 : 1
    const adjustedSize = size * modeFactor
    return `${Math.round(adjustedSize * 100) / 100}${unit}`
  })

  // Memoize the style object
  const style = computed(() => ({
    fontSize: fontSize.value,
    overflowWrap: 'break-word',
    wordBreak: 'break-word'
  }))

  // Update container dimensions and mobile status
  const updateContainerDimensions = debounce(() => {
    if (containerRef) {
      try {
        const rect = containerRef.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
          containerWidth.value = rect.width
          containerHeight.value = rect.height
        }
      } catch (error) {
        console.warn('useDynamicFontSize: Error updating container dimensions:', error)
      }
    }
    isMobile.value = window.innerWidth < 768 || 
                    (containerRef !== null && containerWidth.value < 400)
  }, 100)

  // Set up resize observer and event listeners
  let resizeObserver: ResizeObserver | null = null

  onMounted(() => {
    if (containerRef) {
      updateContainerDimensions()
      resizeObserver = new ResizeObserver(updateContainerDimensions)
      resizeObserver.observe(containerRef)
    }
    window.addEventListener('resize', updateContainerDimensions)
  })

  // Cleanup
  onUnmounted(() => {
    if (resizeObserver && containerRef) {
      resizeObserver.unobserve(containerRef)
      resizeObserver.disconnect()
    }
    window.removeEventListener('resize', updateContainerDimensions)
    textRef.value = ''
  })

  return {
    fontSize: fontSize.value,
    style: style.value,
    charCount: charCount.value,
    isMinSize: isMinSize.value,
    isMaxSize: isMaxSize.value
  }
} 