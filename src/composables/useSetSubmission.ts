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
    console.log('[FormDataBuilder] Building basic set data...', {
      title: data.title,
      category: data.category,
      price: data.price,
      tagsCount: data.tags.length
    });

    formData.append('title', data.title)
    formData.append('description', data.description)
    formData.append('category_id', data.category.toString())
    formData.append('tags', JSON.stringify(data.tags))
    formData.append('isPublic', 'true')
    formData.append('isArchived', 'false')
    formData.append('price', data.price.type === 'free' ? '0' : data.price.amount?.toString() || '0')
    formData.append('isSubscriberOnly', data.price.type === 'subscribers' ? 'true' : 'false')

    console.log('[FormDataBuilder] Basic set data added to FormData');
  }

  async buildThumbnailData(formData: FormData, data: SetSubmissionData): Promise<void> {
    console.log('[FormDataBuilder] Building thumbnail data...', {
      hasThumbnailFile: !!data.thumbnailFile,
      hasThumbnail: !!data.thumbnail,
      thumbnailType: data.thumbnail ? (data.thumbnail.startsWith('data:') ? 'base64' : 'url') : 'none'
    });

    if (data.thumbnailFile) {
      console.log('[FormDataBuilder] Adding thumbnail file to FormData:', {
        fileName: data.thumbnailFile.name,
        fileSize: data.thumbnailFile.size,
        fileType: data.thumbnailFile.type
      });
      formData.append('thumbnail', data.thumbnailFile)
    } else if (data.thumbnail) {
      if (data.thumbnail.startsWith('data:')) {
        console.log('[FormDataBuilder] Converting base64 thumbnail to file...');
        const response = await fetch(data.thumbnail)
        const blob = await response.blob()
        const file = new File([blob], 'thumbnail.png', { type: 'image/png' })
        formData.append('thumbnail', file)
        console.log('[FormDataBuilder] Base64 thumbnail converted and added to FormData');
      } else {
        console.log('[FormDataBuilder] Adding stock image thumbnail URL to FormData:', data.thumbnail);
        formData.append('thumbnailUrl', data.thumbnail)
      }
    } else {
      console.log('[FormDataBuilder] No thumbnail data to add');
    }
  }

  buildCardsData(formData: FormData, data: SetSubmissionData): void {
    console.log('[FormDataBuilder] Building cards data...', {
      cardsCount: data.cards.length,
      pendingImageFilesCount: data.pendingImageFiles.size
    });

    const cardsData = data.cards.map((card, index) => {
      console.log(`[FormDataBuilder] Processing card ${index}:`, {
        hasFrontContent: !!card.front.content,
        hasFrontMedia: !!card.front.mediaUrl,
        hasBackContent: !!card.back.content,
        hasBackMedia: !!card.back.mediaUrl
      });

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
    console.log('[FormDataBuilder] Adding card image files to FormData...');
    cardsData.forEach((card, cardIndex) => {
      if (card.front.imageFile) {
        console.log(`[FormDataBuilder] Adding front image for card ${cardIndex}:`, {
          fileName: card.front.imageFile.name,
          fileSize: card.front.imageFile.size
        });
        formData.append(`card_${cardIndex}_front_image`, card.front.imageFile)
      }
      if (card.back.imageFile) {
        console.log(`[FormDataBuilder] Adding back image for card ${cardIndex}:`, {
          fileName: card.back.imageFile.name,
          fileSize: card.back.imageFile.size
        });
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

    console.log('[FormDataBuilder] Adding cards JSON to FormData:', {
      cardsCount: cardsDataForJson.length,
      cardsWithMedia: cardsDataForJson.filter(card => 
        (card.front.imageUrl) || (card.back.imageUrl)
      ).length
    });

    formData.append('cards', JSON.stringify(cardsDataForJson))
  }
}

const reloadCacheBySetId = async (setId: number) => {
  const singleSetKey = `/api/sets/${setId}{}`
  const listKey = '/api/sets?page=1&limit=10'
  // Log before
  const beforeSingle = await cacheService.get(singleSetKey)
  const beforeList = await cacheService.get(listKey)
  console.log('[reloadCacheBySetId] BEFORE invalidation:', { singleSetKey, beforeSingle, listKey, beforeList })
  await cachedApi.invalidateCache(singleSetKey)
  await cacheService.deleteByPrefix('/api/sets')
  // Log after
  const afterSingle = await cacheService.get(singleSetKey)
  const afterList = await cacheService.get(listKey)
  console.log('[reloadCacheBySetId] AFTER invalidation:', { singleSetKey, afterSingle, listKey, afterList })
}

export function useSetSubmission() {
  const { toast } = useToaster()
  const isSubmitting = ref(false)
  const formDataBuilder = new SetFormDataBuilder()

  const buildFormData = async (data: SetSubmissionData): Promise<FormData> => {
    console.log('[useSetSubmission] buildFormData started...', {
      hasTitle: !!data.title,
      hasDescription: !!data.description,
      hasCategory: !!data.category,
      hasThumbnail: !!data.thumbnail,
      hasThumbnailFile: !!data.thumbnailFile,
      cardsCount: data.cards.length,
      pendingImageFilesCount: data.pendingImageFiles.size
    });

    const formData = new FormData()
    
    console.log('[useSetSubmission] Building basic set data...');
    formDataBuilder.buildBasicSetData(formData, data)
    
    console.log('[useSetSubmission] Building thumbnail data...');
    await formDataBuilder.buildThumbnailData(formData, data)
    
    console.log('[useSetSubmission] Building cards data...');
    formDataBuilder.buildCardsData(formData, data)
    
    console.log('[useSetSubmission] FormData built successfully:', {
      formDataEntries: Array.from(formData.entries()).map(([key, value]) => ({
        key,
        valueType: typeof value,
        isFile: value instanceof File,
        fileSize: value instanceof File ? value.size : null
      }))
    });
    
    return formData
  }

  const submitSet = async (data: SetSubmissionData, setId?: number): Promise<number> => {
    console.log('[useSetSubmission] submitSet started...', {
      setId,
      hasTitle: !!data.title,
      hasDescription: !!data.description,
      hasCategory: !!data.category,
      hasThumbnail: !!data.thumbnail,
      hasThumbnailFile: !!data.thumbnailFile,
      cardsCount: data.cards.length,
      pendingImageFilesCount: data.pendingImageFiles.size
    });

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