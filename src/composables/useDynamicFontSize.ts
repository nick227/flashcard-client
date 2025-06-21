interface FontSizeOptions {
  isMobile?: boolean
  width?: number
  height?: number
}

interface TextStyle {
  fontSize: string
}

// Font size constants
const MIN_FONT_SIZE = 1
const MAX_FONT_SIZE = 4.0
const MIN_CHARS = 1
const MAX_CHARS = 90
const MOBILE_MULTIPLIER = 0.8

// Container size thresholds and multipliers
const MIN_CONTAINER_SIZE = 250   // Lowered to handle narrow containers
const MAX_CONTAINER_SIZE = 5000 // Adjusted for typical card sizes
const SIZE_MULTIPLIER = 1.02     // Reduced for more subtle scaling
const MIN_ASPECT_RATIO = 0.1    // More permissive for tall containers
const MAX_ASPECT_RATIO = 10.0   // More permissive for wide containers

// Scaling constants
const MIN_ASPECT_MULTIPLIER = 0.5  // Minimum multiplier for extreme aspect ratios
const MIN_SIZE_MULTIPLIER = 0.85    // Minimum multiplier for extreme sizes
const LOG_SCALE_FACTOR = 0.3        // Controls how quickly the log scale affects the multiplier

function calculateFontSize(text: string, options: FontSizeOptions = {}): number {
  if (!text) return MAX_FONT_SIZE

  const { isMobile = false, width = 0, height = 0 } = options
  const length = text.trim().length
  const area = width * height
  const aspectRatio = width && height ? width / height : 1

  // Base font size from character count with MIN_CHARS consideration
  let baseFontSize: number
  if (length <= MIN_CHARS) {
    baseFontSize = MAX_FONT_SIZE
  } else if (length >= MAX_CHARS) {
    baseFontSize = MIN_FONT_SIZE
  } else {
    // Normalize length between MIN_CHARS and MAX_CHARS
    const normalizedLength = (length - MIN_CHARS) / (MAX_CHARS - MIN_CHARS)
    const scale = 1 - (normalizedLength * normalizedLength) // Quadratic scaling
    baseFontSize = MIN_FONT_SIZE + (MAX_FONT_SIZE - MIN_FONT_SIZE) * scale
  }

  // Container size multiplier
  let sizeMultiplier = 1.0
  if (area > 0) {
    // Logarithmic area scaling for more natural visual behavior
    const logArea = Math.log(area)
    const logMinArea = Math.log(MIN_CONTAINER_SIZE)
    const logMaxArea = Math.log(MAX_CONTAINER_SIZE)
    const normalizedArea = Math.min(
      Math.max((logArea - logMinArea) / (logMaxArea - logMinArea), 0),
      1
    )
    
    // Aspect ratio adjustment with minimum bound
    let aspectMultiplier = 1.0
    if (aspectRatio < MIN_ASPECT_RATIO) {
      aspectMultiplier = Math.max(
        Math.pow(aspectRatio / MIN_ASPECT_RATIO, 0.5),
        MIN_ASPECT_MULTIPLIER
      )
    } else if (aspectRatio > MAX_ASPECT_RATIO) {
      aspectMultiplier = Math.max(
        Math.pow(MAX_ASPECT_RATIO / aspectRatio, 0.5),
        MIN_ASPECT_MULTIPLIER
      )
    }
    
    // Combine area and aspect ratio effects with logarithmic scaling
    const areaEffect = 1.0 - (SIZE_MULTIPLIER * Math.pow(normalizedArea, LOG_SCALE_FACTOR))
    sizeMultiplier = areaEffect * aspectMultiplier
    
    // Ensure minimum multiplier for extreme cases
    sizeMultiplier = Math.max(sizeMultiplier, MIN_SIZE_MULTIPLIER)
  }

  let fontSize = baseFontSize * sizeMultiplier
  if (isMobile) fontSize *= MOBILE_MULTIPLIER
  
  // Ensure font size stays within bounds
  return Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, fontSize))
}


export function useDynamicFontSize() {
  const getTextStyle = (text: string, options: FontSizeOptions = {}): TextStyle => {
    return { fontSize: `${calculateFontSize(text, options).toFixed(2)}rem` }
  }
  return { getTextStyle }
}
