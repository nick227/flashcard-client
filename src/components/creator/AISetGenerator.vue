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

// Set up socket status and progress callbacks
onMounted(() => {
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
})

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
    if (!aiSocketService) {
        throw new Error('AI Socket Service not initialized')
    }

    try {
        // Ensure socket is connected
        if (!aiSocketService.connected) {
            queueToast('Connecting to AI service...', 'info')
            // Wait a bit for connection
            await new Promise(resolve => setTimeout(resolve, 1000))
            if (!aiSocketService.connected) {
                throw new Error('Could not establish connection to AI service')
            }
        }

        queueToast('Starting AI generation...', 'info')
        generating.value = true
        emit('update:generating', true)
        canRetry.value = false
        error.value = null
        generationId.value = null
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
    // Update progress first
    progress.value = {
        ...progress.value,
        cardsGenerated: progress.value.cardsGenerated + 1,
        currentOperation: `Generated ${progress.value.cardsGenerated + 1} of ${progress.value.totalCards} cards`
    }
    
    // Emit the card to be added to the set immediately
    emit('add-set', card)
    
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
    // Final completion toast
    queueToast(`Successfully generated ${progress.value.cardsGenerated} cards!`, 'success')
}

const handleError = (error: string) => {
    console.error('Generation error:', error)
    queueToast(error, 'error')
    generating.value = false
    emit('update:generating', false)
    canRetry.value = error.includes('connection') || error.includes('timeout')
    progress.value = {
        ...progress.value,
        status: 'failed',
        error
    }
}

// Clean up socket connection when component is unmounted
onUnmounted(() => {
    if (generationId.value) {
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
  border-radius: 8px;
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