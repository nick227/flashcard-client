import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useToaster } from '../useToaster'

describe('useToaster', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Clear toasts before each test
    const { toasts } = useToaster()
    toasts.value = []
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('starts with empty toasts array', () => {
    const { toasts } = useToaster()
    expect(toasts.value).toEqual([])
  })

  it('adds a toast message', () => {
    const { toasts, toast } = useToaster()
    
    toast('Test message', 'success')
    
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0]).toMatchObject({
      message: 'Test message',
      type: 'success'
    })
    expect(toasts.value[0].id).toBeDefined()
  })

  it('defaults to info type when type not specified', () => {
    const { toasts, toast } = useToaster()
    
    toast('Info message')
    
    expect(toasts.value[0].type).toBe('info')
  })

  it('assigns unique IDs to each toast', () => {
    const { toasts, toast } = useToaster()
    
    toast('First')
    toast('Second')
    toast('Third')
    
    const ids = toasts.value.map(t => t.id)
    expect(new Set(ids).size).toBe(3)
  })

  it('removes a toast by ID', () => {
    const { toasts, toast, remove } = useToaster()
    
    toast('First')
    toast('Second')
    const toastId = toasts.value[0].id
    
    remove(toastId)
    
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].message).toBe('Second')
  })

  it('auto-removes toast after 3 seconds', () => {
    const { toasts, toast } = useToaster()
    
    toast('Auto remove')
    expect(toasts.value).toHaveLength(1)
    
    vi.advanceTimersByTime(3000)
    
    expect(toasts.value).toHaveLength(0)
  })

  it('handles multiple toasts with auto-removal', () => {
    const { toasts, toast } = useToaster()
    
    toast('First')
    vi.advanceTimersByTime(1000)
    toast('Second')
    vi.advanceTimersByTime(1000)
    toast('Third')
    
    expect(toasts.value).toHaveLength(3)
    
    vi.advanceTimersByTime(1000) // Total: 3000ms from first
    expect(toasts.value).toHaveLength(2) // First removed
    
    vi.advanceTimersByTime(1000) // Total: 4000ms from start
    expect(toasts.value).toHaveLength(1) // Second removed
    
    vi.advanceTimersByTime(1000) // Total: 5000ms from start
    expect(toasts.value).toHaveLength(0) // Third removed
  })

  it('supports different toast types', () => {
    const { toasts, toast } = useToaster()
    
    toast('Success', 'success')
    toast('Error', 'error')
    toast('Info', 'info')
    
    expect(toasts.value).toHaveLength(3)
    expect(toasts.value[0].type).toBe('success')
    expect(toasts.value[1].type).toBe('error')
    expect(toasts.value[2].type).toBe('info')
  })

  it('handles removal of non-existent toast gracefully', () => {
    const { toasts, toast, remove } = useToaster()
    
    toast('Test')
    const initialLength = toasts.value.length
    
    remove(9999) // Non-existent ID
    
    expect(toasts.value).toHaveLength(initialLength)
  })
})

