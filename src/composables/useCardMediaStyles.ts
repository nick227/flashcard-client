import { computed } from 'vue'

export type CardViewMode = 'full' | 'tile' | 'preview'

export function useCardMediaStyles(viewMode: CardViewMode) {
  const containerStyles = computed(() => {
    switch (viewMode) {
      case 'full':
        return {
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }
      case 'tile':
        return {
          height: '200px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }
      case 'preview':
        return {
          height: '150px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }
      default:
        return {}
    }
  })

  const mediaStyles = computed(() => {
    switch (viewMode) {
      case 'full':
        return {
          maxWidth: '100%',
          maxHeight: '100%',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain'
        }
      case 'tile':
        return {
          maxWidth: '100%',
          maxHeight: '100%',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain'
        }
      case 'preview':
        return {
          maxWidth: '100%',
          maxHeight: '100%',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain'
        }
      default:
        return {}
    }
  })

  const youtubeStyles = computed(() => {
    switch (viewMode) {
      case 'full':
        return {
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
          aspectRatio: '16/9',
          position: 'absolute',
          top: '0',
          left: '0'
        }
      case 'tile':
        return {
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
          aspectRatio: '16/9',
          position: 'absolute',
          top: '0',
          left: '0'
        }
      case 'preview':
        return {
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
          aspectRatio: '16/9',
          position: 'absolute',
          top: '0',
          left: '0'
        }
      default:
        return {}
    }
  })

  return {
    containerStyles,
    mediaStyles,
    youtubeStyles
  }
} 