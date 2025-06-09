import { ref, computed, onUnmounted } from 'vue'
import { api } from '@/api'
import { useAuthStore } from '@/stores/auth'
import debounce from 'lodash/debounce'

interface ViewHistory {
  id: number
  userId: number
  setId: number
  numCardsViewed: number
  completed: boolean
  createdAt: string
  updatedAt: string
}

export function useViewHistory(setId: number) {
    const auth = useAuthStore()
    const user = ref(auth.user)
    const history = ref<ViewHistory | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)
    const lastUpdatedCards = ref<number>(0)

    const isFirstView = computed(() => !history.value)
    const isCompleted = computed(() => history.value?.completed || false)
    const cardsViewed = computed(() => history.value?.numCardsViewed || 0)

    // Initialize history when component mounts
    const initializeHistory = async () => {
        if (!user.value?.id) {
            console.log('No user ID available, skipping history initialization')
            return
        }

        loading.value = true
        error.value = null

        try {
            // First try to get existing history
            const response = await api.get(`/history/${setId}`)
            if (response.data) {
                history.value = response.data
                lastUpdatedCards.value = response.data.numCardsViewed || 0
                console.log('Found existing history:', response.data)
                return
            }
        } catch (getErr: any) {
            // Handle 404 specifically
            if (getErr.response?.status === 404) {
                console.log('No existing history found, creating new one')
                try {
                    const createResponse = await api.post('/history', { 
                        set_id: setId,
                        user_id: user.value.id 
                    })
                    
                    if (createResponse.data) {
                        history.value = createResponse.data
                        lastUpdatedCards.value = 0
                        console.log('Created new history:', createResponse.data)
                        return
                    }
                } catch (createErr: any) {
                    console.error('Error creating new history:', createErr)
                    error.value = createErr.response?.data?.error || 'Failed to create history'
                    // Don't throw, just log the error and continue
                }
            } else {
                console.error('Error fetching history:', getErr)
                error.value = getErr.response?.data?.error || 'Failed to fetch history'
                // Don't throw, just log the error and continue
            }
        } finally {
            loading.value = false
        }
    }

    // Debounced update for cards viewed
    const debouncedUpdateCards = debounce(async (numCards: number) => {
        if (!history.value || !user.value?.id) {
            console.log('Skipping update - no history or user:', { 
                hasHistory: !!history.value, 
                hasUser: !!user.value?.id 
            })
            return
        }

        // Skip update if number hasn't changed
        if (numCards === lastUpdatedCards.value) {
            console.log('Skipping update - number unchanged:', numCards)
            return
        }

        console.log('Updating cards viewed in history:', {
            historyId: history.value.id,
            numCards,
            lastUpdated: lastUpdatedCards.value
        })

        try {
            // Update the progress
            const response = await api.patch(`/history/${history.value.id}`, {
                num_cards_viewed: numCards
            })
            if (response.data) {
                history.value = response.data
                lastUpdatedCards.value = numCards
                console.log('Successfully updated history:', history.value)
            }
        } catch (err: any) {
            console.error('Error updating cards viewed:', err)
            error.value = err.response?.data?.error || 'Failed to update progress'
        } finally {
            loading.value = false
        }
    }, 1000) // Debounce for 1 second

    // Update number of cards viewed
    const updateCardsViewed = (numCards: number) => {
        debouncedUpdateCards(numCards)
    }

    // Mark set as completed
    const markAsCompleted = async () => {
        if (!history.value || !user.value?.id || isCompleted.value) return

        loading.value = true
        error.value = null

        try {
            // Mark as completed
            const response = await api.patch(`/history/${history.value.id}`, {
                completed: true
            })
            if (response.data) {
                history.value = response.data
            }
        } catch (err: any) {
            console.error('Error marking as completed:', err)
            error.value = err.response?.data?.error || 'Failed to mark as completed'
        } finally {
            loading.value = false
        }
    }

    // Cleanup on unmount
    onUnmounted(() => {
        debouncedUpdateCards.cancel()
    })

    return {
        history,
        loading,
        error,
        isFirstView,
        isCompleted,
        cardsViewed,
        initializeHistory,
        updateCardsViewed,
        markAsCompleted
    }
} 