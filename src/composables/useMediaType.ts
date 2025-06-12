import { computed, isRef } from 'vue'
import type { MediaType } from '@/types/media'

export function useMediaType(url: string | null | import('vue').ComputedRef<string | null>) {
  const type = computed<MediaType>(() => {
    // Support both string and ComputedRef
    const value = isRef(url) ? url.value : url
    if (!value) return 'text'
    
    // Robust YouTube URL detection
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|embed\/|v\/|.+\?v=)?([\w-]{11})([&?][^\s]*)?$/i
    if (value.match(youtubeRegex) || value.match(/youtube\.com|youtu\.be/)) {
      console.log('useMediaType: Detected YouTube URL:', value)
      return 'youtube'
    }
    
    if (value.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      console.log('useMediaType: Detected image URL:', value)
      return 'image'
    }
    
    if (value.match(/^https?:\/\//i)) {
      console.log('useMediaType: Detected generic link URL:', value)
      return 'link'
    }
    
    console.log('useMediaType: Detected text:', value)
    return 'text'
  })

  return {
    type
  }
} 