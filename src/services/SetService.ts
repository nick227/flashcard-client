import axios, { AxiosError } from 'axios'
import { api } from '@/api'
import type { FlashCard, SetPrice } from '@/types'

export interface SetFormData {
  title: string
  description: string
  categoryId: number
  price: SetPrice
  tags: string[]
  thumbnail: string | null
  cards: FlashCard[]
  educatorId: number
}

export interface CardData {
  front: string
  back: string
  hint: string | null
}

interface ErrorResponse {
  error: string;
  message?: string;
}

export class SetService {
  private static handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ErrorResponse>
      throw new Error(axiosError.response?.data?.error || axiosError.message || 'An unexpected error occurred')
    }
    throw error
  }

  static async createSet(formData: FormData) {
    try {
      const response = await api.post('/sets', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      return SetService.handleError(error)
    }
  }

  static async updateSet(setId: number, formData: FormData) {
    try {
      const response = await api.patch(`/sets/${setId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      return SetService.handleError(error)
    }
  }

  static async fetchSet(setId: number) {
    try {
      const response = await api.get(`/sets/${setId}`)
      return response.data
    } catch (error) {
      return SetService.handleError(error)
    }
  }

  static async fetchSetCards(setId: number) {
    try {
      const response = await api.get(`/cards?setId=${setId}`)
      return response.data
    } catch (error) {
      return SetService.handleError(error)
    }
  }

  static prepareFormData(data: SetFormData): FormData {
    const formData = new FormData()
    formData.append('title', data.title.trim())
    formData.append('description', data.description.trim())
    formData.append('categoryId', data.categoryId.toString())
    
    // Handle price based on type
    if (data.price.type === 'premium') {
      formData.append('price', (data.price.amount || 0).toString())
      formData.append('isSubscriberOnly', 'false')
    } else if (data.price.type === 'subscribers') {
      formData.append('price', (data.price.amount || 0).toString())
      formData.append('isSubscriberOnly', 'true')
    } else {
      formData.append('price', '0')
      formData.append('isSubscriberOnly', 'false')
    }

    formData.append('educatorId', data.educatorId.toString())
    formData.append('featured', 'false')
    formData.append('hidden', 'false')

    if (data.tags.length > 0) {
      formData.append('tags', JSON.stringify(data.tags))
    }

    // Handle thumbnail URL
    if (data.thumbnail) {
      console.log('SetService.prepareFormData - Adding thumbnail URL:', data.thumbnail)
      formData.append('thumbnailUrl', data.thumbnail)
    } else {
      console.log('SetService.prepareFormData - No thumbnail URL provided')
    }

    const cardsData: CardData[] = data.cards.map(card => ({
      front: card.front.trim(),
      back: card.back.trim(),
      hint: card.hint?.trim() || null
    }))
    formData.append('cards', JSON.stringify(cardsData))

    return formData
  }
} 