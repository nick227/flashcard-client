import { ref } from 'vue'
import { api, apiEndpoints } from '@/api'

export function useCardLikes(setId: number) {
  const likes = ref(0)
  const userLiked = ref(false)
  const loading = ref(false)

  const fetchSetLikes = async () => {
    try {
      const response = await api.get(apiEndpoints.sets.likes(setId))
      likes.value = response.data.count || 0
    } catch (error) {
      console.error('Error fetching set likes:', error)
    }
  }

  const fetchUserLikeForSet = async () => {
    try {
      const response = await api.get(apiEndpoints.sets.userLikes(setId))
      userLiked.value = response.data.liked || false
    } catch (error) {
      console.error('Error fetching user like:', error)
      userLiked.value = false
    }
  }

  const toggleLike = async () => {
    if (loading.value) return
    loading.value = true

    try {
      const response = await api.post(apiEndpoints.sets.toggleLike(setId))
      userLiked.value = response.data.liked
      if (userLiked.value) {
        likes.value++
      } else {
        likes.value = Math.max(0, likes.value - 1)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    } finally {
      loading.value = false
    }
  }

  return {
    likes,
    userLiked,
    loading,
    fetchSetLikes,
    fetchUserLikeForSet,
    toggleLike
  }
} 