import { apiEndpoints } from '@/api'
import axios, { AxiosError } from 'axios'
import type { FlashCard, SetPrice } from '@/types'

export interface SetFormData {
  title: string
  description: string
  categoryId: number
  price: SetPrice
  tags: string[]
  thumbnail: File | null
  cards: FlashCard[]
  educatorId: number
}

export interface CardData {
  front: string
  back: string
  hint: string | null
}

export class SetService {
  private static handleError(error: unknown): never {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data?.message || error.message || 'An unexpected error occurred')
    }
    throw error
  }

  static async createSet(formData: FormData, cardsData: CardData[]) {
    try {
      const response = await axios.post(apiEndpoints.sets, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  static async updateSet(setId: number, formData: FormData, cardsData: CardData[]) {
    try {
      const response = await axios.patch(`${apiEndpoints.sets}/${setId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  static async fetchSet(setId: number) {
    try {
      const response = await axios.get(`${apiEndpoints.sets}/${setId}`)
      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  static async fetchSetCards(setId: number) {
    try {
      const response = await axios.get(`${apiEndpoints.cards}?setId=${setId}`)
      return response.data
    } catch (error) {
      this.handleError(error)
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

    if (data.thumbnail) {
      formData.append('thumbnail', data.thumbnail)
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