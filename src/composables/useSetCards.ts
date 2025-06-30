import { ref } from 'vue'
import { api, getApiUrl, apiEndpoints } from '@/api'
import type { Card } from '@/types/card'

export function useSetCards() {
  const cards = ref<Card[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchSetCards = async (setId: number) => {
    loading.value = true
    error.value = null
    try {
      const res = await api.get(getApiUrl(`${apiEndpoints.sets.base}/${setId}`))
      cards.value = Array.isArray(res.data.cards) ? res.data.cards : []
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch cards'
      cards.value = []
    } finally {
      loading.value = false
    }
  }

  return {
    cards,
    loading,
    error,
    fetchSetCards
  }
} 