import { ref } from 'vue'
import type { Ref } from 'vue'
import type { Card } from '@/types/card'
import { useToaster } from './useToaster'
import { useCardNavigation } from './useCardNavigation'

export function useCardControls(cards: Ref<Card[]>) {
  const { toast } = useToaster()
  const isFullScreen = ref(false)
  const showHint = ref(false)

  const {
    resetNavigation
  } = useCardNavigation(cards)

  const toggleFullScreen = () => {
    const mainCardArea = document.querySelector('.main-card-area') as HTMLElement | null
    if (!mainCardArea) return

    if (!document.fullscreenElement) {
      mainCardArea.requestFullscreen()
      isFullScreen.value = true
      document.addEventListener('fullscreenchange', handleFullScreenChange)
      // Ensure focus after entering fullscreen
      setTimeout(() => {
        mainCardArea.focus()
      }, 100)
    } else {
      document.exitFullscreen()
      isFullScreen.value = false
    }
  }

  const handleFullScreenChange = () => {
    isFullScreen.value = !!document.fullscreenElement
    const mainCardArea = document.querySelector('.main-card-area') as HTMLElement | null
    if (mainCardArea) {
      // Ensure focus after fullscreen change
      setTimeout(() => {
        mainCardArea.focus()
      }, 100)
    }
  }

  const showHintToast = (hint: string | null) => {
    if (hint) {
      toast(hint, 'info')
    }
  }

  const handleRestart = () => {
    resetNavigation()
    showHint.value = false
  }

  const handleKeyDown = (
    e: KeyboardEvent,
    isFullScreen: boolean,
    prevCard: () => void,
    handleNextCardWithHistory: () => void,
    showHint: Ref<boolean>,
    currentCard: Card | undefined
  ) => {
    if (e.key === 'Escape' && isFullScreen) {
      document.exitFullscreen()
      return
    }

    switch (e.key) {
      case 'ArrowLeft':
        prevCard()
        break
      case 'ArrowRight':
        handleNextCardWithHistory()
        break
      case 'h':
        if (currentCard?.hint) {
          showHint.value = !showHint.value
        }
        break
    }
  }

  return {
    isFullScreen,
    showHint,
    toggleFullScreen,
    handleFullScreenChange,
    showHintToast,
    handleRestart,
    handleKeyDown
  }
} 