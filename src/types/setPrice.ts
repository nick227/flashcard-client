export interface SetPrice {
  type: 'free' | 'subscribers' | 'premium'
  amount?: number
} 