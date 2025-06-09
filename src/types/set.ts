export interface Set {
  id: number
  title: string
  description: string
  category: string
  type: 'free' | 'premium' | 'subscriber'
  userId: number
  createdAt: string
  updatedAt: string
  views: number
  likes: number
  cardsCount: number
  tags: string[]
  thumbnailUrl?: string
  isPublic: boolean
  price: {
    type: 'free' | 'premium' | 'subscribers'
    amount?: number
  }
  isPurchased?: boolean
  isLiked?: boolean
  educatorId: number
  educatorName: string
  educatorImage?: string
  thumbnail: string // Required for FlashCardSet compatibility
  hidden: boolean
} 