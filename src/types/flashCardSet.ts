import type { FlashCard } from '@/types/flashCard'

interface Educator {
  id: number
  name: string
  image: string | null
}

export interface FlashCardSet {
  id: number
  title: string
  description: string
  thumbnail: string
  hidden: boolean
  educatorId: number
  educatorName: string
  educatorImage: string | null
  educator: Educator | null
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