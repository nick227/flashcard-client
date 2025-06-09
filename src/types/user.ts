export type UserRole = 'user' | 'educator' | 'admin'

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  image?: string
  bio?: string
  created_at?: string
  updated_at?: string
} 