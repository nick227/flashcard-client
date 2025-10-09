import { describe, it, expect } from 'vitest'
import { useCategoryColor } from '../useCategoryColor'

describe('useCategoryColor', () => {
  it('returns default color when no categoryId provided', () => {
    const { color } = useCategoryColor()
    expect(color.value).toBe('#DDF4FF')
  })

  it('returns default color for undefined categoryId', () => {
    const { color } = useCategoryColor(undefined)
    expect(color.value).toBe('#DDF4FF')
  })

  it('returns first color for category 0', () => {
    const { color } = useCategoryColor(0)
    expect(color.value).toBe('#DDF4FF')
  })

  it('returns second color for category 1', () => {
    const { color } = useCategoryColor(1)
    expect(color.value).toBe('#D2F8D2')
  })

  it('returns different colors for different categories', () => {
    const color1 = useCategoryColor(1).color.value
    const color2 = useCategoryColor(2).color.value
    const color3 = useCategoryColor(3).color.value
    
    expect(color1).not.toBe(color2)
    expect(color2).not.toBe(color3)
    expect(color1).not.toBe(color3)
  })

  it('wraps around using modulo for large category IDs', () => {
    // There are 16 colors, so category 16 should return same as category 0
    const color0 = useCategoryColor(0).color.value
    const color16 = useCategoryColor(16).color.value
    const color32 = useCategoryColor(32).color.value
    
    expect(color16).toBe(color0)
    expect(color32).toBe(color0)
  })

  it('handles category IDs that exceed color array length', () => {
    const { color } = useCategoryColor(100)
    expect(color.value).toBeDefined()
    expect(color.value).toMatch(/^#[0-9A-F]{6}$/i)
  })

  it('returns valid hex color codes', () => {
    const testCategories = [0, 1, 5, 10, 15]
    
    testCategories.forEach(categoryId => {
      const { color } = useCategoryColor(categoryId)
      expect(color.value).toMatch(/^#[0-9A-F]{6}$/i)
    })
  })

  it('is deterministic for same category ID', () => {
    const { color: color1 } = useCategoryColor(5)
    const { color: color2 } = useCategoryColor(5)
    
    expect(color1.value).toBe(color2.value)
  })

  it('returns computed property', () => {
    const { color } = useCategoryColor(1)
    expect(color.value).toBeDefined()
  })
})

