export interface FlashCard {
  id: number
  setId: number
  front: string
  back: string
  hint?: string | undefined
}

export interface FlashCardDraft {
  front: string
  back: string
} 