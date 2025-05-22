import { ref, onMounted } from 'vue'
import axios from 'axios'
import { apiEndpoints } from '@/api/index'
import { useAuthStore } from '@/stores/auth'

export function useCardLikes(setId: number | string) {
  const isLiked = ref(false)
  const setLikes = ref(0)
  const auth = useAuthStore()

  const fetchUserLikeForSet = async () => {
    if (!setId) {
      console.error('No setId provided to fetchUserLikeForSet!')
      return
    }
    if (!auth.user?.id) {
      console.error('No user ID available for fetchUserLikeForSet!')
      return
    }
    try {
      const res = await axios.get(`${apiEndpoints.sets}/${setId}/likes/user`)
      isLiked.value = res.data.liked || false
    } catch (err) {
      console.error('Failed to fetch user like:', err)
      isLiked.value = false
    }
  }

  const fetchSetLikes = async () => {
    if (!setId) {
      console.error('No setId provided to fetchSetLikes!')
      return
    }
    try {
      const res = await axios.get(`${apiEndpoints.sets}/${setId}/likes`)
      setLikes.value = res.data.count || 0
    } catch (err) {
      console.error('Failed to fetch set likes:', err)
      setLikes.value = 0
    }
  }

  const toggleLikeSet = async () => {
    if (!setId) {
      console.error('No setId provided to toggleLikeSet!')
      return
    }
    if (!auth.user?.id) {
      console.error('No user ID available for toggleLikeSet!')
      return
    }

    const originalLikeState = isLiked.value
    const originalLikeCount = setLikes.value

    try {
      isLiked.value = !isLiked.value
      setLikes.value = isLiked.value ? setLikes.value + 1 : Math.max(0, setLikes.value - 1)

      const res = await axios.post(`${apiEndpoints.sets}/${setId}/like`)
      const serverLikeState = res.data.liked

      if (serverLikeState !== isLiked.value) {
        isLiked.value = serverLikeState
        setLikes.value = serverLikeState ? originalLikeCount + 1 : Math.max(0, originalLikeCount - 1)
      }
    } catch (err) {
      console.error('Failed to toggle like:', err)
      isLiked.value = originalLikeState
      setLikes.value = originalLikeCount
    }
  }

  // Fetch initial like status
  onMounted(async () => {
    if (auth.user?.id) {
      await Promise.all([
        fetchUserLikeForSet(),
        fetchSetLikes()
      ])
    }
  })

  return {
    isLiked,
    setLikes,
    toggleLikeSet,
    fetchUserLikeForSet,
    fetchSetLikes
  }
} 