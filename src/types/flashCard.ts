export interface FlashCard {
  id: number
  front: {
    content: string
    mediaUrl: string | null
    layout: string
  }
  back: {
    content: string
    mediaUrl: string | null
    layout: string
  }
  hint?: string | null
  front_image?: string | null
  back_image?: string | null
  layout_front?: string
  layout_back?: string
}

export interface FlashCardDraft {
  front: string
  back: string
} 