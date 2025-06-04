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
        if (!user.value?.id) return

        loading.value = true
        error.value = null

        try {
            // First try to get existing history
            try {
                const { data: existingHistory } = await api.get(`/history/${setId}`)
                history.value = existingHistory
                lastUpdatedCards.value = existingHistory.numCardsViewed
                console.log('Found existing history:', existingHistory)
            } catch (getErr: any) {
                if (getErr.response?.status === 404) {
                    // If no history exists, create new one
                    const { data: newHistory } = await api.post('/history', { set_id: setId })
                    history.value = newHistory
                    lastUpdatedCards.value = 0
                    console.log('Created new history:', newHistory)
                } else {
                    throw getErr
                }
            }
        } catch (err: any) {
            console.error('Error initializing history:', err)
            error.value = err.response?.data?.error || 'Failed to initialize history'
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
            const { data: updatedHistory } = await api.patch(`/history/${history.value.id}`, {
                num_cards_viewed: numCards
            })
            history.value = updatedHistory
            lastUpdatedCards.value = numCards
            console.log('Successfully updated history:', history.value)
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
            const { data: updatedHistory } = await api.patch(`/history/${history.value.id}`, {
                completed: true
            })
            history.value = updatedHistory
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