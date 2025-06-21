import { computed } from 'vue'

// A curated list of visually pleasing colors that work well for category badges
const categoryColors = [
  '#DDF4FF', // Soft Sky
  '#D2F8D2', // Mint Cream
  '#FFE7C7', // Peach Fizz
  '#F1D9FF', // Lavender Blush
  '#D6F9F9', // Aqua Whisper
  '#FFD6E8', // Bubblegum Pink
  '#E7FDD8', // Fresh Avocado
  '#FFF2BF', // Lemon Sorbet
  '#E3E8FF', // Misty Periwinkle
  '#D9FFF5', // Ice Mint
  '#FFE0DA', // Coral Haze
  '#E8DFFF', // Soft Orchid
  '#E0FFE1', // Pastel Green
  '#FFE4C1', // Apricot Cream
  '#DAF0FF', // Pale Azure
  '#F0F0F0'  // Modern Light Gray
]

export function useCategoryColor(categoryId?: number) {
  const color = computed(() => {
    if (!categoryId) return categoryColors[0]
    // Use modulo to ensure we always get a valid index
    return categoryColors[categoryId % categoryColors.length]
  })

  return {
    color
  }
} 