export interface User {
  id: number
  name: string
  email: string
  role: 'member' | 'admin'
  image: string
  bio?: string
  username: string
  createdAt?: string
  updatedAt?: string
} 