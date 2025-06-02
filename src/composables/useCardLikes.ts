import { ref } from 'vue'
import { api } from '@/api'

export function useCardLikes(setId: number) {
  const likes = ref(0)
  const userLiked = ref(false)
  const loading = ref(false)

  const fetchLikes = async () => {
    try {
      loading.value = true
      const [likesRes, userLikesRes] = await Promise.all([
        api.get(`/sets/${setId}/likes`),
        api.get(`/sets/${setId}/likes/user`)
      ])
      likes.value = likesRes.data.count || 0
      userLiked.value = userLikesRes.data.liked || false
      console.log('Fetched likes state:', { likes: likes.value, userLiked: userLiked.value })
    } catch (err) {
      console.error('Error fetching likes:', err)
    } finally {
      loading.value = false
    }
  }

  const toggleLike = async () => {
    try {
      loading.value = true
      const res = await api.post(`/sets/${setId}/like`)
      likes.value = res.data.likes || 0
      userLiked.value = res.data.liked || false
      console.log('Toggled like state:', { likes: likes.value, userLiked: userLiked.value })
      return res.data
    } catch (err) {
      console.error('Error toggling like:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchUserLikeForSet = async () => {
    try {
      const res = await api.get(`/sets/${setId}/likes/user`)
      userLiked.value = res.data.liked || false
      console.log('Fetched user like state:', userLiked.value)
      return res.data
    } catch (err) {
      console.error('Error fetching user like:', err)
      userLiked.value = false
      return { liked: false }
    }
  }

  const fetchSetLikes = async () => {
    try {
      const res = await api.get(`/sets/${setId}/likes`)
      likes.value = res.data.count || 0
      console.log('Fetched set likes:', likes.value)
      return res.data
    } catch (err) {
      console.error('Error fetching set likes:', err)
      likes.value = 0
      return { count: 0 }
    }
  }

  // Initialize likes state
  fetchLikes()

  return {
    likes,
    userLiked,
    loading,
    fetchLikes,
    toggleLike,
    fetchUserLikeForSet,
    fetchSetLikes
  }
} 