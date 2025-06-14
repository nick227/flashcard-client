import { ref } from 'vue'

export interface User {
  id: number
  name: string
  email: string
  role: string
}

export function useAuth() {
  const user = ref<User | null>(null)

  return {
    user
  }
} 