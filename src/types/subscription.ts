export interface Subscription {
  id: number
  user_id: number
  educator_id: number
  created_at: string
  date?: string
  educator?: {
    id: number
    name: string
    image?: string
  }
} 