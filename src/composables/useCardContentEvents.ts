import type { Ref } from 'vue'
import { useMediaUtils } from './useMediaUtils'

interface CardContentEventsOptions {
  isEditable?: boolean
  showMediaControls?: boolean
  index?: number
  onTextInput?: (index: number, content: string) => void
  onMediaClose?: (index: number, content: string) => void
}

export function useCardContentEvents(
  contentRef: Ref<HTMLElement | null>,
  options: CardContentEventsOptions
) {
  const { removeEmbed } = useMediaUtils()

  const handleTextInput = (event: Event) => {
    if (!options.isEditable || options.index === undefined) return
    const target = event.target as HTMLElement
    const content = target.textContent || ''
    options.onTextInput?.(options.index, content)
  }

  const handleMediaClose = (event: MouseEvent) => {
    if (!options.showMediaControls || options.index === undefined) {
      return
    }
    
    const target = event.target as HTMLElement
    const closeButton = target.closest('.media-close') as HTMLElement | null
    
    if (closeButton && contentRef.value) {
      event.preventDefault()
      event.stopPropagation()
      
      const updatedContent = removeEmbed(contentRef.value.textContent || '', closeButton)
      
      options.onMediaClose?.(options.index, updatedContent)
    }
  }

  const handlePaste = (event: ClipboardEvent) => {
    if (!options.isEditable || options.index === undefined) return
    event.preventDefault()
    const text = event.clipboardData?.getData('text/plain') || ''
    if (contentRef.value) {
      contentRef.value.textContent = text
      options.onTextInput?.(options.index, text)
    }
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!options.isEditable) return
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
    }
  }

  const setupEventListeners = () => {
    if (contentRef.value) {
      contentRef.value.addEventListener('click', handleMediaClose)
    }
  }

  const cleanupEventListeners = () => {
    if (contentRef.value) {
      contentRef.value.removeEventListener('click', handleMediaClose)
    }
  }

  return {
    handleTextInput,
    handleMediaClose,
    handlePaste,
    handleKeyDown,
    setupEventListeners,
    cleanupEventListeners
  }
} 