<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <Toaster 
      :toasts="toasts"
      @remove="id => toasts.splice(toasts.findIndex(t => t.id === id), 1)" 
    />
    
    <main class="container flex-1">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-3xl font-bold flex w-full items-center justify-center cursive">{{ setId ? 'Edit Set' : 'Create Set' }}</h2>
      </div>

      <!-- Set Info Form -->
      <div class="bg-white rounded-xl shadow p-8 mb-8">
        <SetInfoForm 
          :title="setTitle" 
          :description="setDescription" 
          :category="setCategoryId" 
          :tags="setTags"
          :price="setPrice"
          :categories="categories"
          :availableTags="availableTags"
          :thumbnail="setThumbnail"
          :setId="setId || 0"
          :isSubmitting="submitting"
          :formSubmitted="formSubmitted"
          @update:title="setTitle = $event"
          @update:description="setDescription = $event"
          @update:category="setCategoryId = $event"
          @update:tags="setTags = $event"
          @update:price="setPrice = $event"
          @update:thumbnail="handleThumbnailUpdate"
        />
        <div class="flex flex-wrap items-center gap-6 mb-8">
          <!-- View Toggle -->
          <ViewToggle v-model="viewMode" />
          <div class="flex flex-wrap items-center gap-2 mt-4 mb-4">
          <!-- Reverse Cards Button -->
          <button title="Reverse Card Order" class="button px-3 py-1 text-sm rounded-md bg-gray-100 text-gray-600" @click="reverseCards" :disabled="!hasCards">
            <i class="fa-solid fa-arrows-up-down"></i>
          </button>
          <!-- Card Count Indicator -->
          <CardCountIndicator :count="cards.length" />
          <!-- Import Bar -->
          <ImportBar :importFileName="importFileName" @import-csv="onImportCsv" />
          <button class="button px-3 py-1 text-sm rounded-md bg-gray-100 text-gray-600 button-danger" @click="onReset" :disabled="!hasCards">Reset</button>
          </div>
          <div class="flex items-center justify-end gap-2 flex-nowrap button-row">
            <AISetGenerator 
              :disabled="isAIGeneratorDisabled"
              :title="setTitle"
              :description="setDescription"
              :category="selectedCategoryName"
              @add-set="onAddSet"
              @update:generating="setGenerating = $event" />
            <AddCardButton 
              :disabled="isAddCardDisabled" 
              :class="{ 'input-error': cardsTouched && cards.length === 0 }"
              @add-card="onAddCard" />
            <!-- Submit button -->
            <button 
              class="button button-success" 
              :disabled="isSubmitDisabled" 
              @click="onSubmit"
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
            :cardProps="{ mode: 'single', autoFocus: false, autoFocusId: cards.length ? cards[0].id : null }"
            @update-order="onUpdateOrder" @delete-card="onDeleteCard" @edit-card="onEditCard"
            @request-delete="onRequestDelete" />
        </div>
      </div>
      <!-- submit row -->
      <div class="flex flex-wrap items-center gap-6 mb-8 justify-between align-middle">
      </div>
      <ConfirmDialog v-model="confirmVisible" title="Delete Card" :text="confirmMessage" @confirm="onConfirm" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { FlashCard } from '@/types/card'
import type { Card } from '@/types/card'
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
import { parseFlashCardCsv } from '@/utils/csvParser'
import { fetchCategories, fetchTags } from '@/api/index'
import { SetService } from '@/services/SetService'
import { CardService } from '@/services/CardService'
import { SetWizardStorageService } from '@/services/SetWizardStorageService'
import { useAuthStore } from '@/stores/auth'
import { HistoryService, type HistoryState } from '@/services/historyService'

const router = useRouter()
const route = useRoute()
const { toasts, toast } = useToaster()
const auth = useAuthStore()
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
  setTitle,
  setDescription,
  setCategoryId,
  setTags,
  setPrice,
  setThumbnail,
  cards,
  formSubmitted,
  cardsTouched,
  hasBlankCard,
  setGenerating,
  validateForm,
  addCard,
  updateCard,
  deleteCard,
  updateOrder
} = useSetForm()

const historyService = new HistoryService()

const selectedCategoryName = computed(() => {
  const cat = categories.value.find(c => c.id === setCategoryId.value)
  return cat ? cat.name : ''
})

// Save progress whenever form state changes
watch(
  [
    setTitle,
    setDescription,
    setCategoryId,
    setTags,
    setPrice,
    setThumbnail,
    cards
  ],
  () => {
    if (setId.value) return // Don't save progress for existing sets
    SetWizardStorageService.saveProgress({
      title: setTitle.value,
      description: setDescription.value,
      categoryId: setCategoryId.value,
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
  return setGenerating.value || !setTitle.value || !setDescription.value || !setCategoryId.value
})

const isAddCardDisabled = computed(() => {
  return hasBlankCard.value
})

const isSubmitDisabled = computed(() => {
  return submitting.value || 
         setGenerating.value || 
         !setTitle.value || 
         !setDescription.value || 
         !setCategoryId.value || 
         !hasCards.value
})

const handleThumbnailUpdate = (thumbnail: string | null) => {
  setThumbnail.value = thumbnail
}

// Add keyboard shortcut handling
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.ctrlKey || e.metaKey) { // metaKey for Mac
    if (e.key === 'z') {
      e.preventDefault()
      if (e.shiftKey) {
        // Ctrl+Shift+Z or Cmd+Shift+Z for redo
        const state = historyService.redo()
        if (state) {
          applyHistoryState(state)
        }
      } else {
        // Ctrl+Z or Cmd+Z for undo
        const state = historyService.undo()
        if (state) {
          applyHistoryState(state)
        }
      }
    } else if (e.key === 'y') {
      // Ctrl+Y or Cmd+Y for redo (alternative)
      e.preventDefault()
      const state = historyService.redo()
      if (state) {
        applyHistoryState(state)
      }
    }
  }
}

const applyHistoryState = (state: HistoryState) => {
  setTitle.value = state.title
  setDescription.value = state.description
  setCategoryId.value = state.categoryId
  setTags.value = state.tags
  setPrice.value = state.price
  setThumbnail.value = state.thumbnail
  cards.value = state.cards
}

// Take snapshots before major operations
const takeSnapshot = () => {
  if (setId.value) return // Don't track history for existing sets
  historyService.takeSnapshot({
    title: setTitle.value,
    description: setDescription.value,
    categoryId: setCategoryId.value,
    tags: setTags.value,
    price: setPrice.value,
    thumbnail: setThumbnail.value,
    cards: cards.value
  })
}

function onReset() {
  takeSnapshot()
  confirmMessage.value = 'Are you sure you want to remove all cards?'
  confirmVisible.value = true
}

function onAddSet(newCards: Card | Card[]) {
  const cardsToAdd = Array.isArray(newCards) ? newCards : [newCards]
  
  if (!cardsToAdd.length) {
    console.error('No cards received')
    toast('Failed to generate cards: No cards received', 'error')
    return
  }

  // Handle each card individually
  cardsToAdd.forEach(card => {
    // Validate and structure card
    const validatedCard = {
      id: CardService.generateId(),
      setId: setId.value || 0,
      front: {
        text: card.front.text || '',
        imageUrl: card.front.imageUrl || null
      },
      back: {
        text: card.back.text || '',
        imageUrl: card.back.imageUrl || null
      },
      hint: card.hint || null
    }

    // Add card to the set immediately
    cards.value = [validatedCard, ...cards.value]
    cardsTouched.value = true
  })
  
  // Scroll after a short delay to allow for rendering
  setTimeout(() => {
    window.scrollTo({
      top: 640,
      behavior: 'smooth'
    })
  }, 300)
}

function onAddCard() {
  if (hasBlankCard.value) return
  takeSnapshot()
  addCard()
  setTimeout(() => {
    window.scrollTo({
      top: 640,
      behavior: 'smooth'
    })
  }, 300)
}

function onEditCard(updatedCard: FlashCard) {
  takeSnapshot()
  // Transform the card to match the expected type
  const transformedCard: FlashCard = {
    ...updatedCard,
    front: {
      text: updatedCard.front.text || '',
      imageUrl: updatedCard.front.imageUrl || null
    },
    back: {
      text: updatedCard.back.text || '',
      imageUrl: updatedCard.back.imageUrl || null
    }
  }
  updateCard(transformedCard)
}

function onDeleteCard(id: number) {
  takeSnapshot()
  deleteCard(id)
}

function onUpdateOrder(newOrder: FlashCard[]) {
  takeSnapshot()
  // Transform the cards to match the expected type
  const transformedOrder = newOrder.map(card => ({
    ...card,
    front: {
      text: card.front.text || '',
      imageUrl: card.front.imageUrl || null
    },
    back: {
      text: card.back.text || '',
      imageUrl: card.back.imageUrl || null
    }
  }))
  updateOrder(transformedOrder)
}

async function onImportCsv(file: File) {
  importFileName.value = file.name
  try {
    const text = await file.text()
    const result = parseFlashCardCsv(text)
    
    if (result.error) {
      toast(result.error, 'error')
      return
    }

    const warnings = result.warnings || []
    if (warnings.length) {
      // Show first warning as a toast
      toast(warnings[0], 'info')
      
      // If there are more warnings, show a summary
      if (warnings.length > 1) {
        setTimeout(() => {
          toast(`${warnings.length - 1} more issues found. Check the console for details.`, 'info')
          console.warn('CSV Import Warnings:', warnings)
        }, 2000)
      }
    }

    if (result.cards.length > 0) {
      // Take a snapshot before importing
      takeSnapshot()
      
      // Map the cards and ensure proper structure
      const importedCards = result.cards.map(card => ({
        id: CardService.generateId(),
        setId: 0,
        front: {
          text: card.front.text || '',
          imageUrl: card.front.imageUrl || null
        },
        back: {
          text: card.back.text || '',
          imageUrl: card.back.imageUrl || null
        },
        hint: card.hint || null
      }))

      // Add the imported cards
      cards.value = [...importedCards, ...cards.value]
      cardsTouched.value = true
      
      // Show success message with card count
      toast(`Successfully imported ${result.cards.length} cards`, 'success')
    }
  } catch (e) {
    console.error('CSV import error:', e)
    toast('Failed to read file.', 'error')
  }
}

function reverseCards() {
  cards.value.reverse()
}

function onRequestDelete(id: number) {
  cardToDelete.value = id
  confirmMessage.value = 'Are you sure you want to delete this card?'
  confirmVisible.value = true
}

function onConfirm() {
  if (cardToDelete.value !== null) {
    onDeleteCard(cardToDelete.value)
    cardToDelete.value = null
  } else {
    // Handle reset confirmation
    cards.value = []
    importFileName.value = null
    setTitle.value = ''
    setDescription.value = ''
    setCategoryId.value = null
    setTags.value = []
    setPrice.value = { type: 'free' as const, amount: 0 }
    setThumbnail.value = null
    formSubmitted.value = false
    cardsTouched.value = false
  }
  confirmVisible.value = false
}

async function onSubmit() {
  formSubmitted.value = true
  cardsTouched.value = true

  const validation = validateForm()
  if (!validation.isValid) {
    toast(validation.error!, 'error')
    return
  }

  submitting.value = true

  try {
    const formData = SetService.prepareFormData({
      title: setTitle.value,
      description: setDescription.value,
      categoryId: setCategoryId.value!,
      price: setPrice.value,
      tags: setTags.value,
      thumbnail: setThumbnail.value,
      cards: cards.value,
      educatorId: auth.user!.id
    })

    let updatedSet
    if (setId.value) {
      // Update existing set
      updatedSet = await SetService.updateSet(setId.value, formData)
    } else {
      // Create new set
      updatedSet = await SetService.createSet(formData)
      // Clear saved progress after successful creation
      SetWizardStorageService.clearProgress()
    }

    toast(setId.value ? 'Set updated successfully!' : 'Set created successfully!', 'success')
    setTimeout(() => router.push('/sets/'+updatedSet.id), 1200)

    historyService.clearHistory() // Clear history after successful submission
  } catch (e: any) {
    console.error('Error submitting set:', e)
    const errorMessage = e.response?.data?.message || e.message || 'An unexpected error occurred'
    toast(`Failed to ${setId.value ? 'update' : 'create'} set: ${errorMessage}`, 'error')
  } finally {
    submitting.value = false
  }
}

// Add a computed property for the submit button title
const getSubmitButtonTitle = computed(() => {
  if (setGenerating.value) return 'Please wait for AI generation to complete'
  if (!setTitle.value) return 'Title is required'
  if (!setDescription.value) return 'Description is required'
  if (!setCategoryId.value) return 'Category is required'
  if (!hasCards.value) return 'At least one card is required'
  if (submitting.value) return 'Submitting...'
  return 'Submit Set'
})

// Helper function to normalize card data from backend
function normalizeCard(card: any) {
  // Normalize front
  let front;
  if (typeof card.front === 'object' && card.front !== null) {
    front = {
      text: card.front.text || '',
      imageUrl: card.front.imageUrl || null
    };
  } else {
    front = {
      text: card.front_text || '',
      imageUrl: card.front_image_url || null
    };
  }

  // Normalize back
  let back;
  if (typeof card.back === 'object' && card.back !== null) {
    back = {
      text: card.back.text || '',
      imageUrl: card.back.imageUrl || null
    };
  } else {
    back = {
      text: card.back_text || '',
      imageUrl: card.back_image_url || null
    };
  }

  return {
    id: card.id,
    front,
    back,
    hint: card.hint || null
  };
}

onMounted(async () => {
  try {
    categories.value = await fetchCategories()
  } catch (e) {
    toast('Failed to load categories.', 'error')
  }
  try {
    const tags = await fetchTags()
    availableTags.value = tags.map((tag: { id: number, name: string }) => tag.name)
  } catch (e) {
    toast('Failed to load tags.', 'error')
  }

  if (setId.value) {
    try {
      const set = await SetService.fetchSet(Number(setId.value))
      setTitle.value = set.title
      setDescription.value = set.description
      setCategoryId.value = set.categoryId
      setTags.value = set.tags || []
      setThumbnail.value = set.thumbnail
      setPrice.value = set.price === 0
        ? { type: 'free' as const, amount: 0 }
        : set.is_subscriber_only
          ? { type: 'subscribers' as const, amount: 0 }
          : { type: 'premium' as const, amount: Number(set.price) }

      if (set.cards && set.cards.length > 0) {
        cards.value = set.cards.map(normalizeCard)
      } else {
        const cardsData = await SetService.fetchSetCards(Number(setId.value))
        cards.value = cardsData.map(normalizeCard)
      }
    } catch (e) {
      toast('Failed to load set for editing.', 'error')
      router.push('/creator')
    }
  } else {
    // Try to restore saved progress for new sets
    const savedProgress = SetWizardStorageService.loadProgress()
    if (savedProgress) {
      setTitle.value = savedProgress.title
      setDescription.value = savedProgress.description
      setCategoryId.value = savedProgress.categoryId
      setTags.value = savedProgress.tags
      setPrice.value = savedProgress.price
      setThumbnail.value = savedProgress.thumbnail
      cards.value = savedProgress.cards
      
      // Show a toast to inform the user
      toast('Restored your previous progress', 'info')
    }
  }

  // Add keyboard event listener
  window.addEventListener('keydown', handleKeyDown)
})

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
  .generation-status  {
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