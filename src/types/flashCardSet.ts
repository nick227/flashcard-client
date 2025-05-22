import { FlashCard } from './flashCard'

export interface FlashCardSet {
  id: number
  title: string
  description: string
  educatorId: number
  educatorName: string
  price: number | null
  isSubscriberOnly: boolean
  thumbnail: string
  category: string
  featured: boolean
  createdAt: string
  hidden: boolean
  likes: number
  updatedAt: string
  cards?: FlashCard[]
  tags?: string[]
  type: 'free' | 'subscribers' | 'premium'
  amount?: number
  userId: number
  user: {
    id: number
    userName: string
    displayName: string
    avatar: string
  }
} 