// Pure function version: no refs, no computed, no lifecycle hooks, no DOM

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
  isMobile?: boolean // Pass this from the component
  mode?: 'edit' | 'view'
}

interface FontSizeResult {
  fontSize: string
  style: { fontSize: string }
  charCount: number
  isMinSize: boolean
  isMaxSize: boolean
}

const DEFAULT_OPTIONS: Required<Omit<FontSizeOptions, 'isMobile' | 'mode'>> = {
  desktopMaxSize: 4,
  desktopMinSize: 1,
  desktopBreakpoint1: 80,
  desktopBreakpoint2: 300,
  mobileMaxSize: 2,
  mobileMinSize: 1,
  mobileBreakpoint1: 50,
  mobileBreakpoint2: 150,
  unit: 'rem'
}

const MAX_SAFE_TEXT_LENGTH = 10000

export function calculateFontSize(text: string, options: FontSizeOptions = {}): FontSizeResult {
  if (text === null || text === undefined) text = ''
  if (text.length > MAX_SAFE_TEXT_LENGTH) text = text.slice(0, MAX_SAFE_TEXT_LENGTH)

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
    isMobile = false,
    mode = 'view'
  } = options

  const charCount = Math.min(text.length, MAX_SAFE_TEXT_LENGTH)
  const maxSize = isMobile ? mobileMaxSize : desktopMaxSize
  const minSize = isMobile ? mobileMinSize : desktopMinSize
  const breakpoint1 = isMobile ? mobileBreakpoint1 : desktopBreakpoint1
  const breakpoint2 = isMobile ? mobileBreakpoint2 : desktopBreakpoint2

  let size: number
  if (charCount <= breakpoint1) {
    // For text under breakpoint1, scale from maxSize to 1em
    const ratio = charCount / breakpoint1
    size = maxSize - (ratio * (maxSize - 1))
  } else if (charCount >= breakpoint2) {
    size = minSize
  } else {
    // For text between breakpoint1 and breakpoint2, scale from 1em to minSize
    const range = breakpoint2 - breakpoint1
    const sizeRange = 1 - minSize
    const ratio = (charCount - breakpoint1) / range
    size = 1 - (ratio * sizeRange)
  }

  // Apply mode-specific adjustments
  const modeFactor = mode === 'edit' ? 0.9 : 1
  const adjustedSize = size * modeFactor
  const fontSize = `${Math.round(adjustedSize * 100) / 100}${unit}`

  return {
    fontSize,
    style: { fontSize },
    charCount,
    isMinSize: charCount >= breakpoint2,
    isMaxSize: charCount <= breakpoint1
  }
} 