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
  private generationId: string | null = null

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
    this.generationId = `card-${Date.now()}`

    // Add disconnection handler
    const handleDisconnect = () => {
      if (this.isGenerating) {
        onError('Connection lost during generation')
        this.resetState()
      }
    }

    try {
      console.log('AICardService - Generating card face:', {
        side,
        title,
        description,
        category,
        otherSideContent,
        generationId: this.generationId
      })

      // Add disconnect listener
      aiSocketService.onDisconnect(handleDisconnect)

      // Ensure socket is connected with better error handling
      if (!aiSocketService.connected) {
        console.log('AICardService - Socket not connected, initializing...')
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
            console.log('AICardService - Generation result:', text)
            clearTimeout(generationTimeout)
            aiSocketService.offDisconnect(handleDisconnect)
            onResult(text)
            this.resetState()
          },
          onError: (err: string) => {
            console.error('AICardService - Generation error:', err)
            clearTimeout(generationTimeout)
            aiSocketService.offDisconnect(handleDisconnect)
            onError(err)
            this.resetState()
          }
        }
      )
    } catch (error) {
      console.error('AICardService - Unexpected error:', error)
      aiSocketService.offDisconnect(handleDisconnect)
      onError(error instanceof Error ? error.message : 'An unexpected error occurred')
      this.resetState()
    }
  }

  private resetState() {
      this.isGenerating = false
    this.generationId = null
  }

  // Add cleanup method for component unmount
  public cleanup() {
    this.resetState()
  }
}

export const aiCardService = AICardService.getInstance() 