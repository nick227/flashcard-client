// Layout types for rendering
export type CardLayout = 'default' | 'two-col' | 'two-row'
export type CardSide = 'front' | 'back'

// Base card content interface
export interface CardSideContent {
  content: string
  mediaUrl: string | null
  layout: CardLayout
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