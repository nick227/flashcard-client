<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <Toaster :toasts="toasts" @remove="id => toasts.splice(toasts.findIndex(t => t.id === id), 1)" />

    <main class="container flex-1">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-3xl font-bold flex w-full items-center justify-center cursive">{{ setId ? 'Edit Set' : 'Create Set' }}</h2>
      </div>

      <!-- Set Info Form -->
      <div class="bg-white rounded-xl shadow p-8 mb-8">
        <SetInfoForm :title="title" :description="description" :category="category" :tags="setTags" :price="setPrice"
          :categories="categories" :availableTags="availableTags" :thumbnail="setThumbnail" :setId="setId || 0"
          :isSubmitting="submitting" :formSubmitted="formSubmitted" @update:title="title = $event"
          @update:description="description = $event" @update:category="category = $event"
          @update:tags="setTags = $event" @update:price="setPrice = $event" @update:thumbnail="handleThumbnailUpdate" />
        <div class="flex flex-wrap items-center gap-6 mb-8">
          <!-- View Toggle -->
          <ViewToggle v-model="viewMode" />
          <div class="flex flex-wrap items-center gap-2 mt-4 mb-4">
            <!-- Reverse Cards Button -->
            <button title="Reverse Card Order" class="button px-3 py-1 text-sm rounded-md bg-gray-100 text-gray-600"
              @click="reverseCards" :disabled="!hasCards">
              <i class="fa-solid fa-arrows-up-down"></i>
            </button>
            <!-- Card Count Indicator -->
            <CardCountIndicator :count="cards.length" />
            <!-- Import Bar -->
            <ImportBar :importFileName="importFileName" @import-csv="onImportCsv" />
            <button class="button px-3 py-1 text-sm rounded-md bg-gray-100 text-gray-600 button-danger" @click="onReset"
              :disabled="!hasCards">Reset</button>
          </div>
          <div class="flex items-center justify-end gap-2 flex-nowrap button-row">
            <AISetGenerator :disabled="isAIGeneratorDisabled" :title="title" :description="description"
              :category="selectedCategoryName" @add-set="onAddSet" @update:generating="setGenerating = $event" />
            <AddCardButton :disabled="isAddCardDisabled" :class="{ 'input-error': cardsTouched && cards.length === 0 }"
              @add-card="onAddCard" />
            <!-- Submit button -->
            <button class="button button-success" :disabled="isSubmitDisabled" @click="onSubmit"
              :title="getSubmitButtonTitle">
              {{ submitButtonText }}
            </button>
          </div>
        </div>
        <div>
          <DraggableCardList v-if="viewMode === 'grid'" :cards="cards" :cardComponent="CardTile" layout="grid"
            @update-order="onUpdateOrder" @delete-card="onDeleteCard" @edit-card="onEditCard"
            @request-delete="onRequestDelete" />
          <DraggableCardList v-else :cards="cards" :cardComponent="CardFullView" layout="list"
            :cardProps="{ mode: 'single', autoFocus: false, autoFocusId: cards.length ? cards[0].id : null, title: title, description: description, category: selectedCategoryName }"
            @update-order="onUpdateOrder" @delete-card="onDeleteCard" @edit-card="onEditCard"
            @request-delete="onRequestDelete" />
        </div>
      </div>
      <!-- submit row -->
      <div class="flex flex-wrap items-center gap-6 mb-8 justify-between align-middle">
      </div>
      <ConfirmDialog v-model="confirmVisible" title="Delete Everything?" :text="confirmMessage" @confirm="onConfirm" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { CardView, CardLayout } from '@/types/card'
import ImportBar from '@/components/creator/ImportBar.vue'
import SetInfoForm from '@/components/creator/SetInfoForm.vue'
import ViewToggle from '@/components/creator/ViewToggle.vue'
import CardCountIndicator from '@/components/creator/CardCountIndicator.vue'
import AddCardButton from '@/components/creator/AddCardButton.vue'
import AISetGenerator from '@/components/creator/AISetGenerator.vue'
import DraggableCardList from '@/components/creator/DraggableCardList.vue'
import CardTile from '@/components/creator/CardTile.vue'
import CardFullView from '@/components/creator/CardFullView.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import Toaster from '@/components/common/Toaster.vue'
import { useToaster } from '@/composables/useToaster'
import { useSetForm } from '@/composables/useSetForm'
import { useSetWizardStorage } from '@/composables/useSetWizardStorage.ts'
import { useHistory, type HistoryState } from '@/composables/useHistory.ts'
import { parseFlashCardCsv, type ParsedCard } from '@/utils/csv.ts'
import { fetchCategories, fetchTags } from '@/api/index'
import { SetService } from '@/services/SetService'

const router = useRouter()
const route = useRoute()
const { toasts, toast } = useToaster()
const viewMode = ref<'grid' | 'single'>('single')
const importFileName = ref<string | null>(null)
const confirmMessage = ref('')
const confirmVisible = ref(false)
const categories = ref<{ id: number, name: string }[]>([])
const availableTags = ref<string[]>([])
const cardToDelete = ref<number | null>(null)
const submitting = ref(false)
const setId = computed(() => Number(route.params.setId) || 0)
const submitButtonText = computed(() => setId.value ? 'Save Changes' : 'Submit Set')
const hasCards = computed(() => cards.value.length > 0)

const {
  title,
  description,
  category,
  setTags,
  setPrice,
  thumbnailFile,
  setThumbnail,
  cards,
  formSubmitted,
  cardsTouched,
  hasBlankCard,
  validateForm,
  resetForm,
  addCard,
  updateCard,
  deleteCard,
  updateOrder,
  setGenerating
} = useSetForm()

const {
  saveProgress,
  clearProgress,
  loadProgress
} = useSetWizardStorage()

const {
  history,
  pushToHistory,
  undo,
  redo,
  clearHistory
} = useHistory()

const selectedCategoryName = computed(() => {
  const cat = categories.value.find(c => c.id === category.value)
  return cat ? cat.name : ''
})

// Save progress whenever form state changes
watch(
  [
    title,
    description,
    category,
    setTags,
    setPrice,
    setThumbnail,
    cards
  ],
  () => {
    if (setId.value) return // Don't save progress for existing sets
    saveProgress({
      title: title.value,
      description: description.value,
      categoryId: category.value,
      tags: setTags.value,
      price: setPrice.value,
      thumbnail: setThumbnail.value,
      cards: cards.value
    })
  },
  { deep: true }
)

// Computed properties for button states
const isAIGeneratorDisabled = computed(() => {
  return setGenerating.value || !title.value || !description.value || !category.value
})

const isAddCardDisabled = computed(() => {
  return hasBlankCard.value
})

const isSubmitDisabled = computed(() => {
  return submitting.value ||
    setGenerating.value ||
    !title.value ||
    !description.value ||
    !category.value ||
    !hasCards.value
})

const handleThumbnailUpdate = (thumbnail: string | File | null) => {
  if (thumbnail instanceof File) {
    // For new file uploads
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64Data = e.target?.result as string
      setThumbnail.value = URL.createObjectURL(thumbnail)
      // Store both the preview URL and the file data
      saveProgress({
        title: title.value,
        description: description.value,
        categoryId: category.value,
        tags: setTags.value,
        price: setPrice.value,
        thumbnail: setThumbnail.value,
        thumbnailFile: {
          data: base64Data,
          type: thumbnail.type,
          name: thumbnail.name
        },
        cards: cards.value
      })
    }
    reader.readAsDataURL(thumbnail)
  } else if (typeof thumbnail === 'string' && thumbnail.startsWith('data:')) {
    // For base64 data (from storage)
    setThumbnail.value = thumbnail
    saveProgress({
      title: title.value,
      description: description.value,
      categoryId: category.value,
      tags: setTags.value,
      price: setPrice.value,
      thumbnail: setThumbnail.value,
      thumbnailFile: null,
      cards: cards.value
    })
  } else {
    // For URLs (from server or AI generation)
    setThumbnail.value = thumbnail
    saveProgress({
      title: title.value,
      description: description.value,
      categoryId: category.value,
      tags: setTags.value,
      price: setPrice.value,
      thumbnail: setThumbnail.value,
      thumbnailFile: null,
      cards: cards.value
    })
  }
}

// Add keyboard shortcut handling
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.ctrlKey || e.metaKey) { // metaKey for Mac
    if (e.key === 'z') {
      e.preventDefault()
      if (e.shiftKey) {
        // Ctrl+Shift+Z or Cmd+Shift+Z for redo
        const state = redo()
        if (state) {
          applyHistoryState(state)
        }
      } else {
        // Ctrl+Z or Cmd+Z for undo
        const state = undo()
        if (state) {
          applyHistoryState(state)
        }
      }
    } else if (e.key === 'y') {
      // Ctrl+Y or Cmd+Y for redo (alternative)
      e.preventDefault()
      const state = redo()
      if (state) {
        applyHistoryState(state)
      }
    }
  }
}

// History management
function takeSnapshot() {
  pushToHistory({
    title: title.value,
    description: description.value,
    categoryId: category.value || 0,
    tags: setTags.value,
    price: setPrice.value,
    cards: cards.value
  })
}

function applyHistoryState(state: HistoryState) {
  title.value = state.title
  description.value = state.description
  category.value = state.categoryId || 0
  setTags.value = state.tags
  setPrice.value = state.price
  cards.value = state.cards
  cardsTouched.value = true
}

// Load saved progress on mount
onMounted(async () => {
  const progress = loadProgress()
  if (progress) {
    title.value = progress.title
    description.value = progress.description
    category.value = progress.categoryId || 0
    setTags.value = progress.tags
    setPrice.value = progress.price
    cards.value = progress.cards

    // Handle thumbnail restoration
    if (progress.thumbnailFile) {
      // Convert base64 back to File object
      const response = await fetch(progress.thumbnailFile.data)
      const blob = await response.blob()
      const file = new File([blob], progress.thumbnailFile.name, { type: progress.thumbnailFile.type })
      setThumbnail.value = URL.createObjectURL(file)
    } else {
      setThumbnail.value = progress.thumbnail
    }
  }

  // Load set data if editing
  if (setId.value) {
    try {
      const setData = await SetService.fetchSet(setId.value)
      title.value = setData.title
      description.value = setData.description
      category.value = setData.categoryId || 0
      setTags.value = setData.tags
      // Ensure price is in the correct format
      setPrice.value = {
        type: setData.isSubscriberOnly ? 'subscribers' : (setData.price > 0 ? 'premium' : 'free'),
        amount: setData.price > 0 ? setData.price : undefined
      }
      setThumbnail.value = setData.thumbnail

      const setCards = await SetService.fetchSetCards(setData.id)
      cards.value = setCards
    } catch (error) {
      toast('Error loading set: ' + error, 'error')
    }
  }

  // Load categories and tags
  try {
    const [categoriesData, tagsData] = await Promise.all([
      fetchCategories(),
      fetchTags()
    ])
    categories.value = categoriesData
    availableTags.value = tagsData
  } catch (error) {
    toast('Error loading categories and tags: ' + error, 'error')
  }

  // Add keyboard shortcut listeners
  window.addEventListener('keydown', handleKeyDown)
})

function onAddCard() {
  if (hasBlankCard.value) return
  addCard()
  takeSnapshot()
}

function onUpdateOrder(newOrder: CardView[]) {
  updateOrder(newOrder)
}

function onDeleteCard(index: number) {
  deleteCard(index)
  takeSnapshot()
}

function onEditCard(updatedCard: CardView) {
  updateCard(updatedCard)
}

function onRequestDelete(cardId: number) {
  cardToDelete.value = cardId
  confirmMessage.value = 'Are you sure you want to delete this card?'
  confirmVisible.value = true
}

function resetAllState() {
  // Clear progress and history using composable functions
  clearProgress()
  clearHistory()
  
  // Reset form state
  resetForm()
  
  // Reset UI state
  cardsTouched.value = false
  importFileName.value = null
  viewMode.value = 'single'
  
  // Reset thumbnail - ensure complete reset
  setThumbnail.value = null
  thumbnailFile.value = null
  // Force thumbnail update to trigger UI reset
  handleThumbnailUpdate(null)
  
  // Force history state to be empty
  history.value = []
  
  // Reset submission state
  submitting.value = false
  formSubmitted.value = false
  setGenerating.value = false

  // Reset form values directly
  title.value = ''
  description.value = ''
  category.value = 0
  setTags.value = []
  setPrice.value = { type: 'free', amount: 0 }
  cards.value = []

  // Clear both storage locations
  localStorage.removeItem('setWizardProgress')
  localStorage.removeItem('setWizardHistory')

  // Force a page reload to ensure clean state
  setTimeout(() => {
    window.location.reload()
  }, 300)
}

function onReset() {
  confirmMessage.value = 'Are you sure you want to reset everything? This will clear all cards, form data, and cannot be undone.'
  confirmVisible.value = true
  cardToDelete.value = -1 // Special value to indicate reset
}

function onConfirm() {
  if (cardToDelete.value === -1) {
    // Full reset
    resetAllState()
    toast('Set has been reset', 'success')
  } else if (cardToDelete.value !== null) {
    // Single card deletion
    const index = cards.value.findIndex(c => c.id === cardToDelete.value)
    if (index !== -1) {
      cards.value.splice(index, 1)
      cardsTouched.value = true
      toast('Card deleted', 'success')
    }
  }
  
  // Reset confirmation state
  cardToDelete.value = null
  confirmVisible.value = false
}

function reverseCards() {
  cards.value.reverse()
}

async function onImportCsv(file: File) {
  try {
    const text = await file.text()
    const cardsData = await parseFlashCardCsv(text)
    const parsedCards = cardsData.map((card: ParsedCard) => ({
      id: Date.now() + Math.random(),
      setId: 0,
      front: {
        text: card.front,
        imageUrl: card.frontImage,
        layout: 'default' as CardLayout
      },
      back: {
        text: card.back,
        imageUrl: card.backImage,
        layout: 'default' as CardLayout
      },
      hint: card.hint || null
    }))
    cards.value = parsedCards
    cardsTouched.value = true
    importFileName.value = file.name
  } catch (error) {
    toast('Error importing CSV: ' + error, 'error')
  }
}

function onAddSet(newCards: CardView | CardView[]) {
  const cardsToAdd = Array.isArray(newCards) ? newCards : [newCards]
  // Set default layout for AI-generated cards
  const processedCards = cardsToAdd.map(card => ({
    ...card,
    front: {
      ...card.front,
      layout: 'default' as CardLayout
    },
    back: {
      ...card.back,
      layout: 'default' as CardLayout
    }
  }))
  cards.value.push(...processedCards)
  cardsTouched.value = true
}

async function onSubmit() {
  const validation = validateForm()
  if (!validation.isValid) {
    toast(validation.error || 'Validation failed', 'error')
    return
  }

  submitting.value = true
  try {
    const formData = new FormData()
    formData.append('title', title.value)
    formData.append('description', description.value)
    formData.append('categoryId', category.value.toString())
    formData.append('tags', JSON.stringify(setTags.value))
    formData.append('price', setPrice.value.type === 'free' ? '0' : (setPrice.value.amount?.toString() || '0'))
    formData.append('isSubscriberOnly', setPrice.value.type === 'subscribers' ? 'true' : 'false')
    

    // Handle thumbnail
    if (setThumbnail.value) {
      if (setThumbnail.value.startsWith('data:')) {
        // Convert base64 to file
        const response = await fetch(setThumbnail.value)
        const blob = await response.blob()
        const file = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' })
        formData.append('thumbnail', file)
      } else {
        // Use existing URL
        formData.append('thumbnailUrl', setThumbnail.value)
      }
    }

    // Transform cards to match server's expected format
    const cardsData = cards.value.map(card => ({
      front: {
        text: card.front.text || '',
        imageUrl: card.front.imageUrl || null,
        layout: card.front.layout || 'default' // Use front layout
      },
      back: {
        text: card.back.text || '',
        imageUrl: card.back.imageUrl || null,
        layout: card.back.layout || 'default' // Use back layout
      },
      hint: card.hint || null
    }))

    // Add cards as a single JSON string
    formData.append('cards', JSON.stringify(cardsData))

    // Log the form data
    console.log('Form Data Contents:')
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value)
    }

    console.log('Cards Data:', cardsData)
    console.log('Stringified Cards:', JSON.stringify(cardsData))

    if (setId.value) {
      console.log('Updating set:', setId.value)
      const response = await SetService.updateSet(setId.value, formData)
      console.log('Update Response:', response)
      toast('Set updated successfully', 'success')
      router.push(`/sets/${setId.value}`)
    } else {
      console.log('Creating new set')
      const response = await SetService.createSet(formData)
      console.log('Create Response:', response)

      // Check for the response structure we see in the logs
      if (response && typeof response === 'object' && 'id' in response) {
        const setId = response.id
        console.log('Navigating to set:', setId)
        toast('Set created successfully', 'success')

        // Clear storage and history after successful submission
        clearProgress()
        clearHistory()

        router.push(`/sets/${setId}`)
      } else {
        console.error('Invalid response structure:', response)
        throw new Error('Invalid response from server: missing set ID')
      }
    }
  } catch (error: unknown) {
    console.error('Error saving set:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      response: error && typeof error === 'object' && 'response' in error
        ? (error.response as any)?.data
        : undefined
    })
    toast('Error saving set: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error')
  } finally {
    submitting.value = false
  }
}

// Add a computed property for the submit button title
const getSubmitButtonTitle = computed(() => {
  if (setGenerating.value) return 'Please wait for AI generation to complete'
  if (!title.value) return 'Title is required'
  if (!description.value) return 'Description is required'
  if (!category.value) return 'Category is required'
  if (!hasCards.value) return 'At least one card is required'
  if (submitting.value) return 'Submitting...'
  return 'Submit Set'
})

// Add watch for cards changes
watch(cards, (newCards) => {
  console.log('SetWizard - Cards updated:', newCards)
}, { deep: true })

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
/* Existing styles ... */

.button-row {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
}

@media (max-width: 600px) {
  .button-row {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .flex.flex-wrap.items-center.gap-6.mb-8 {
    flex-direction: column !important;
  }

  .button-row .button,
  .generation-status {
    font-size: 0.85rem;
    width: 100% !important;
  }

  .p-8 {
    padding: 0.5rem !important;
  }
}

/* Further mobile enhancements */
@media (max-width: 400px) {
  .button-row .button {
    font-size: 0.75rem;
    padding: 0.2em 0.5em;
  }
}
</style>