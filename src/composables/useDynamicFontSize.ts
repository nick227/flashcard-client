import { computed, onUnmounted, ref } from 'vue'

interface FontSizeOptions {
  minChars?: number
  maxChars?: number
  minSize?: number
  maxSize?: number
  unit?: 'em' | 'rem' | 'px'
}

interface FontSizeResult {
  fontSize: string
  style: { fontSize: string }
  charCount: number
  isMinSize: boolean
  isMaxSize: boolean
}

const DEFAULT_OPTIONS: Required<FontSizeOptions> = {
  minChars: 8,
  maxChars: 250,
  minSize: 0.5,
  maxSize: 4,
  unit: 'em'
}

// Maximum safe text length to prevent performance issues
const MAX_SAFE_TEXT_LENGTH = 10000

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
    minChars = DEFAULT_OPTIONS.minChars,
    maxChars = DEFAULT_OPTIONS.maxChars,
    minSize = DEFAULT_OPTIONS.minSize,
    maxSize = DEFAULT_OPTIONS.maxSize,
    unit = DEFAULT_OPTIONS.unit
  } = options

  // Validate options
  if (minChars >= maxChars) {
    console.warn('useDynamicFontSize: minChars should be less than maxChars')
  }
  if (minSize >= maxSize) {
    console.warn('useDynamicFontSize: minSize should be less than maxSize')
  }
  if (minSize <= 0 || maxSize <= 0) {
    console.warn('useDynamicFontSize: font sizes should be positive')
  }

  // Create a reactive reference to the text
  const textRef = ref(text)

  // Memoize the text length calculation
  const charCount = computed(() => {
    const count = textRef.value?.length || 0
    return Math.min(count, MAX_SAFE_TEXT_LENGTH)
  })

  // Calculate if we're at min/max bounds
  const isMinSize = computed(() => charCount.value >= maxChars)
  const isMaxSize = computed(() => charCount.value <= minChars)

  // Calculate font size with debouncing if needed
  const fontSize = computed(() => {
    const count = charCount.value

    // Handle edge cases
    if (!textRef.value || count === 0) {
      return `${maxSize}${unit}`
    }

    // Return max size for short text
    if (count <= minChars) {
      return `${maxSize}${unit}`
    }

    // Return min size for long text
    if (count >= maxChars) {
      return `${minSize}${unit}`
    }

    // Calculate font size based on character count
    // Using inverse linear interpolation
    const range = maxChars - minChars
    const sizeRange = maxSize - minSize
    const ratio = (count - minChars) / range
    const size = maxSize - (ratio * sizeRange)

    // Round to 2 decimal places for cleaner values
    return `${Math.round(size * 100) / 100}${unit}`
  })

  // Memoize the style object
  const style = computed(() => ({
    fontSize: fontSize.value
  }))

  // Cleanup on unmount
  onUnmounted(() => {
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