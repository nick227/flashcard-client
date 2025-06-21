export interface Set {
  id: number
  title: string
  description: string
  category: string
  categoryId?: number
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
  cards: Array<{
    id: number
    front: string | { text: string; imageUrl: string | null; layout: string }
    back: string | { text: string; imageUrl: string | null; layout: string }
    hint?: string | null
    front_image?: string | null
    back_image?: string | null
    layout_front?: string
    layout_back?: string
  }>
  isArchived: boolean
  isSubscriberOnly?: boolean
}

export interface SetCreate {
  title: string
  description: string
  categoryId: number
  tags: string[]
  isPublic: boolean
  isArchived: boolean
  price: string
  isSubscriberOnly: boolean
  cards: Array<{
    front: {
      text: string
      imageUrl: string | null
      layout: string
    }
    back: {
      text: string
      imageUrl: string | null
      layout: string
    }
    hint?: string | null
  }>
}

export interface SetUpdate extends SetCreate {
  id: number
} 