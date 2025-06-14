<template>
  <div>
    <div class="relative group">
      <div
        class="w-full rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:opacity-90 flex items-center justify-center m-h-[480px]"
        @click="handleUploadAreaClick"
        :class="{ 'opacity-50 cursor-not-allowed': disabled }"
        role="button"
        :aria-label="disabled ? 'Thumbnail upload disabled' : 'Click to upload thumbnail'"
        tabindex="0">
        <!-- Thumbnail preview area -->
        <div class="relative w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 max-w-[400px] min-h-[220px] border border-gray-300">
          <img 
            v-if="thumbnailPreview && !isGeneratingThumbnail" 
            :src="thumbnailPreview" 
            alt="Thumbnail" 
            class="w-full m-h-[480px] object-cover"
            :class="{ 'opacity-50': isUploading }"
            @error="handleImageError"
          />
          <!-- AI Generation Loading State -->
          <div v-if="isGeneratingThumbnail" class="flex items-center justify-center h-full w-full bg-gray-50">
            <div class="p-8 text-center">
              <p class="text-gray-700 font-medium text-lg mb-4">Generating AI Thumbnail</p>
              <div class="relative">
                <!-- Outer spinning ring -->
                <div class="w-20 h-20 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                <!-- Inner spinning ring -->
                <div class="absolute inset-0 w-16 h-16 border-4 border-blue-100 border-t-blue-400 rounded-full animate-spin" style="animation-duration: 1.5s"></div>
                <!-- Magic wand icon -->
                <div class="absolute inset-0 flex items-center justify-center">
                  <i class="fa-solid fa-wand-magic-sparkles text-blue-500 text-2xl animate-pulse"></i>
                </div>
              </div>
              <div class="space-y-2">
                <!-- Loading dots animation -->
                <div class="flex justify-center space-x-1 mt-4">
                  <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0s"></div>
                  <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                  <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
                </div>
              </div>
            </div>
          </div>
          <!-- Placeholder when no image or image failed to load -->
          <div v-if="!thumbnailPreview && !isGeneratingThumbnail || imageLoadError" class="flex items-center justify-center h-full w-full">
            <div class="flex flex-col items-center justify-center h-full w-full gap-4 p-8 text-center">
              <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <i class="fa-solid fa-image text-gray-400 text-3xl"></i>
              </div>
              <div class="space-y-2">
                <p class="text-gray-600 font-medium">
                  {{ imageLoadError ? 'Failed to load image' : 'Upload a thumbnail' }}
                </p>
                <p class="text-gray-500 text-sm">
                  {{ imageLoadError ? 'Please try uploading again' : 'Click to upload an image (JPEG, PNG, GIF)' }}
                </p>
                <p class="text-gray-400 text-xs">
                  Max file size: 5MB
                </p>
              </div>
              <div class="flex items-center gap-4 mt-4">
                <button 
                  @click="!disabled && fileInputRef?.click()"
                  class="button button-primary align-self-center"
                  :disabled="disabled"
                  :class="{ 'opacity-50 cursor-not-allowed': disabled }">
                  <i class="fa-solid fa-upload"></i>
                </button>
                <button 
                  @click="handleGenerateClick"
                  class="button button-secondary"
                  :disabled="disabled || !canGenerate"
                  :title="disabled || !canGenerate ? 'Complete Title and Description to Use' : 'Generate thumbnail using AI'"
                  :class="{ 'opacity-50 cursor-not-allowed': disabled || !canGenerate }">
                  <i class="fa-solid fa-wand-magic-sparkles"></i>
                </button>
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
        <input 
          ref="fileInputRef" 
          type="file" 
          id="thumbnail" 
          @change="handleThumbnailChange"
          @click.stop
          accept="image/jpeg,image/png,image/gif" 
          :disabled="disabled || isUploading" 
          class="hidden" 
        />
        <button 
          v-if="thumbnailFile || thumbnailPreview" 
          type="button" 
          @click.prevent="handleRemoveClick" 
          class="button button-danger"
          :disabled="disabled || isUploading"
          :aria-label="disabled ? 'Remove thumbnail disabled' : 'Remove thumbnail'">
          Remove
        </button>
      </div>
      <span v-if="thumbnailError" class="text-red-500 text-xs mt-1 block">{{ thumbnailError }}</span>
      <span v-if="thumbnailFile" class="text-sm text-gray-600 mt-1 block">
        {{ formatFileSize(thumbnailFile.size) }} - {{ thumbnailFile.type.split('/')[1].toUpperCase() }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { api } from '@/api'
import { useToaster } from '@/composables/useToaster'
import { AxiosError } from 'axios'

const props = defineProps<{
  title: string,
  description: string,
  thumbnail?: string | null,
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:thumbnail', value: string | File | null): void
}>()

// State management
const fileInputRef = ref<HTMLInputElement | null>(null)
const thumbnailPreview = ref<string | null>(props.thumbnail || null)
const thumbnailError = ref<string | null>(null)
const thumbnailFile = ref<File | null>(null)
const isUploading = ref(false)
const imageLoadError = ref(false)
const isGeneratingThumbnail = ref(false)
const { toast } = useToaster()

// Constants for file validation
const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif']

const canGenerate = computed(() => {
  return Boolean(props.title?.trim() && props.description?.trim())
})

// Watch for thumbnail prop changes
watch(() => props.thumbnail, (newThumbnail) => {
  if (newThumbnail && !thumbnailFile.value) {
    thumbnailPreview.value = newThumbnail;
  }
});

// Handle generate click
function handleGenerateClick() {
  if (!props.disabled && canGenerate.value) {
    generateThumbnail()
  }
}

// Handle thumbnail file selection
async function handleThumbnailChange(event: Event) {
  event.preventDefault()
  event.stopPropagation()
  
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  const file = input.files[0]
  thumbnailError.value = null
  isUploading.value = true
  imageLoadError.value = false

  try {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size must be less than 5MB')
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Only JPEG, PNG and GIF images are allowed')
    }

    // Create preview and convert to URL
    const url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    thumbnailPreview.value = url
    thumbnailFile.value = file
    emit('update:thumbnail', url)
  } catch (err) {
    thumbnailError.value = err instanceof Error ? err.message : 'Failed to process file'
    thumbnailPreview.value = null
    thumbnailFile.value = null
    input.value = ''
  } finally {
    isUploading.value = false
  }
}

// Generate thumbnail
async function generateThumbnail() {
    isGeneratingThumbnail.value = true
    thumbnailError.value = null
    imageLoadError.value = false

    try {
        console.log('ThumbnailUploader.generateThumbnail - Generating thumbnail for:', {
            title: props.title,
            description: props.description
        })

        const response = await api.post('/thumbnail/generate', {
            title: props.title,
            description: props.description
        })

        console.log('ThumbnailUploader.generateThumbnail - Response:', response.data)

        if (response.data.url) {
            thumbnailPreview.value = response.data.url
            console.log('ThumbnailUploader.generateThumbnail - Emitting URL:', response.data.url)
            emit('update:thumbnail', response.data.url)
            toast('Thumbnail generated successfully', 'success')
        } else {
            throw new Error('No thumbnail URL received')
        }
    } catch (error) {
        console.error('Thumbnail generation error:', error)
        const errorMessage = error instanceof AxiosError 
            ? error.response?.data?.message || 'Failed to generate thumbnail'
            : 'Failed to generate thumbnail'
        thumbnailError.value = errorMessage
        toast(errorMessage, 'error')
    } finally {
        isGeneratingThumbnail.value = false
    }
}

// Format file size for display
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Handle image load error
function handleImageError() {
  imageLoadError.value = true
  thumbnailPreview.value = null
  thumbnailFile.value = null
  emit('update:thumbnail', null)
}

// Remove selected thumbnail
function removeThumbnail() {
  thumbnailPreview.value = null
  thumbnailFile.value = null
  thumbnailError.value = null
  imageLoadError.value = false
  emit('update:thumbnail', null)
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

// Add this function before the removeThumbnail function
function handleRemoveClick() {
  if (!props.disabled) {
    removeThumbnail()
  }
}

// Update the click handler for the upload area
function handleUploadAreaClick(event: Event) {
  if (props.disabled || isGeneratingThumbnail.value) return
  event.preventDefault()
  event.stopPropagation()
  fileInputRef.value?.click()
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

/* Pulse animation for the magic wand */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Bounce animation for loading dots */
.animate-bounce {
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}
</style> 