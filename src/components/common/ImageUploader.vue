<template>
  <div class="image-uploader">
    <!-- Hidden file input -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/jpeg,image/png,image/gif,image/webp"
      class="hidden"
      @change="handleFileChange"
    />
    
    <!-- Upload button -->
    <button
      v-if="!isUploading && !previewUrl && !isCompressing"
      @click="triggerFileSelect"
      class="upload-button"
      :disabled="disabled"
      :title="title"
    >
      <i class="fas fa-image"></i>
      <span v-if="showLabel">{{ label }}</span>
    </button>
    
    <!-- Compression progress -->
    <div v-if="isCompressing" class="compression-progress">
      <div class="progress-spinner"></div>
      <span class="progress-text">Compressing image...</span>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${compressionProgress}%` }"></div>
      </div>
    </div>
    
    <!-- Upload progress -->
    <div v-if="isUploading" class="upload-progress">
      <div class="progress-spinner"></div>
      <span class="progress-text">Uploading...</span>
    </div>
    
    <!-- Preview -->
    <div v-if="previewUrl && !isUploading && !isCompressing" class="image-preview">
      <img :src="previewUrl" :alt="alt" class="preview-image" />
      <button @click="removeImage" class="remove-button" title="Remove image">
        <i class="fas fa-times"></i>
      </button>
      <!-- Compression info -->
      <div v-if="compressionInfo" class="compression-info">
        <div class="compression-stats">
          <span class="compression-ratio">{{ compressionInfo.compressionRatio.toFixed(1) }}% smaller</span>
          <span class="file-size">{{ formatFileSize(compressionInfo.compressedSize) }}</span>
        </div>
        <div class="compression-details">
          <span class="format-badge">{{ compressionInfo.format.toUpperCase() }}</span>
          <span class="quality-badge">{{ (compressionInfo.quality * 100).toFixed(0) }}% quality</span>
        </div>
      </div>
    </div>
    
    <!-- Error message -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useImageCompression, type CompressionResult } from '@/composables/useImageCompression'

interface Props {
  disabled?: boolean
  title?: string
  label?: string
  showLabel?: boolean
  alt?: string
  maxSize?: number // in bytes
  allowedTypes?: () => string[]
  enableCompression?: boolean
  targetSize?: number // Target file size in bytes
  smartCompression?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  title: 'Upload Image',
  label: 'Add Image',
  showLabel: false,
  alt: 'Uploaded image',
  maxSize: 15 * 1024 * 1024, // 15MB default
  allowedTypes: () => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  enableCompression: true,
  targetSize: 1024 * 1024, // 1MB default
  smartCompression: true
})

const emit = defineEmits<{
  (e: 'file-selected', file: File): void
  (e: 'upload-start'): void
  (e: 'upload-success', url: string): void
  (e: 'upload-error', error: string): void
  (e: 'remove'): void
}>()

// Refs
const fileInputRef = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)
const previewUrl = ref<string | null>(null)
const error = ref<string | null>(null)
const compressionInfo = ref<CompressionResult | null>(null)

// Image compression composable
const {
  isCompressing,
  compressionProgress,
  compressImage,
  smartCompress,
  formatFileSize
} = useImageCompression()

// Computed
const isDisabled = computed(() => props.disabled || isUploading.value || isCompressing.value)

// Methods
const triggerFileSelect = () => {
  if (isDisabled.value) return
  fileInputRef.value?.click()
}

const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  
  if (!file) return
  
  // Reset error and compression info
  error.value = null
  compressionInfo.value = null
  
  // Validate file
  const validationError = validateFile(file)
  if (validationError) {
    error.value = validationError
    resetFileInput()
    return
  }
  
  try {
    let processedFile = file
    
    // Compress image if enabled
    if (props.enableCompression) {
      let compressionResult
      
      if (props.smartCompression) {
        // Use smart compression with target size
        compressionResult = await smartCompress(file, {
          targetSize: props.targetSize,
          enableWebP: true,
          contentAware: true
        })
      } else {
        // Use basic compression
        compressionResult = await compressImage(file)
      }
      
      processedFile = compressionResult.file
      compressionInfo.value = compressionResult
    }
    
    // Create preview
    createPreview(processedFile)
    
    // Emit file selected event with processed file
    emit('file-selected', processedFile)
  } catch (compressionError) {
    console.error('Compression error:', compressionError)
    error.value = 'Failed to process image. Please try again.'
    resetFileInput()
  }
}

const validateFile = (file: File): string | null => {
  // Check file size
  if (file.size > props.maxSize) {
    return `File size must be less than ${formatFileSize(props.maxSize)}`
  }
  
  // Check file type
  if (!props.allowedTypes().includes(file.type)) {
    return `File type not allowed. Allowed types: ${props.allowedTypes().join(', ')}`
  }
  
  return null
}

const createPreview = (file: File) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const resetFileInput = () => {
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const removeImage = () => {
  previewUrl.value = null
  error.value = null
  compressionInfo.value = null
  resetFileInput()
  emit('remove')
}

// Public methods for parent component
const startUpload = () => {
  isUploading.value = true
  error.value = null
  emit('upload-start')
}

const uploadSuccess = (url: string) => {
  isUploading.value = false
  error.value = null
  emit('upload-success', url)
}

const uploadError = (errorMessage: string) => {
  isUploading.value = false
  error.value = errorMessage
  emit('upload-error', errorMessage)
}

// Expose methods to parent
defineExpose({
  startUpload,
  uploadSuccess,
  uploadError,
  removeImage
})
</script>

<style scoped>
.image-uploader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.upload-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.upload-button:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.upload-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.compression-progress,
.upload-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
}

.progress-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid var(--color-border);
  border-top: 2px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.progress-text {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: var(--color-border);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s ease;
}

.image-preview {
  position: relative;
  display: inline-block;
}

.preview-image {
  max-width: 200px;
  max-height: 200px;
  border-radius: var(--radius-md);
  object-fit: cover;
}

.remove-button {
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  width: 1.5rem;
  height: 1.5rem;
  background: var(--color-danger);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  transition: all 0.2s ease;
}

.remove-button:hover {
  background: var(--color-danger-dark);
  transform: scale(1.1);
}

.compression-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  display: flex;
  justify-content: space-between;
}

.compression-stats {
  display: flex;
  justify-content: space-between;
}

.compression-ratio {
  color: #4ade80;
  font-weight: 500;
}

.file-size {
  opacity: 0.8;
}

.compression-details {
  display: flex;
  justify-content: space-between;
}

.format-badge {
  background: #4ade80;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
}

.quality-badge {
  background: #4ade80;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
}

.error-message {
  color: var(--color-danger);
  font-size: 0.75rem;
  text-align: center;
  max-width: 200px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.hidden {
  display: none;
}
</style> 