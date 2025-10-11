import { ref, type Ref } from 'vue'
import { useEventListener } from '@vueuse/core'

export function useCardPreviewOnView(
  elRef: Ref<HTMLElement | null>,
  onEnter: () => void,
  onLeave: () => void,
  scrollContainerRef?: Ref<HTMLElement | Window | null>
) {
  const isActive = ref(false)
  const isScrolling = ref(false)
  let scrollStopTimeout: ReturnType<typeof setTimeout> | null = null

  // Helper to check if card is in center zone
  function checkCenterZone() {
    if (!elRef.value) return false
    const rect = elRef.value.getBoundingClientRect()
    let containerRect: DOMRect | null = null
    let containerCenter: number
    if (scrollContainerRef?.value && scrollContainerRef.value !== document.body) {
      containerRect = (scrollContainerRef.value as HTMLElement).getBoundingClientRect()
      containerCenter = containerRect.top + containerRect.height / 2
    } else {
      containerCenter = document.body.clientHeight / 2
    }
    const cardCenter = rect.top + rect.height / 2
    const diff = Math.abs(cardCenter - containerCenter)
    const inZone = diff <= 150
    
    return inZone
  }

  // Handler for scroll/resize events
  function onScrollOrResize() {
    isScrolling.value = true
    if (scrollStopTimeout) clearTimeout(scrollStopTimeout)
    scrollStopTimeout = setTimeout(() => {
      isScrolling.value = false
      updateActive()
    }, 100)
    updateActive()
  }

  // Update active state based on center zone and scroll stop
  function updateActive() {
    const inCenter = checkCenterZone()
    if (inCenter && !isScrolling.value) {
      if (!isActive.value) {
        isActive.value = true
        onEnter()
      }
    } else {
      if (isActive.value) {
        isActive.value = false
        onLeave()
      }
    }
  }

  // Attach listeners using VueUse
  const cleanupScroll = useEventListener(document.body, 'scroll', onScrollOrResize)
  const cleanupResize = useEventListener(window, 'resize', onScrollOrResize)
  
  // Initial check
  updateActive()

  // Return cleanup function
  return () => {
    if (scrollStopTimeout) clearTimeout(scrollStopTimeout)
    if (isActive.value) onLeave()
    cleanupScroll()
    cleanupResize()
  }
} 