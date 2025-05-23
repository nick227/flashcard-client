<template>
  <form class="grid gap-4 mb-8">
    <!-- Thumbnail upload section -->
    <div>
      <div class="relative group">
        <div
          class="w-full rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:opacity-90 flex items-center justify-center m-h-[480px]"
          @click="() => fileInputRef?.click()">
          <!-- Thumbnail preview area -->
          <div class="relative w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 max-w-[400px]">
            <img v-if="thumbnailPreview" :src="thumbnailPreview" alt="Thumbnail" class="w-full m-h-[480px] object-cover"
              :class="{ 'opacity-50': isUploading }" />
            <!-- Placeholder when no image -->
            <div v-else class="flex items-center justify-center h-full w-full">
              <div class="flex items-center justify-center h-full w-full">
                <div class="w-12 h-48 g-gray-200 flex items-center justify-center flex-col gap-2">
                  <i class="fa-solid fa-image text-gray-400 text-2xl"></i>
                  <p class="text-gray-400 text-sm">Upload a thumbnail</p>
                </div>
              </div>
            </div>
            <!-- Upload loading indicator -->
            <div v-if="isUploading" class="flex items-center justify-center bg-black bg-opacity-50">
              <div class="flex flex-col items-center">
                <svg class="animate-spin h-8 w-8 text-white mb-2" xmlns="http://www.w3.org/2000/svg" fill="none"
                  viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                  </path>
                </svg>
                <span class="text-white">Uploading...</span>
              </div>
            </div>
          </div>
        </div>
        <!-- Thumbnail controls -->
        <div class="flex items-center gap-2 mt-2 justify-center w-full">
          <input ref="fileInputRef" type="file" id="thumbnail" @change="handleThumbnailChange"
            accept="image/jpeg,image/png,image/gif" :disabled="isUploading" class="hidden" />
          <button v-if="thumbnailFile" type="button" @click="removeThumbnail" class="button button-danger"
            :disabled="isUploading">
            Remove
          </button>
        </div>
        <span v-if="thumbnailError" class="text-red-500 text-xs mt-1 block">{{ thumbnailError }}</span>
        <span v-if="thumbnailFile" class="text-sm text-gray-600 mt-1 block">
          {{ formatFileSize(thumbnailFile.size) }} - {{ thumbnailFile.type.split('/')[1].toUpperCase() }}
        </span>
      </div>
    </div>
    <!-- Set title input -->
    <div>
      <span v-if="formSubmitted && !title" class="text-red-500 text-xs">Title is required.</span>
      <input required class="input w-full" :class="{ 'input-error': formSubmitted && !title }" :value="title"
        @input="$emit('update:title', ($event.target as HTMLInputElement)?.value)" placeholder="Set Title" />
    </div>
    <!-- Set description input -->
    <div>
      <span v-if="formSubmitted && !description" class="text-red-500 text-xs">Description is required.</span>
      <textarea required class="input w-full" :class="{ 'input-error': formSubmitted && !description }"
        :value="description" @input="$emit('update:description', ($event.target as HTMLTextAreaElement)?.value)"
        placeholder="Description"></textarea>
    </div>
    <!-- Category selection -->
    <div>
      <span v-if="formSubmitted && !category" class="text-red-500 text-xs">Category is required.</span>
      <select required class="input w-full" :class="{ 'input-error': formSubmitted && !category }" :value="category"
        @change="$emit('update:category', Number(($event.target as HTMLSelectElement).value))">
        <option value="" disabled>Select Category</option>
        <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
      </select>
    </div>
    <!-- Tags and price components -->
    <TagsInput :availableTags="availableTags" :modelValue="tags" @update:modelValue="$emit('update:tags', $event)" />
    <PriceSelector :modelValue="price" @update:modelValue="$emit('update:price', $event)" />
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import TagsInput from './TagsInput.vue'
import PriceSelector from './PriceSelector.vue'

// Component props definition
const props = defineProps<{
  title: string,
  description: string,
  category: number | null,
  tags: string[],
  price: any,
  categories: { id: number, name: string }[],
  availableTags: string[],
  formSubmitted?: boolean,
  thumbnail?: string | null
}>()

// Component events
const emit = defineEmits([
  'update:title',
  'update:description',
  'update:category',
  'update:tags',
  'update:price',
  'update:thumbnail'
])

// State management
const fileInputRef = ref<HTMLInputElement | null>(null)
const thumbnailPreview = ref<string | null>(props.thumbnail || null)
const thumbnailError = ref<string | null>(null)
const thumbnailFile = ref<File | null>(null)
const isUploading = ref(false)

// Constants for file validation
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif']

// Watch for thumbnail prop changes
watch(() => props.thumbnail, (newThumbnail) => {
  if (newThumbnail && !thumbnailFile.value) {
    thumbnailPreview.value = newThumbnail;
  }
});

// Format file size for display
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Handle thumbnail file selection
async function handleThumbnailChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  const file = input.files[0]
  thumbnailError.value = null
  isUploading.value = true

  try {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size must be less than 5MB')
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Only JPEG, PNG and GIF images are allowed')
    }

    // Create preview
    thumbnailPreview.value = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    // Store file for later upload
    thumbnailFile.value = file
    emit('update:thumbnail', file)
  } catch (err) {
    thumbnailError.value = err instanceof Error ? err.message : 'Failed to process file'
    thumbnailPreview.value = null
    thumbnailFile.value = null
    input.value = ''
  } finally {
    isUploading.value = false
  }
}

// Remove selected thumbnail
function removeThumbnail() {
  thumbnailPreview.value = null
  thumbnailFile.value = null
  thumbnailError.value = null
  emit('update:thumbnail', null)
  const input = document.getElementById('thumbnail') as HTMLInputElement
  if (input) input.value = ''
}
</script>

<style scoped>
/* Loading spinner animation */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>