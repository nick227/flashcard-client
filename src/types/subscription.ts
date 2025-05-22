export interface Subscription {
  id: number
  userId: number
  educatorId: number
  createdAt: string
  subscriberName?: string
  date?: string
  subscriber?: {
    id: number
    name: string
    image?: string
  }
} 