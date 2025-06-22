import { computed, type ComputedRef } from 'vue'
import type { Card } from '@/types/card'

interface FormValidationData {
  title: string
  description: string
  category: number
  thumbnail: string | null
  cards: Card[]
  setGenerating?: boolean
  isSubmitting?: boolean
}

interface ValidationResult {
  isValid: boolean
  error?: string
}

export function useFormValidation(formData: ComputedRef<FormValidationData>) {
  const validateForm = (): ValidationResult => {
    const data = formData.value
    
    if (data.setGenerating) {
      return { isValid: false, error: 'Please wait for AI generation to complete' }
    }
    
    if (!data.title?.trim()) {
      return { isValid: false, error: 'Title is required' }
    }
    
    if (!data.description?.trim()) {
      return { isValid: false, error: 'Description is required' }
    }
    
    if (!data.category) {
      return { isValid: false, error: 'Category is required' }
    }
    
    if (!data.thumbnail) {
      return { isValid: false, error: 'Thumbnail is required' }
    }
    
    if (!data.cards?.length) {
      return { isValid: false, error: 'At least one card is required' }
    }
    
    return { isValid: true }
  }

  const getSubmitButtonTitle = computed(() => {
    const data = formData.value
    
    if (data.setGenerating) return 'Please wait for AI generation to complete'
    if (data.isSubmitting) return 'Submitting...'
    if (!data.title) return 'Title is required'
    if (!data.description) return 'Description is required'
    if (!data.category) return 'Category is required'
    if (!data.thumbnail) return 'Thumbnail is required'
    if (!data.cards?.length) return 'At least one card is required'
    return 'Submit Set'
  })

  const isFormValid = computed(() => {
    return validateForm().isValid
  })

  return {
    validateForm,
    getSubmitButtonTitle,
    isFormValid
  }
} 