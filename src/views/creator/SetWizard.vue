<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <Toaster 
      :toasts="toasts"
      @remove="id => toasts.splice(toasts.findIndex(t => t.id === id), 1)" 
    />
    
    <main class="container flex-1">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-3xl font-bold flex w-full items-center justify-center cursive">Create Set</h2>
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
          :loading="loading"
          :error="error"
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
          <!-- Reverse Cards Button -->
          <button class="button px-3 py-1 text-sm rounded-md bg-gray-100 text-gray-600" @click="reverseCards" :disabled="!hasCards">
            <i class="fa-solid fa-arrows-up-down"></i>
          </button>
          <!-- Card Count Indicator -->
          <CardCountIndicator :count="cards.length" />
          <!-- Import Bar -->
          <ImportBar :importFileName="importFileName" @import-csv="onImportCsv" />
          <button class="button button-danger" @click="onReset" :disabled="!hasCards">Reset</button>
          <div class="flex items-center gap-2 flex-nowrap">
          <AddCardButton :disabled="hasBlankCard" :class="{ 'input-error': cardsTouched && cards.length === 0 }"
            @add-card="onAddCard" />
          <!-- Submit button -->
          <button class="button button-success" :disabled="submitting" @click="onSubmit">
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
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { FlashCard } from '@/types'
import ImportBar from '@/components/creator/ImportBar.vue'
import SetInfoForm from '@/components/creator/SetInfoForm.vue'
import ViewToggle from '@/components/creator/ViewToggle.vue'
import CardCountIndicator from '@/components/creator/CardCountIndicator.vue'
import AddCardButton from '@/components/creator/AddCardButton.vue'
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
import { useAuthStore } from '@/stores/auth'

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
const loading = ref(false)
const error = ref<string | null>(null)

const setId = computed(() => Number(route.params.setId) || 0)
const submitButtonText = computed(() => setId.value ? 'Save Changes' : 'Submit Set')
const hasCards = computed(() => cards.value.length > 0)

const {
  setTitle,
  setDescription,
  setCategoryId,
  setTags,
  setPrice,
  thumbnailFile,
  setThumbnail,
  cards,
  formSubmitted,
  cardsTouched,
  hasBlankCard,
  validateForm,
  addCard,
  updateCard,
  deleteCard,
  updateOrder
} = useSetForm()

const handleThumbnailUpdate = (file: File) => {
  thumbnailFile.value = file
}

function onReset() {
  confirmMessage.value = 'Are you sure you want to remove all cards?'
  confirmVisible.value = true
}

function onAddCard() {
  if (hasBlankCard.value) return
  addCard()
  setTimeout(() => {
    window.scrollTo({
      top: 640,
      behavior: 'smooth'
    })
  }, 300)
}

function onEditCard(updatedCard: FlashCard) {
  updateCard(updatedCard)
}

function onDeleteCard(id: number) {
  deleteCard(id)
}

function onUpdateOrder(newOrder: FlashCard[]) {
  updateOrder(newOrder)
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
    cards.value = result.cards.map(card => ({
      ...card,
      id: CardService.generateId(),
      setId: 0
    }))
  } catch (e) {
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
      thumbnail: thumbnailFile.value,
      cards: cards.value,
      educatorId: auth.user!.id
    })

    if (setId.value) {
      await SetService.updateSet(Number(setId.value), formData)
    } else {
      await SetService.createSet(formData)
    }

    toast(setId.value ? 'Set updated successfully!' : 'Set created successfully!', 'success')
    setTimeout(() => router.push('/creator'), 1200)
  } catch (e: any) {
    console.error('Error submitting set:', e)
    const errorMessage = e.response?.data?.message || e.message || 'An unexpected error occurred'
    toast(`Failed to ${setId.value ? 'update' : 'create'} set: ${errorMessage}`, 'error')
  } finally {
    submitting.value = false
  }
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

      const cardsData = await SetService.fetchSetCards(Number(setId.value))
      cards.value = cardsData.map((card: any) => ({
        id: card.id,
        front: card.front,
        back: card.back,
        hint: card.hint || null
      }))
    } catch (e) {
      toast('Failed to load set for editing.', 'error')
      router.push('/creator')
    }
  }
})
</script>