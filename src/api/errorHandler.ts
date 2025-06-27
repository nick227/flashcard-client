import axios from 'axios'

export function handleApiError(error: unknown, fallbackMessage: string): never {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error)
    }
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message)
    }
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please try again.')
    }
    if (error.response?.status === 413) {
      throw new Error('File too large. Maximum size is 5MB.')
    }
    throw new Error('Network error. Please check your connection.')
  }
  throw new Error(fallbackMessage)
} 