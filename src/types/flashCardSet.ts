import type { FlashCard } from '@/types/flashCard'

export interface FlashCardSet {
  id: number
  title: string
  description: string
  thumbnail: string
  hidden: boolean
  educatorId: number
  educatorName: string
  educatorImage?: string
  category: string
  tags: string[]
  price: {
    type: 'free' | 'subscribers' | 'premium'
    amount?: number
  }
  createdAt: string
  updatedAt: string
  cards?: FlashCard[]
} 