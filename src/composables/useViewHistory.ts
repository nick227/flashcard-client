import { ref, computed, onUnmounted } from 'vue'
import { api } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useToaster } from '@/composables/useToaster'
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
    const { toast } = useToaster()
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
            // Try to get existing history
            const res = await api.get(`/history/${setId}`)
            const existingHistory = res.data
            
            if (existingHistory) {
                history.value = existingHistory
                lastUpdatedCards.value = existingHistory.numCardsViewed
            } else {
                // Create new history record if none exists
                const newHistory = await api.post('/history', {
                    set_id: setId,
                    user_id: user.value.id
                })
                history.value = newHistory.data
                lastUpdatedCards.value = 0
            }
        } catch (err: any) {
            if (err.response?.status === 404) {
                // If history not found, create new one
                try {
                    const newHistory = await api.post('/history', {
                        set_id: setId,
                        user_id: user.value.id
                    })
                    history.value = newHistory.data
                    lastUpdatedCards.value = 0
                } catch (createErr) {
                    error.value = 'Failed to create view history'
                    console.error('Failed to create view history:', createErr)
                    toast('Failed to create view history', 'error')
                }
            } else {
                error.value = 'Failed to initialize view history'
                console.error('Failed to initialize view history:', err)
                toast('Failed to initialize view history', 'error')
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
            const res = await api.patch(`/history/${history.value.id}`, {
                num_cards_viewed: numCards,
                user_id: user.value.id
            })
            history.value = res.data
            lastUpdatedCards.value = numCards
            console.log('Successfully updated history:', history.value)
        } catch (err) {
            console.error('Failed to update cards viewed:', err)
            toast('Failed to update progress', 'error')
        }
    }, 1000) // Debounce for 1 second

    // Update number of cards viewed
    const updateCardsViewed = (numCards: number) => {
        debouncedUpdateCards(numCards)
    }

    // Mark set as completed
    const markAsCompleted = async () => {
        if (!history.value || !user.value?.id || isCompleted.value) return

        try {
            const res = await api.post('/history/complete', {
                setId
            })
            if (res.data) {
                history.value = res.data
            }
        } catch (err) {
            console.error('Failed to mark set as completed:', err)
            toast('Failed to mark set as completed', 'error')
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