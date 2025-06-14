// Data model - matches database schema
export interface CardData {
  id?: number;
  setId?: number;
  front: string | { text: string; imageUrl: string | null };
  back: string | { text: string; imageUrl: string | null };
  frontImage?: string | null;
  backImage?: string | null;
  hint: string | null;
  layout_front: CardLayout;
  layout_back: CardLayout;
}

// View model - used for rendering
export interface CardView {
  id?: number;
  setId?: number;
  front: CardSideView;
  back: CardSideView;
  hint: string | null;
}

export interface CardSideView {
  text: string;
  imageUrl: string | null;
  layout: CardLayout;
}

// Type for creating/updating cards
export interface CardInput {
  front: string;
  back: string;
  frontImage: string | null;
  backImage: string | null;
  hint: string | null;
  layout_front: CardLayout;
  layout_back: CardLayout;
}

// Legacy type for backward compatibility
export type FlashCard = CardView;
export type Card = CardView;
export type CardSide = 'front' | 'back';

export interface CardSet {
  id: number;
  title: string;
  description: string;
  cards: Card[];
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CardLayout = 'default' | 'two-row' | 'two-column'; 