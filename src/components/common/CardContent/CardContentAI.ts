import { ref } from 'vue'
import { aiCardService } from '@/services/AICardService'
import type { CardSide } from '@/types/card'

export function useCardContentAI(
  onMessage: (message: string) => void,
  onResult: (text: string) => void,
  onError: (error: string) => void
) {
  const aiLoading = ref(false)

  const aiGenerate = async (
    side: CardSide,
    title: string,
    description: string,
    category: string,
    otherSideContent: string
  ) => {
    if (aiLoading.value) return

    try {
      aiLoading.value = true
      onMessage('Generating content with AI...')
      
      await aiCardService.generateCardFace({
        side,
        title,
        description,
        category,
        otherSideContent,
        onResult: (text: string) => {
          onMessage('Content generated successfully!')
          onResult(text)
          aiLoading.value = false
        },
        onError: (error: string) => {
          onMessage('Failed to generate content. Please try again.')
          onError(error)
          aiLoading.value = false
        }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      onMessage('Failed to generate content. Please try again.')
      onError(errorMessage)
      aiLoading.value = false
    }
  }

  return {
    aiLoading,
    aiGenerate
  }
} 