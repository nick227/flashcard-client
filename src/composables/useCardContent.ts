import { computed, type ComputedRef } from 'vue'
import type { ContentCell } from '@/types/card'
import { useDynamicFontSize } from './useDynamicFontSize'

interface CardContentOptions {
  width?: number
  height?: number
  debug?: boolean
  cardIndex?: number
  layout?: string
  parentWidth?: number
  parentHeight?: number
  cacheKey?: string
}

interface TextStyle {
  fontSize: string
}

export function useCardContent(
  cell: ComputedRef<ContentCell>, 
  options: ComputedRef<CardContentOptions> | CardContentOptions = {}
) {
  const { getTextStyle } = useDynamicFontSize()
  
  // Create a computed property for text style that updates when content changes
  const textStyle = computed<TextStyle>(() => {
    const currentCell = cell.value
    if (!currentCell || currentCell.type !== 'text') {
      return { fontSize: '1rem' }
    }
    
    const content = currentCell.content || ''
    const currentOptions = 'value' in options ? options.value : options
    
    return getTextStyle(content, {
      width: currentOptions.width,
      height: currentOptions.height,
      debug: currentOptions.debug,
      cacheKey: currentOptions.cacheKey
    })
  })

  const handleImageError = (event: Event) => {
    const img = event.target as HTMLImageElement
    if (img) {
      img.classList.add('error')
    }
  }

  return {
    textStyle,
    handleImageError
  }
} 