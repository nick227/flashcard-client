import { ref } from 'vue'
import { useToaster } from './useToaster'
import { SetService } from '@/services/SetService'
import { processCellsToLegacyFormat } from '@/utils/cellUtils'
import type { Card } from '@/types/card'

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
      const frontProcessed = processCellsToLegacyFormat(card.front.cells || [])
      const backProcessed = processCellsToLegacyFormat(card.back.cells || [])

      console.log(`[FormDataBuilder] Processing card ${index}:`, {
        hasFrontText: !!frontProcessed.text,
        hasFrontImage: !!frontProcessed.imageUrl,
        hasBackText: !!backProcessed.text,
        hasBackImage: !!backProcessed.imageUrl
      });

      // Handle pending image files for blob URLs
      this.attachPendingImageFiles(frontProcessed, card.front.cells || [], 'front', data.pendingImageFiles)
      this.attachPendingImageFiles(backProcessed, card.back.cells || [], 'back', data.pendingImageFiles)

      return {
        front: {
          text: frontProcessed.text,
          imageUrl: frontProcessed.imageUrl,
          imageFile: frontProcessed.imageFile,
          layout: card.front.layout || 'default'
        },
        back: {
          text: backProcessed.text,
          imageUrl: backProcessed.imageUrl,
          imageFile: backProcessed.imageFile,
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
    const cardsDataForJson = cardsData.map(card => ({
      front: {
        text: card.front.text,
        imageUrl: card.front.imageUrl,
        layout: card.front.layout
      },
      back: {
        text: card.back.text,
        imageUrl: card.back.imageUrl,
        layout: card.back.layout
      },
      hint: card.hint
    }))

    console.log('[FormDataBuilder] Adding cards JSON to FormData:', {
      cardsCount: cardsDataForJson.length,
      cardsWithImages: cardsDataForJson.filter(card => 
        (card.front.imageUrl) || (card.back.imageUrl)
      ).length
    });

    formData.append('cards', JSON.stringify(cardsDataForJson))
  }

  private attachPendingImageFiles(
    processed: any, 
    cells: any[], 
    side: 'front' | 'back', 
    pendingImageFiles: Map<string, File>
  ): void {
    if (processed.imageFile === null && cells) {
      const mediaCell = cells.find(cell => cell.type === 'media' && cell.mediaUrl?.startsWith('blob:'))
      if (mediaCell) {
        const cellIndex = cells.indexOf(mediaCell)
        const key = `${side}_${cellIndex}`
        processed.imageFile = pendingImageFiles.get(key) || null
      }
    }
  }
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