import { ref } from 'vue'
import { useToaster } from './useToaster'
import { SetService } from '@/services/SetService'
import type { Card } from '@/types/card'
import { cachedApi } from '@/services/CachedApiService'
import { cacheService } from '@/plugins/cache'

interface SetSubmissionData {
  title: string
  description: string
  category: number
  tags: string[]
  price: { type: string; amount?: number }
  thumbnail: string | null
  thumbnailFile: File | null
  cards: Card[]
  pendingImageFiles: Map<string, File>
}

interface FormDataBuilder {
  buildBasicSetData(formData: FormData, data: SetSubmissionData): void
  buildThumbnailData(formData: FormData, data: SetSubmissionData): Promise<void>
  buildCardsData(formData: FormData, data: SetSubmissionData): void
}

class SetFormDataBuilder implements FormDataBuilder {
  buildBasicSetData(formData: FormData, data: SetSubmissionData): void {

    formData.append('title', data.title)
    formData.append('description', data.description)
    formData.append('category_id', data.category.toString())
    formData.append('tags', JSON.stringify(data.tags))
    formData.append('isPublic', 'true')
    formData.append('isArchived', 'false')
    formData.append('price', data.price.type === 'free' ? '0' : data.price.amount?.toString() || '0')
    formData.append('isSubscriberOnly', data.price.type === 'subscribers' ? 'true' : 'false')
  }

  async buildThumbnailData(formData: FormData, data: SetSubmissionData): Promise<void> {

    if (data.thumbnailFile) {
      formData.append('thumbnail', data.thumbnailFile)
    } else if (data.thumbnail) {
      if (data.thumbnail.startsWith('data:')) {
        const response = await fetch(data.thumbnail)
        const blob = await response.blob()
        const file = new File([blob], 'thumbnail.png', { type: 'image/png' })
        formData.append('thumbnail', file)
      } else {
        formData.append('thumbnailUrl', data.thumbnail)
      }
    }
  }

  buildCardsData(formData: FormData, data: SetSubmissionData): void {

    const cardsData = data.cards.map((card, index) => {
      // If you need to attach pending image files for blob URLs, do it here for mediaUrl only
      // (Assume mediaUrl is a blob URL if it starts with 'blob:')
      let frontImageFile = null
      let backImageFile = null
      if (card.front.mediaUrl && card.front.mediaUrl.startsWith('blob:')) {
        frontImageFile = data.pendingImageFiles.get(`front_${index}`) || null
      }
      if (card.back.mediaUrl && card.back.mediaUrl.startsWith('blob:')) {
        backImageFile = data.pendingImageFiles.get(`back_${index}`) || null
      }

      return {
        front: {
          text: card.front.content,
          imageUrl: card.front.mediaUrl,
          imageFile: frontImageFile,
          layout: card.front.layout || 'default'
        },
        back: {
          text: card.back.content,
          imageUrl: card.back.mediaUrl,
          imageFile: backImageFile,
          layout: card.back.layout || 'default'
        },
        hint: card.hint || null
      }
    })

    // Add image files to FormData
    cardsData.forEach((card, cardIndex) => {
      if (card.front.imageFile) {
        formData.append(`card_${cardIndex}_front_image`, card.front.imageFile)
      }
      if (card.back.imageFile) {
        formData.append(`card_${cardIndex}_back_image`, card.back.imageFile)
      }
    })

    // Remove imageFile from cards data before JSON serialization
    const cardsDataForJson = data.cards.map(card => ({
      front: {
        text: card.front.content,
        imageUrl: card.front.mediaUrl,
        layout: card.front.layout
      },
      back: {
        text: card.back.content,
        imageUrl: card.back.mediaUrl,
        layout: card.back.layout
      },
      hint: card.hint
    }))

    formData.append('cards', JSON.stringify(cardsDataForJson))
  }
}

const reloadCacheBySetId = async (setId: number) => {
  const singleSetKey = `/api/sets/${setId}{}`
  await cachedApi.invalidateCache(singleSetKey)
  await cacheService.deleteByPrefix('/api/sets')
}

export function useSetSubmission() {
  const { toast } = useToaster()
  const isSubmitting = ref(false)
  const formDataBuilder = new SetFormDataBuilder()

  const buildFormData = async (data: SetSubmissionData): Promise<FormData> => {

    const formData = new FormData()
    formDataBuilder.buildBasicSetData(formData, data)
    await formDataBuilder.buildThumbnailData(formData, data)
    formDataBuilder.buildCardsData(formData, data)
    
    return formData
  }

  const submitSet = async (data: SetSubmissionData, setId?: number): Promise<number> => {

    isSubmitting.value = true;

    try {
      const formData = await buildFormData(data)
      
      if (setId) {
        await SetService.updateSet(setId, formData)
        await reloadCacheBySetId(setId)
        toast('Set updated successfully', 'success')
        return setId
      } else {
        const response = await SetService.createSet(formData)
        
        if (!response || !response.id) {
          console.error('Invalid response structure:', response)
          throw new Error('Invalid response from server - missing set ID')
        }
        
        toast('Set created successfully', 'success')
        return response.id
      }
    } catch (error: unknown) {
      console.error('Error saving set:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        response: error && typeof error === 'object' && 'response' in error
          ? (error.response as any)?.data
          : undefined,
        responseStructure: error && typeof error === 'object' && 'response' in error
          ? {
              status: (error.response as any)?.status,
              statusText: (error.response as any)?.statusText,
              data: (error.response as any)?.data,
              headers: (error.response as any)?.headers
            }
          : undefined
      })
      throw error
    } finally {
      isSubmitting.value = false
    }
  }

  const navigateToSet = (setId: number) => {
    window.location.href = window.location.origin + '/sets/' + setId
  }

  return {
    isSubmitting,
    submitSet,
    navigateToSet
  }
} 