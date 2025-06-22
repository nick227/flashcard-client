<template>
    <div v-if="progress.error" class="error-message">
      {{ progress.error }}
      <button v-if="canRetry" @click="generateSet" class="retry-button">
        Retry
      </button>
    </div>
  <div class="generation-status">
    <button 
      class="button button-primary"
      :class="{ 'ai-generating': generating }"
      :disabled="disabled || generating" 
      @click="generateSet"
      :title="disabled ? 'Complete Title Description and Category to Use' : 'Generate cards using AI'"
    >
      <span class="flex items-center gap-2">
        <span>🪄 AI Generator</span>
      </span>
    </button>
  </div>
  <!-- Fixed bottom progress bar -->
  <div v-if="generating" class="ai-progress-bar-fixed">
    <div class="ai-progress-bar-indeterminate"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, onMounted } from 'vue'
import { useToaster } from '@/composables/useToaster'
import type { Card } from '@/types/card'
import { aiSocketService } from '@/services/AISocketService'
import { determineOptimalLayout } from '@/utils/cellUtils'

type GenerationProgress = {
    status: 'preparing' | 'generating' | 'completed' | 'failed'
    cardsGenerated: number
    totalCards: number
    currentOperation?: string
    error?: string | null
}

const props = defineProps<{ 
  disabled: boolean,
  title: string,
  description: string, 
  category: string
}>()

const emit = defineEmits<{
  'add-set': [cards: Card | Card[]]
  'update:generating': [generating: boolean]
}>()

const generating = ref(false)
const { toast } = useToaster()
type ToastType = 'success' | 'error' | 'info'
const toastQueue = ref<{ message: string, type: ToastType }[]>([])
const isShowingToast = ref(false)
const generationId = ref<string | null>(null)
const canRetry = ref(false)
const error = ref<string | null>(null)
const generatedCards = ref<Card[]>([]) // Store generated cards locally

const progress = ref<GenerationProgress>({
    status: 'preparing',
    cardsGenerated: 0,
    totalCards: 10,
    currentOperation: 'Initializing...',
    error: null
})

const stockNotifications = [
    'Please be patient while we generate your cards...',
    'Our AI is working hard to create the perfect cards for you...',
    'Good things take time - your cards are being crafted with care...',
    'Almost there! We\'re making sure each card is perfect...',
    'We\'re almost done! Just a few more cards to go...',
    'Hey chill out this takes a minute or two...'
]

const showStockNotification = () => {
    if (!generating.value) return
    const randomIndex = Math.floor(Math.random() * stockNotifications.length)
    queueToast(stockNotifications[randomIndex], 'info')
}

// Add beforeunload handler to warn user about navigation
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (generating.value) {
        const message = 'AI generation is in progress. Navigating away will lose all generated content. Are you sure you want to leave?'
        event.preventDefault()
        event.returnValue = message
        return message
    }
}

// Set up beforeunload handler
onMounted(() => {
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    // Check for backup data from previous generation
    checkForBackupData()
})

// Check for backup data and offer recovery
const checkForBackupData = () => {
    try {
        const backupData = sessionStorage.getItem('ai_generation_backup')
        if (backupData) {
            const backup = JSON.parse(backupData)
            const backupAge = Date.now() - backup.timestamp
            const maxAge = 30 * 60 * 1000 // 30 minutes
            
            if (backupAge < maxAge && backup.cards && backup.cards.length > 0) {
                // Offer to restore the backup
                const message = backup.cancelled 
                    ? `We found ${backup.cards.length} previously generated cards that were saved before the generation was cancelled. Would you like to restore them? (This will add them to your current set)`
                    : `We found ${backup.cards.length} previously generated cards that weren't saved. Would you like to restore them? (This will add them to your current set)`
                
                const shouldRestore = confirm(message)
                
                if (shouldRestore) {
                    // Restore the cards
                    backup.cards.forEach((card: Card) => {
                        emit('add-set', card)
                    })
                    
                    // Show success message
                    const successMessage = backup.cancelled
                        ? `Restored ${backup.cards.length} cards from cancelled generation!`
                        : `Restored ${backup.cards.length} previously generated cards!`
                    queueToast(successMessage, 'success')
                    
                    // Clear the backup
                    sessionStorage.removeItem('ai_generation_backup')
                } else {
                    // User chose not to restore, clear the backup
                    sessionStorage.removeItem('ai_generation_backup')
                }
            } else {
                // Backup is too old, clear it
                sessionStorage.removeItem('ai_generation_backup')
            }
        }
    } catch (error) {
        console.error('Error checking backup data:', error)
        // Clear corrupted backup
        sessionStorage.removeItem('ai_generation_backup')
    }
}

const queueToast = (message: string, type: ToastType) => {
    toastQueue.value.push({ message, type })
    if (!isShowingToast.value) {
        showNextToast()
    }
}

const showNextToast = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    if (toastQueue.value.length === 0) {
        isShowingToast.value = false
        return
    }

    isShowingToast.value = true
    const { message, type } = toastQueue.value.shift()!
    toast(message, type)
    
    setTimeout(() => {
        showNextToast()
    }, 3000)
}

const updateProgressUI = (newProgress: GenerationProgress) => {
    switch (newProgress.status) {
        case 'preparing':
            queueToast('Preparing to generate cards...', 'info')
            break
        case 'generating':
            if (newProgress.cardsGenerated > 0) {
                const percentage = Math.round((newProgress.cardsGenerated / newProgress.totalCards) * 100)
                if (percentage % 20 === 0) { // Show percentage every 20%
                    queueToast(`Generating cards... ${percentage}% complete`, 'info')
                }
            }
            if (newProgress.currentOperation) {
                if (newProgress.currentOperation.includes('OpenAI')) {
                    queueToast(newProgress.currentOperation, 'success')
                } else if (newProgress.currentOperation.includes('Processing') || 
                          newProgress.currentOperation.includes('Finalizing')) {
                    queueToast(newProgress.currentOperation, 'info')
                } else {
                    queueToast(newProgress.currentOperation, 'info')
                }
            }
            break
        case 'completed':
            queueToast(`Successfully generated ${newProgress.cardsGenerated} cards!`, 'success')
            break
        case 'failed':
            queueToast(newProgress.error || 'Generation failed', 'error')
            canRetry.value = true
            break
    }
}

const generateSet = async () => {
    const confirmation = await confirm('Are you sure you want to generate a set with AI?')
    if (!confirmation) return
    if (!aiSocketService) {
        throw new Error('AI Socket Service not initialized')
    }

    try {
        // Start showing progress immediately
        generating.value = true
        emit('update:generating', true)
        canRetry.value = false
        error.value = null
        generationId.value = null
        progress.value = {
            status: 'preparing',
            cardsGenerated: 0,
            totalCards: 0,
            currentOperation: 'Connecting to AI service...'
        }

        // Set up socket status and progress callbacks right before generation
        aiSocketService.setStatusCallback((status) => {
            if (status.includes('error') || status.includes('Failed')) {
                queueToast(status, 'error')
                canRetry.value = status.includes('connection') || status.includes('timeout')
            } else if (status.includes('reconnect')) {
                queueToast(status, 'info')
            } else if (status.includes('Connected')) {
                queueToast(status, 'success')
            } else {
                queueToast(status, 'info')
            }
        })

        aiSocketService.setProgressCallback((newProgress) => {
            progress.value = newProgress
            updateProgressUI(newProgress)
        })

        // Initialize socket if not connected
        if (!aiSocketService.connected) {
            queueToast('Connecting to AI service...', 'info')
            // Initialize socket
            aiSocketService.initialize()
            
            // Wait for connection with timeout
            const connectionTimeout = 5000 // 5 seconds
            const startTime = Date.now()
            
            while (!aiSocketService.connected && Date.now() - startTime < connectionTimeout) {
                await new Promise(resolve => setTimeout(resolve, 100))
            }
            
            if (!aiSocketService.connected) {
                throw new Error('Could not establish connection to AI service within timeout')
            }
        }

        queueToast('Starting AI generation...', 'info')
        progress.value = {
            status: 'preparing',
            cardsGenerated: 0,
            totalCards: 0,
            currentOperation: 'Initializing generation...'
        }

        // Start showing stock notifications
        const stockNotificationInterval = setInterval(() => {
            if (generating.value) {
                showStockNotification()
            } else {
                clearInterval(stockNotificationInterval)
            }
        }, 15000) // Show a stock notification every 15 seconds

        const id = await aiSocketService.startGeneration(
            props.title,
            props.description,
            props.category,
            {
                onCardGenerated: handleCardGenerated,
                onComplete: () => {
                    clearInterval(stockNotificationInterval)
                    handleComplete()
                },
                onError: (error) => {
                    clearInterval(stockNotificationInterval)
                    handleError(error)
                }
            }
        )

        if (!id) {
            throw new Error('Failed to start generation - no ID returned')
        }

        generationId.value = id
    } catch (error: any) {
        console.error('Generation error:', error)
        error.value = error.message || 'Failed to start generation'
        generating.value = false
        emit('update:generating', false)
        canRetry.value = true
        queueToast(error.value, 'error')
    }
}

const handleCardGenerated = (card: Card) => {
    console.log('AISetGenerator - Raw generated card:', JSON.stringify(card, null, 2))
    
    // Determine optimal layout based on content for each side
    const frontLayout = determineOptimalLayout(
        card.front.cells?.[0]?.content, // text from first cell
        card.front.cells?.[1]?.mediaUrl || card.front.cells?.[0]?.mediaUrl, // image from any cell
        card.front.layout
    )
    
    const backLayout = determineOptimalLayout(
        card.back.cells?.[0]?.content, // text from first cell
        card.back.cells?.[1]?.mediaUrl || card.back.cells?.[0]?.mediaUrl, // image from any cell
        card.back.layout
    )
    
    // Apply the determined layouts
    const cardWithLayout = {
        ...card,
        front: {
            ...card.front,
            layout: frontLayout
        },
        back: {
            ...card.back,
            layout: backLayout
        }
    }
    
    console.log('AISetGenerator - Processed card with smart layout:', JSON.stringify(cardWithLayout, null, 2))
    
    // Store card locally for backup
    generatedCards.value.push(cardWithLayout)
    
    // Emit the card to be added to the set immediately
    emit('add-set', cardWithLayout)
    
    // Show toast for each card
    queueToast(`Generated card ${progress.value.cardsGenerated} of ${progress.value.totalCards}`, 'info')
}

const handleComplete = () => {
    generating.value = false
    emit('update:generating', false)
    progress.value = {
        ...progress.value,
        status: 'completed'
    }
    
    // Clear backup data since generation completed successfully
    sessionStorage.removeItem('ai_generation_backup')
    
    // Final completion toast
    queueToast(`Successfully generated ${progress.value.cardsGenerated} cards!`, 'success')
}

const handleError = (error: string) => {
    console.error('Generation error:', error)
    
    // Check if this is a cancellation
    const isCancellation = error.includes('cancelled') || error.includes('Cancelled')
    
    if (isCancellation) {
        console.log('Generation was cancelled - this is expected when navigating away')
        generating.value = false
        emit('update:generating', false)
        // Don't show error toast for cancellations
        // Don't set canRetry for cancellations
    } else {
        queueToast(error, 'error')
        generating.value = false
        emit('update:generating', false)
        canRetry.value = error.includes('connection') || error.includes('timeout')
    }
    
    progress.value = {
        ...progress.value,
        status: 'failed',
        error
    }
    
    // Clear backup data on error (but not on cancellation)
    if (!isCancellation) {
        sessionStorage.removeItem('ai_generation_backup')
    }
}

// Clean up socket connection when component is unmounted
onUnmounted(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
    
    // If generation is still active, save any generated cards immediately
    if (generating.value && generationId.value) {
        console.warn('User navigated away during generation - saving generated cards and cancelling backend')
        
        // Store generated cards in sessionStorage for potential recovery
        if (generatedCards.value.length > 0) {
            try {
                sessionStorage.setItem('ai_generation_backup', JSON.stringify({
                    generationId: generationId.value,
                    cards: generatedCards.value,
                    timestamp: Date.now(),
                    title: props.title,
                    description: props.description,
                    category: props.category,
                    cancelled: true // Mark as cancelled since backend will be stopped
                }))
                console.log(`Saved ${generatedCards.value.length} generated cards to sessionStorage before cancellation`)
            } catch (error) {
                console.error('Failed to save generation backup:', error)
            }
        }
        
        // Disconnect socket to trigger backend cancellation
        aiSocketService.disconnect()
    } else if (generationId.value) {
        // Only disconnect if generation is complete or failed
        aiSocketService.disconnect()
    }
})
</script>

<style scoped>
.generation-status {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.button {
    min-width: 120px;
}

.ai-generating {
  position: relative;
  z-index: 1;
  background: transparent;
  background-size: 400% 400%;
  animation: ai-gradient-move 2s linear infinite;
  color: #fff;
  border: 3px solid transparent;
  border-radius: var(--radius-lg);
  box-shadow: 0 0 0 3px rgba(80, 143, 255, 0.2);
  overflow: hidden;
}
.ai-generating:before {
  content: '';
  position: absolute;
  z-index: -1;
  top: -3px; left: -3px; right: -3px; bottom: -3px;
  border-radius: 12px;
  background: linear-gradient(90deg, #16181c, #340c69, #ff6bcb, #127834, #079b80, #4f8cff);
  background-size: 800% 400%;
  animation: ai-border-move 5s linear infinite;
  filter: blur(1px);
}
@keyframes ai-gradient-move {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes ai-border-move {
  0% { background-position: 100% 0%; }
  50% { background-position: 0% 100%; }
  100% { background-position: 100% 0%; }
}
.ai-generating span {
  position: relative;
  z-index: 2;
  background: none;
  color: #fff;
  font-weight: bold;
  letter-spacing: 0.03em;
}

.ai-progress-bar-fixed {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 14px;
  background: #cc9b30;
  z-index: 9999;
  width: 100vw;
  pointer-events: none;margin: 0 auto;
  margin: 0 auto;
}
.ai-progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #4b4b4b, #4b4b4b, #4b4b4b, #4b4b4b, #4b4b4b, #4b4b4b);
  border-radius: 2px;
  transition: width 0.3s cubic-bezier(0.4,0,0.2,1);
  box-shadow: 0 0 8px 0 #4f8cff33;
}
.ai-progress-bar-indeterminate {
  height: 100%;
  width: 30vw;
  min-width: 80px;
  max-width: 90%;
  background: linear-gradient(90deg, #4b4b4b, #4b4b4b, #4b4b4b, #4b4b4b, #4b4b4b, #4b4b4b);
  border-radius: 2px;
  animation: ai-progress-indeterminate 20s linear infinite;
  box-shadow: 0 0 8px 0 #4f8cff33;
}
@keyframes ai-progress-indeterminate {
  0% { margin-left: -30vw; }
  100% { margin-left: 100vw; }
}
</style> 