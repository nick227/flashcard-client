import { ref, watchEffect, type ComputedRef } from 'vue'
import { calculateFontSize } from './useDynamicFontSize'

export function useFontSizes(
  textContent: ComputedRef<string[]>,
  areaCount: ComputedRef<number>,
  mode: 'edit' | 'view' = 'view'
) {
  // Use a ref array for font sizes
  const fontSizes = ref<any[]>([])

  // Track mobile status reactively
  const isMobile = ref(window.innerWidth < 768)
  function handleResize() {
    isMobile.value = window.innerWidth < 768
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize)
  }

  watchEffect(() => {
    const count = areaCount.value
    const sizes = new Array(count)
    for (let i = 0; i < count; i++) {
      const text = textContent.value[i] || ''
      try {
        sizes[i] = calculateFontSize(text, {
          desktopMaxSize: 4,
          desktopMinSize: 1,
          desktopBreakpoint1: 80,
          desktopBreakpoint2: 300,
          mobileMaxSize: 2,
          mobileMinSize: 1,
          mobileBreakpoint1: 50,
          mobileBreakpoint2: 150,
          unit: 'rem',
          mode,
          isMobile: isMobile.value
        })
      } catch (e) {
        console.warn('Error calculating font size:', e)
        sizes[i] = { style: { fontSize: '1rem' } }
      }
    }
    fontSizes.value = sizes
  })

  return {
    fontSizes
  }
} 