import { aiSocketService } from './AISocketService'
import type { CardSide } from '@/types/card'

interface GenerateCardOptions {
  side: CardSide
  title?: string
  description?: string
  category?: string
  otherSideContent?: string
  onResult: (text: string) => void
  onError: (error: string) => void
}

export class AICardService {
  private static instance: AICardService
  private isGenerating: boolean = false

  private constructor() {}

  static getInstance(): AICardService {
    if (!AICardService.instance) {
      AICardService.instance = new AICardService()
    }
    return AICardService.instance
  }

  async generateCardFace({
    side,
    title = '',
    description = '',
    category = '',
    otherSideContent = '',
    onResult,
    onError
  }: GenerateCardOptions): Promise<void> {
    if (this.isGenerating) {
      onError('Already generating content')
      return
    }

    this.isGenerating = true

    try {
      console.log('AICardService - Generating card face:', {
        side,
        title,
        description,
        category,
        otherSideContent
      })

      await aiSocketService.generateSingleCardFace(
        side,
        title,
        description,
        category,
        otherSideContent,
        {
          onResult: (text: string) => {
            console.log('AICardService - Generation result:', text)
            onResult(text)
            this.isGenerating = false
          },
          onError: (err: string) => {
            console.error('AICardService - Generation error:', err)
            onError(err)
            this.isGenerating = false
          }
        }
      )
    } catch (error) {
      console.error('AICardService - Unexpected error:', error)
      onError(error instanceof Error ? error.message : 'An unexpected error occurred')
      this.isGenerating = false
    }
  }
}

export const aiCardService = AICardService.getInstance() 