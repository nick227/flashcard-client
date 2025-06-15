import { computed } from 'vue'

// A curated list of visually pleasing colors that work well for category badges
const categoryColors = [
  '#E3F2FD', // Light Blue
  '#E8F5E9', // Light Green
  '#FFF3E0', // Light Orange
  '#F3E5F5', // Light Purple
  '#E0F7FA', // Light Cyan
  '#FCE4EC', // Light Pink
  '#F1F8E9', // Light Lime
  '#FFF8E1', // Light Amber
  '#E8EAF6', // Light Indigo
  '#E0F2F1', // Light Teal
  '#FBE9E7', // Light Deep Orange
  '#EDE7F6', // Light Deep Purple
  '#E8F5E9', // Light Green
  '#FFF3E0', // Light Orange
  '#E3F2FD', // Light Blue
  '#F5F5F5', // Light Gray
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