<template>
  <div class="min-h-screen">
    <Toaster :toasts="toasts" @remove="id => toasts.splice(toasts.findIndex(t => t.id === id), 1)" />

    <main class="container-main  flex-1">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-3xl font-bold flex w-full items-center justify-center cursive">{{ setId ? 'Edit Set' : 'Create Set' }}</h2>
      </div>

      <!-- Set Info Form -->
      <div class="bg-white p-8 mb-8">
        <SetInfoForm :title="title" :description="description" :category="category" :tags="setTags" :price="setPrice"
          :categories="categories" :availableTags="availableTags" :thumbnail="setThumbnail" :setId="setId || 0"
          :isSubmitting="isSubmitting" :formSubmitted="formSubmitted" @update:title="title = $event"
          @update:description="description = $event" @update:category="category = $event"
          @update:tags="setTags = $event" @update:price="setPrice = $event" @update:thumbnail="handleThumbnailUpdate" />
        <div class="flex flex-wrap items-center gap-6 mb-8">
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
            <button class="button px-3 py-1 text-sm rounded-md bg-gray-100 text-gray-600 button-danger" @click="onReset">Reset</button>
          </div>
          <div class="flex items-center justify-end gap-2 flex-nowrap button-row">
            <AISetGenerator :disabled="isAIGeneratorDisabled" :title="title" :description="description"
              :category="selectedCategoryName" @add-set="onAddSet" @update:generating="setGenerating = $event" />
            <AddCardButton :class="{ 'input-error': cardsTouched && cards.length === 0 }"
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
            @update-order="updateOrder" @delete-card="onDeleteCard" @edit-card="onEditCard"
            @request-delete="onRequestDelete" />
          <DraggableCardList v-else :cards="cards" :cardComponent="CardFullView" layout="list"
            :cardProps="{ mode: 'single', autoFocus: false, autoFocusId: cards.length ? cards[0].id : null, title: title, description: description, category: selectedCategoryName, onImageFile }"
            @update-order="updateOrder" @delete-card="onDeleteCard" @edit-card="onEditCard"
            @request-delete="onRequestDelete" />
        </div>
      </div>
      <!-- submit row -->
      <div class="flex flex-wrap items-center gap-6 mb-8 justify-between align-middle">
      </div>
      <ConfirmDialog v-model="confirmVisible" :title="confirmTitle" :text="confirmMessage" @confirm="onConfirm" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import type { Card, CardLayout } from '@/types/card'
import ImportBar from '@/components/creator/ImportBar.vue'
import SetInfoForm from '@/components/creator/SetInfoForm.vue'
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
import { useSetSubmission } from '@/composables/useSetSubmission'
import { useFormValidation } from '@/composables/useFormValidation'

const route = useRoute()
const { toasts, toast } = useToaster()
const viewMode = ref<'grid' | 'single'>('single')
const importFileName = ref<string | null>(null)
const confirmMessage = ref('')
const confirmTitle = ref('')
const confirmVisible = ref(false)
const categories = ref<{ id: number, name: string }[]>([])
const availableTags = ref<string[]>([])
const cardToDelete = ref<number | null>(null)
const setId = computed(() => Number(route.params.setId) || 0)
const submitButtonText = computed(() => setId.value ? 'Save Changes' : 'Submit Set')
const hasCards = computed(() => cards.value.length > 0)

// Track pending image files for upload during submission
const pendingImageFiles = ref<Map<string, File>>(new Map())

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
  addCard,
  deleteCard,
  updateOrder,
  setGenerating
} = useSetForm()

const {
  saveProgress,
  clearProgress,
  loadProgress,
  markAsSubmitted,
  hasUnsubmittedProgress
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
    
    // Convert pending image files to base64 for storage
    const cardImageFiles: { [key: string]: { data: string, type: string, name: string } } = {}
    
    // Note: We can't convert File objects to base64 in a watch function
    // The actual conversion happens in onImageFile when files are added
    // Here we just save the current state without the file data
    
    saveProgress({
      title: title.value,
      description: description.value,
      categoryId: category.value,
      tags: setTags.value,
      price: setPrice.value,
      thumbnail: setThumbnail.value,
      cards: cards.value,
      cardImageFiles
    })
  },
  { deep: true }
)

// Computed properties for button states
const isAIGeneratorDisabled = computed(() => {
  return setGenerating.value || !title.value || !description.value || !category.value
})

const isSubmitDisabled = computed(() => {
  return isSubmitting.value ||
    setGenerating.value ||
    !title.value ||
    !description.value ||
    !category.value ||
    !hasCards.value ||
    !setThumbnail.value
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
  // Check for unsubmitted progress first
  if (hasUnsubmittedProgress()) {
    toast('Work in progress found. Your previous set data has been restored.', 'info')
  }

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
    
    // Handle card image files restoration
    if (progress.cardImageFiles) {
      for (const [key, fileData] of Object.entries(progress.cardImageFiles)) {
        try {
          // Convert base64 back to File object
          const response = await fetch(fileData.data)
          const blob = await response.blob()
          const file = new File([blob], fileData.name, { type: fileData.type })
          
          // Add to pending files
          pendingImageFiles.value.set(key, file)
          
          // Create blob URL for preview
          const blobUrl = URL.createObjectURL(file)
          
          // Update the corresponding card side's mediaUrl directly
          const [side, cellIndexStr] = key.split('_')
          const cellIndex = parseInt(cellIndexStr)
          
          if (cards.value[cellIndex]) {
            const card = cards.value[cellIndex]
            const sideData = side === 'front' ? card.front : card.back
            
            if (sideData.mediaUrl) {
              sideData.mediaUrl = blobUrl
            }
          }
        } catch (error) {
          console.error('Error restoring card image file:', key, error)
        }
      }
    }
  }

  // Load categories and tags
  try {
    const [categoriesData, tagsData] = await Promise.all([
      fetchCategories(),
      fetchTags()
    ])
    categories.value = categoriesData
    availableTags.value = tagsData.map(tag => tag.name)
  } catch (error) {
    toast('Error loading categories and tags: ' + error, 'error')
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
        type: setData.isSubscriberOnly ? 'subscribers' : (Number(setData.price) > 0 ? 'premium' : 'free'),
        amount: Number(setData.price) > 0 ? Number(setData.price) : undefined
      }
      setThumbnail.value = setData.thumbnail

      // Transform cards from setData directly instead of making another API call
      if (setData.cards && Array.isArray(setData.cards)) {
        cards.value = setData.cards.map((card: any) => SetService.transformCard(card))
      } else {
        cards.value = []
      }
    } catch (error) {
      toast('Error loading set: ' + error, 'error')
    }
  }

  // Add keyboard shortcut listeners
  window.addEventListener('keydown', handleKeyDown)
})

function onAddCard() {
  addCard()
  takeSnapshot()
}

function onDeleteCard(index: number) {
  deleteCard(index)
  takeSnapshot()
}

function onEditCard(updatedCard: Card) {
  const index = cards.value.findIndex(c => c.id === updatedCard.id)
  if (index !== -1) {
    let merged = { ...cards.value[index] }
    if (updatedCard.front) {
      merged.front = { ...merged.front, ...updatedCard.front }
    }
    if (updatedCard.back) {
      merged.back = { ...merged.back, ...updatedCard.back }
    }
    cards.value.splice(index, 1, merged)
    cardsTouched.value = true
    saveProgress({
      title: title.value,
      description: description.value,
      categoryId: category.value,
      tags: setTags.value,
      price: setPrice.value,
      thumbnail: setThumbnail.value,
      cards: cards.value,
      cardImageFiles: {} // Will be populated by onImageFile when files are added
    })
  }
}

// Handle image file events from CardContent components
function onImageFile(data: { file: File, side: 'front' | 'back', cellIndex: number, base64: string }) {
  const key = `${data.side}_${data.cellIndex}`
  pendingImageFiles.value.set(key, data.file)

  // Store base64 in localStorage for persistence
  const currentProgress = {
    title: title.value,
    description: description.value,
    categoryId: category.value,
    tags: setTags.value,
    price: setPrice.value,
    thumbnail: setThumbnail.value,
    cards: cards.value,
    cardImageFiles: {
      [key]: {
        data: data.base64,
        type: data.file.type,
        name: data.file.name
      }
    }
  }

  // Merge with existing card image files
  const existingProgress = loadProgress()
  if (existingProgress?.cardImageFiles) {
    currentProgress.cardImageFiles = {
      ...existingProgress.cardImageFiles,
      ...currentProgress.cardImageFiles
    }
  }

  saveProgress(currentProgress)
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
  isSubmitting.value = false
  formSubmitted.value = false
  setGenerating.value = false

  // Reset form values directly
  title.value = ''
  description.value = ''
  category.value = 0
  setTags.value = []
  setPrice.value = { type: 'free' }
  cards.value = []

  // Clear both storage locations
  localStorage.removeItem('setWizardProgress')
  localStorage.removeItem('setWizardHistory')

  toast('Set has been reset. You can now start fresh.', 'success')
}

function onReset() {
  confirmTitle.value = 'Delete Cards?'
  confirmMessage.value = 'This will clear all card and cannot be undone.'
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
    const parsedCards = cardsData.map((card: ParsedCard) => {
      return {
        id: Date.now() + Math.random(),
        title: '',
        description: '',
        front: { layout: (card.frontLayout || 'default') as CardLayout, content: card.front || '', mediaUrl: card.frontImage || null },
        back: { layout: (card.backLayout || 'default') as CardLayout, content: card.back || '', mediaUrl: card.backImage || null },
        hint: card.hint || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        reviewCount: 0,
        difficulty: 0,
        isArchived: false,
        isPublic: false,
        userId: '',
        deckId: ''
      }
    })
    cards.value = parsedCards
    cardsTouched.value = true
    importFileName.value = file.name
  } catch (error) {
    toast('Error importing CSV: ' + error, 'error')
  }
}

function onAddSet(newCards: Card | Card[]) {
  const cardsToAdd = Array.isArray(newCards) ? newCards : [newCards]
  cards.value.push(...cardsToAdd)
  cardsTouched.value = true
}

// Initialize composables
const { isSubmitting, submitSet, navigateToSet } = useSetSubmission()

// Create reactive form data for validation
const formDataForValidation = computed(() => ({
  title: title.value,
  description: description.value,
  category: category.value,
  thumbnail: setThumbnail.value,
  cards: cards.value,
  setGenerating: setGenerating.value,
  isSubmitting: isSubmitting.value
}))

const { validateForm, getSubmitButtonTitle } = useFormValidation(formDataForValidation)

// Replace the existing onSubmit function
async function onSubmit() {
  const validation = validateForm()
  if (!validation.isValid) {
    toast(validation.error || 'Validation failed', 'error')
    return
  }

  try {

    const submissionData = {
      title: title.value,
      description: description.value,
      category: category.value,
      tags: setTags.value,
      price: setPrice.value,
      thumbnail: setThumbnail.value,
      thumbnailFile: thumbnailFile.value,
      cards: cards.value,
      pendingImageFiles: pendingImageFiles.value
    }

    const newSetId = await submitSet(submissionData, setId.value)
    
    // Mark as submitted and clear progress after successful submission
    markAsSubmitted()
    clearProgress()
    clearCardImageFilesFromStorage()
    //1 second delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    navigateToSet(newSetId)
  } catch (error: unknown) {
    toast('Error saving set: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error')
  }
}

// Update the watch for cards to ensure changes are saved
watch(
  cards,
  (newCards) => {
    if (!setId.value) { // Only save progress for new sets
      saveProgress({
        title: title.value,
        description: description.value,
        categoryId: category.value,
        tags: setTags.value,
        price: setPrice.value,
        thumbnail: setThumbnail.value,
        cards: newCards,
        cardImageFiles: {} // Will be populated by onImageFile when files are added
      })
    }
  },
  { deep: true }
)

// After successful set submission, clear cardImageFiles from localStorage
function clearCardImageFilesFromStorage() {
  const progress = loadProgress()
  if (progress) {
    progress.cardImageFiles = {}
    saveProgress(progress)
  }
}

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