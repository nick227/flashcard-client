import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchCategories } from '../categoryApi'
import { api } from '../index'

vi.mock('../index', () => ({
  api: {
    get: vi.fn()
  },
  apiEndpoints: {
    categories: '/categories'
  }
}))

describe('categoryApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchCategories', () => {
    it('returns categories array when backend returns wrapped response', async () => {
      const mockCategories = [
        { id: 1, name: 'Math' },
        { id: 2, name: 'Science' }
      ]
      
      vi.mocked(api.get).mockResolvedValue({
        data: {
          success: true,
          data: mockCategories
        }
      })

      const result = await fetchCategories()

      expect(result).toEqual(mockCategories)
    })

    it('returns categories array when backend returns direct array', async () => {
      const mockCategories = [
        { id: 1, name: 'Math' },
        { id: 2, name: 'Science' }
      ]
      
      vi.mocked(api.get).mockResolvedValue({
        data: mockCategories
      })

      const result = await fetchCategories()

      expect(result).toEqual(mockCategories)
    })

    it('returns empty array when response is not an array', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true }
      })

      const result = await fetchCategories()

      expect(result).toEqual([])
    })

    it('returns empty array when data property is not an array', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {
          success: true,
          data: null
        }
      })

      const result = await fetchCategories()

      expect(result).toEqual([])
    })

    it('passes inUse parameter when inUseOnly is true', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: []
      })

      await fetchCategories(true)

      expect(api.get).toHaveBeenCalledWith(
        '/categories',
        { params: { inUse: 'true' } }
      )
    })

    it('does not pass params when inUseOnly is false', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: []
      })

      await fetchCategories(false)

      expect(api.get).toHaveBeenCalledWith(
        '/categories',
        { params: undefined }
      )
    })

    it('throws error on API failure', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))

      await expect(fetchCategories()).rejects.toThrow('Failed to fetch categories')
    })

    it('logs error on failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))

      await expect(fetchCategories()).rejects.toThrow()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching categories:',
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
    })
  })
})

