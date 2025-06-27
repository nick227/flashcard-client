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

  private constructor() { }

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
      console.warn('[AICardService] Already generating, ignoring request')
      onError('Already generating content')
      return
    }

    this.isGenerating = true

    // Add disconnection handler
    const handleDisconnect = () => {
      console.warn('[AICardService] Socket disconnected during generation')
      if (this.isGenerating) {
        onError('Connection lost during generation')
        this.resetState()
      }
    }

    // Add fallback timeout to ensure state is always reset
    const fallbackTimeout = setTimeout(() => {
      console.warn('[AICardService] Fallback timeout - resetting state')
      if (this.isGenerating) {
        aiSocketService.offDisconnect(handleDisconnect)
        onError('Generation timed out')
        this.resetState()
      }
    }, 90000) // 90 second fallback timeout

    try {

      // Add disconnect listener
      aiSocketService.onDisconnect(handleDisconnect)

      // Ensure socket is connected with better error handling
      if (!aiSocketService.connected) {
        aiSocketService.initialize()

        // Wait for connection with timeout
        const connectionTimeout = 10000 // 10 seconds
        const startTime = Date.now()

        while (!aiSocketService.connected && Date.now() - startTime < connectionTimeout) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }

        if (!aiSocketService.connected) {
          throw new Error('Could not establish connection to AI service within timeout')
        }
      }


      // Add timeout for the generation request
      const generationTimeout = setTimeout(() => {
        console.warn('[AICardService] Generation request timed out')
        if (this.isGenerating) {
          aiSocketService.offDisconnect(handleDisconnect)
          onError('Generation request timed out')
          this.resetState()
        }
      }, 60000) // 60 second timeout


      await aiSocketService.generateSingleCardFace(
        side,
        title,
        description,
        category,
        otherSideContent,
        {
          onResult: (text: string) => {
            clearTimeout(generationTimeout)
            clearTimeout(fallbackTimeout)
            aiSocketService.offDisconnect(handleDisconnect)
            onResult(text)
            this.resetState()
          },
          onError: (err: string) => {
            console.error('AICardService - Generation error:', err)
            clearTimeout(generationTimeout)
            clearTimeout(fallbackTimeout)
            aiSocketService.offDisconnect(handleDisconnect)
            onError(err)
            this.resetState()
          }
        }
      )

    } catch (error) {
      console.error('AICardService - Unexpected error:', error)
      clearTimeout(fallbackTimeout)
      aiSocketService.offDisconnect(handleDisconnect)
      onError(error instanceof Error ? error.message : 'An unexpected error occurred')
      this.resetState()
    }
  }

  private resetState() {
    this.isGenerating = false
  }

  // Add cleanup method for component unmount
  public cleanup() {
    this.resetState()
  }
}

export const aiCardService = AICardService.getInstance() 