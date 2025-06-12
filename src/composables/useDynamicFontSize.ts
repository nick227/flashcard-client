import { computed } from 'vue'

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

export function useDynamicFontSize(text: string, options: FontSizeOptions = {}): FontSizeResult {
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

  // Memoize the text length calculation
  const charCount = computed(() => text?.length || 0)

  // Calculate if we're at min/max bounds
  const isMinSize = computed(() => charCount.value >= maxChars)
  const isMaxSize = computed(() => charCount.value <= minChars)

  // Calculate font size with debouncing if needed
  const fontSize = computed(() => {
    const count = charCount.value

    // Handle edge cases
    if (!text || count === 0) {
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

  return {
    fontSize: fontSize.value,
    style: style.value,
    charCount: charCount.value,
    isMinSize: isMinSize.value,
    isMaxSize: isMaxSize.value
  }
} 