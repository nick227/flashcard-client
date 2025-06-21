import type { FlashCard } from '@/types/flashCard'

interface Educator {
  id: number
  name: string
  image: string | null
}

interface Category {
  id: number
  name: string
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

export interface RelatedSet {
  id: number
  title: string
  description: string
  educator_id: number
  price: string
  is_subscriber_only: boolean
  thumbnail: string
  category_id: number
  featured: boolean
  hidden: boolean
  download_url: string | null
  created_at: string
  category: Category
  educator: Educator
  cardCount: number
} 