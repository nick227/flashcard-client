interface FontSizeOptions {
  width?: number
  height?: number
}

interface TextStyle {
  fontSize: string
}

interface FontSizeConfig {
  minFontSize: number
  maxFontSize: number
  minChars: number
  maxChars: number
  minContainerSize: number
  maxContainerSize: number
  sizeMultiplier: number
  minAspectRatio: number
  maxAspectRatio: number
  minAspectMultiplier: number
  minSizeMultiplier: number
  logScaleFactor: number
}

// Single configuration for all platforms
const FONT_CONFIG: FontSizeConfig = {
  minFontSize: 0.9,
  maxFontSize: 4,
  minChars: 20,
  maxChars: 140,
  minContainerSize: 500,
  maxContainerSize: 300000,
  sizeMultiplier: 1.5,
  minAspectRatio: 0.1,
  maxAspectRatio: 10.0,
  minAspectMultiplier: 0.25,
  minSizeMultiplier: 0.5,
  logScaleFactor: 0.3
}

function calculateFontSize(text: string, options: FontSizeOptions = {}, config: FontSizeConfig): number {
  if (!text) {
    return config.maxFontSize
  }

  const { width = 0, height = 0 } = options
  const length = text.trim().length
  const area = width * height
  const aspectRatio = width && height ? width / height : 1

  // Base font size from character count with minChars consideration
  let baseFontSize: number
  if (length <= config.minChars) {
    baseFontSize = config.maxFontSize
  } else if (length >= config.maxChars) {
    baseFontSize = config.minFontSize
  } else {
    // Normalize length between minChars and maxChars
    const normalizedLength = (length - config.minChars) / (config.maxChars - config.minChars)
    const scale = 1 - (normalizedLength * normalizedLength) // Quadratic scaling
    baseFontSize = config.minFontSize + (config.maxFontSize - config.minFontSize) * scale
  }

  // For very short text (≤ minChars), skip container scaling to ensure maxFontSize
  if (length <= config.minChars) {
    return baseFontSize // Return exactly maxFontSize (4rem) for short text
  }

  // Container size multiplier (only applied to longer text)
  let sizeMultiplier = 1.0
  if (area > 0) {
    // Logarithmic area scaling for more natural visual behavior
    const logArea = Math.log(area)
    const logMinArea = Math.log(config.minContainerSize)
    const logMaxArea = Math.log(config.maxContainerSize)
    const normalizedArea = Math.min(
      Math.max((logArea - logMinArea) / (logMaxArea - logMinArea), 0),
      1
    )
    
    
    // Aspect ratio adjustment with minimum bound
    let aspectMultiplier = 1.0
    if (aspectRatio < config.minAspectRatio) {
      aspectMultiplier = Math.max(
        Math.pow(aspectRatio / config.minAspectRatio, 0.5),
        config.minAspectMultiplier
      )
    } else if (aspectRatio > config.maxAspectRatio) {
      aspectMultiplier = Math.max(
        Math.pow(config.maxAspectRatio / aspectRatio, 0.5),
        config.minAspectMultiplier
      )
    }
    
    // Combine area and aspect ratio effects with logarithmic scaling
    const areaEffect = 1.0 - (config.sizeMultiplier * Math.pow(normalizedArea, config.logScaleFactor))
    sizeMultiplier = areaEffect * aspectMultiplier
    
    // Ensure minimum multiplier for extreme cases
    sizeMultiplier = Math.max(sizeMultiplier, config.minSizeMultiplier)
  }

  let fontSize = baseFontSize * sizeMultiplier
  
  // Ensure font size stays within bounds
  const finalFontSize = Math.max(config.minFontSize, Math.min(config.maxFontSize, fontSize))
  
  return finalFontSize
}

export function useDynamicFontSize() {
  const getTextStyle = (text: string, options: FontSizeOptions = {}): TextStyle => {
    
    const fontSize = calculateFontSize(text, options, FONT_CONFIG)
    const result = { fontSize: `${fontSize.toFixed(2)}rem` }
    
    return result
  }
  
  return { getTextStyle }
}
