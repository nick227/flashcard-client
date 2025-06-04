export interface FlashCard {
  id: number;
  setId: number;
  front: {
    text: string;
    imageUrl: string | null;
  };
  back: {
    text: string;
    imageUrl: string | null;
  };
  hint: string | null;
}

export type Card = FlashCard;

export interface CardSet {
  id: number;
  title: string;
  description: string;
  cards: Card[];
  userId: number;
  createdAt: Date;
  updatedAt: Date;
} 