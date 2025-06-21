// Layout types for rendering
export type CardLayout = 'default' | 'two-col' | 'two-row'
export type CardSide = 'front' | 'back'

// Content cell types
export type ContentCellType = 'text' | 'media'

export interface ContentCell {
  type: ContentCellType
  content: string
  mediaUrl?: string | null
}

// Base card content interface
export interface CardSideContent {
  text?: string
  imageUrl?: string | null
  layout: CardLayout
  cells?: ContentCell[]
}

// Core card model - keep it simple
export interface Card {
  id: string | number
  title: string
  description?: string
  front: CardSideContent
  back: CardSideContent
  hint: string | null | undefined
  createdAt: string | Date
  updatedAt: string | Date
  reviewCount: number
  difficulty: number
  userId: string
  deckId: string
  isArchived?: boolean
  isPublic?: boolean
}

// API response model
export interface CardResponse extends Card {
  description?: string
  category?: string
  tags?: string[]
  lastReviewedAt?: string
  nextReviewDate?: string
  isArchived: boolean
  isPublic: boolean
}

// Card creation model
export interface CardCreate {
  title: string
  front: {
    text?: string
    imageUrl?: string | null
    layout?: CardLayout
    cells?: ContentCell[]
  }
  back: {
    text?: string
    imageUrl?: string | null
    layout?: CardLayout
    cells?: ContentCell[]
  }
  hint?: string | null
  isPublic?: boolean
  deckId: string
}

// Card update model
export interface CardUpdate {
  title?: string
  front?: {
    text?: string
    imageUrl?: string | null
    layout?: CardLayout
    cells?: ContentCell[]
  }
  back?: {
    text?: string
    imageUrl?: string | null
    layout?: CardLayout
    cells?: ContentCell[]
  }
  hint?: string | null
  isPublic?: boolean
  isArchived?: boolean
}

// Review models
export interface CardReview {
  cardId: string
  rating: number
  reviewDate: Date
  nextReviewDate: Date
  reviewCount: number
  difficulty: number
}

export interface CardReviewCreate {
  cardId: string
  rating: number
  reviewDate: Date
  nextReviewDate: Date
  reviewCount: number
  difficulty: number
}

export interface CardReviewUpdate {
  rating?: number
  reviewDate?: Date
  nextReviewDate?: Date
  reviewCount?: number
  difficulty?: number
}

export interface CardReviewResponse {
  id: string
  cardId: string
  rating: number
  reviewDate: Date
  nextReviewDate: Date
  reviewCount: number
  difficulty: number
  createdAt: Date
  updatedAt: Date
  userId: string
} 