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
    if (aiLoading.value) {
      console.warn('[CardContentAI] Already generating, ignoring request')
      return
    }

    aiLoading.value = true
    onMessage('Generating content with AI...')
    
    try {
      // Create a promise wrapper around the callback-based service
      await new Promise<void>((resolve, reject) => {
        aiCardService.generateCardFace({
          side,
          title,
          description,
          category,
          otherSideContent,
          onResult: (text: string) => {
            try {
              onMessage('Content generated successfully!')
              onResult(text)
              resolve()
            } catch (error) {
              reject(error)
            }
          },
          onError: (error: string) => {
            try {
              onMessage('Failed to generate content. Please try again.')
              onError(error)
              reject(new Error(error))
            } catch (callbackError) {
              reject(callbackError)
            }
          }
        })
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      onMessage('Failed to generate content. Please try again.')
      onError(errorMessage)
    } finally {
      aiLoading.value = false
    }
  }

  return {
    aiLoading,
    aiGenerate
  }
} 