import { computed, type ComputedRef } from 'vue'
import type { ContentCell } from '@/types/card'
import { useDynamicFontSize } from './useDynamicFontSize'

interface CardContentOptions {
  width?: number
  height?: number
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
      height: currentOptions.height
    })
  })

  // Create a computed property for formatted content
  const formattedContent = computed(() => {
    const currentCell = cell.value
    if (!currentCell || currentCell.type !== 'text') {
      return ''
    }
    return currentCell.content || ''
  })

  const isImage = (url: string): boolean => {
    if (!url) return false
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
  }

  const handleImageError = (event: Event) => {
    const img = event.target as HTMLImageElement
    if (img) {
      img.classList.add('error')
    }
  }

  return {
    textStyle,
    formattedContent,
    isImage,
    handleImageError
  }
} 