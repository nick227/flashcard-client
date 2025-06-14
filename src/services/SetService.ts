import axios, { AxiosError } from 'axios'
import { api } from '@/api'
import type { FlashCard, SetPrice } from '@/types'
import type { Card, CardData } from '@/types/card'
import { CardTransformService } from './CardTransformService'

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
      // Transform the response data to view model
      return response.data.map((card: CardData) => CardTransformService.toView(card))
    } catch (error) {
      return SetService.handleError(error)
    }
  }

  static prepareFormData(data: {
    title: string
    description: string
    categoryId: number
    price: SetPrice
    tags: string[]
    thumbnail: string | null
    cards: Card[]
    educatorId: number
  }) {
    const formData = new FormData()
    formData.append('title', data.title.trim())
    formData.append('description', data.description.trim())
    formData.append('categoryId', data.categoryId.toString())
    
    // Handle price based on type
    const priceAmount = data.price.type === 'free' || data.price.type === 'subscribers' 
      ? 0 
      : data.price.amount || 0
    formData.append('price', priceAmount.toString())
    formData.append('isSubscriberOnly', data.price.type === 'subscribers' ? 'true' : 'false')
    
    formData.append('tags', JSON.stringify(data.tags))
    if (data.thumbnail) {
      formData.append('thumbnailUrl', data.thumbnail)
    }

    // Transform cards to data format
    const outgoingCards = data.cards.map(card => CardTransformService.toData(card))

    console.log('[SetService.prepareFormData] Outgoing cards:', outgoingCards)
    formData.append('cards', JSON.stringify(outgoingCards))
    formData.append('educatorId', data.educatorId.toString())
    return formData
  }
} 