import { describe, it, expect } from 'vitest'
import { computed, ref } from 'vue'
import { useFormValidation } from '../useFormValidation'
import type { Card } from '@/types/card'

describe('useFormValidation', () => {
  const mockCard: Card = {
    id: 1,
    title: 'Test Card',
    front: { content: 'Front', mediaUrl: null, layout: 'default' },
    back: { content: 'Back', mediaUrl: null, layout: 'default' },
    hint: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    reviewCount: 0,
    difficulty: 0,
    userId: '1',
    deckId: '1'
  }

  it('validates complete form successfully', () => {
    const formData = computed(() => ({
      title: 'Test Title',
      description: 'Test Description',
      category: 1,
      thumbnail: 'thumb.jpg',
      cards: [mockCard],
      setGenerating: false,
      isSubmitting: false
    }))

    const { validateForm, isFormValid } = useFormValidation(formData)

    const result = validateForm()
    expect(result.isValid).toBe(true)
    expect(result.error).toBeUndefined()
    expect(isFormValid.value).toBe(true)
  })

  it('rejects form when AI is generating', () => {
    const formData = computed(() => ({
      title: 'Test',
      description: 'Test',
      category: 1,
      thumbnail: 'thumb.jpg',
      cards: [mockCard],
      setGenerating: true
    }))

    const { validateForm } = useFormValidation(formData)
    const result = validateForm()

    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Please wait for AI generation to complete')
  })

  it('rejects form without title', () => {
    const formData = computed(() => ({
      title: '',
      description: 'Test',
      category: 1,
      thumbnail: 'thumb.jpg',
      cards: [mockCard]
    }))

    const { validateForm } = useFormValidation(formData)
    const result = validateForm()

    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Title is required')
  })

  it('rejects form with whitespace-only title', () => {
    const formData = computed(() => ({
      title: '   ',
      description: 'Test',
      category: 1,
      thumbnail: 'thumb.jpg',
      cards: [mockCard]
    }))

    const { validateForm } = useFormValidation(formData)
    const result = validateForm()

    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Title is required')
  })

  it('rejects form without description', () => {
    const formData = computed(() => ({
      title: 'Test',
      description: '',
      category: 1,
      thumbnail: 'thumb.jpg',
      cards: [mockCard]
    }))

    const { validateForm } = useFormValidation(formData)
    const result = validateForm()

    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Description is required')
  })

  it('rejects form without category', () => {
    const formData = computed(() => ({
      title: 'Test',
      description: 'Test',
      category: 0,
      thumbnail: 'thumb.jpg',
      cards: [mockCard]
    }))

    const { validateForm } = useFormValidation(formData)
    const result = validateForm()

    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Category is required')
  })

  it('rejects form without thumbnail', () => {
    const formData = computed(() => ({
      title: 'Test',
      description: 'Test',
      category: 1,
      thumbnail: null,
      cards: [mockCard]
    }))

    const { validateForm } = useFormValidation(formData)
    const result = validateForm()

    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Thumbnail is required')
  })

  it('rejects form without cards', () => {
    const formData = computed(() => ({
      title: 'Test',
      description: 'Test',
      category: 1,
      thumbnail: 'thumb.jpg',
      cards: []
    }))

    const { validateForm } = useFormValidation(formData)
    const result = validateForm()

    expect(result.isValid).toBe(false)
    expect(result.error).toBe('At least one card is required')
  })

  it('provides correct submit button title when generating', () => {
    const formData = computed(() => ({
      title: 'Test',
      description: 'Test',
      category: 1,
      thumbnail: 'thumb.jpg',
      cards: [mockCard],
      setGenerating: true
    }))

    const { getSubmitButtonTitle } = useFormValidation(formData)

    expect(getSubmitButtonTitle.value).toBe('Please wait for AI generation to complete')
  })

  it('provides correct submit button title when submitting', () => {
    const formData = computed(() => ({
      title: 'Test',
      description: 'Test',
      category: 1,
      thumbnail: 'thumb.jpg',
      cards: [mockCard],
      isSubmitting: true
    }))

    const { getSubmitButtonTitle } = useFormValidation(formData)

    expect(getSubmitButtonTitle.value).toBe('Submitting...')
  })

  it('provides correct submit button title for valid form', () => {
    const formData = computed(() => ({
      title: 'Test',
      description: 'Test',
      category: 1,
      thumbnail: 'thumb.jpg',
      cards: [mockCard]
    }))

    const { getSubmitButtonTitle } = useFormValidation(formData)

    expect(getSubmitButtonTitle.value).toBe('Submit Set')
  })

  it('reactively updates validation when data changes', () => {
    const title = ref('')
    const formData = computed(() => ({
      title: title.value,
      description: 'Test',
      category: 1,
      thumbnail: 'thumb.jpg',
      cards: [mockCard]
    }))

    const { isFormValid } = useFormValidation(formData)

    expect(isFormValid.value).toBe(false)

    title.value = 'Now has title'

    expect(isFormValid.value).toBe(true)
  })
})

