<template>
  <div class="w-full">
    <div class="flex flex-col items-start w-full">
      <!-- Creator Info with Avatar -->
      <div class="flex items-center gap-3 mb-4">
        <img 
          v-if="set.educatorImage && !avatarError" 
          :src="set.educatorImage" 
          :alt="set.educatorName"
          class="w-8 h-8 rounded-full object-cover"
          @error="handleAvatarError"
          @load="handleAvatarLoad"
        />
        <div v-else class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
          {{ getEducatorInitials }}
        </div>
        <a @click="router.push(`/u/${set.educatorName}`)" class="link">
          <h3 class="my-0">{{ set.educatorName }}</h3>
        </a>
      </div>
    </div>
    <!-- Title Row -->
    <div class="title-container mb-2 flex gap-4 items-start">
        <!-- Set thumbnail -->
        <div class="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center bg-gray-100 mt-4">
          <img 
            v-if="set.thumbnail && !thumbnailError" 
            :src="set.thumbnail" 
            :alt="set.title"
            class="w-full h-full object-cover"
            @error="handleThumbnailError"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <span class="text-2xl font-bold text-gray-400">{{ getFirstLetter }}</span>
          </div>
        </div>
        <!-- Set title -->
        <h1 ref="titleElement" class="text-2xl font-bold flex-1 set-title">{{ set.title }}</h1>
    </div>
      <!-- Action Buttons -->
      <div class="flex items-center justify-end sm:justify-end gap-4 title-buttons w-full mb-2">
        <!-- Download Button -->
        <a class="link" @click="$emit('download')">
          <i :class="['fa-solid', 'fa-download', 'text-gray-400', 'text-2xl']"></i>&nbsp; Download 
        </a>
        <!-- Like Button -->
        <LikeButton :set-id="set.id" />
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { FlashCardSet } from '@/types'
import LikeButton from './LikeButton.vue'

const router = useRouter()
const avatarError = ref(false)
const thumbnailError = ref(false)
const titleElement = ref<HTMLElement | null>(null)

const props = defineProps<{
  set: FlashCardSet
}>()

defineEmits<{
  (e: 'download'): void
}>()

const handleAvatarError = () => {
  avatarError.value = true
}

const handleAvatarLoad = () => {
  avatarError.value = false
}

const getEducatorInitials = computed(() => {
  if (!props.set.educatorName) return 'U'
  const cleanName = props.set.educatorName
    .replace(/[^a-zA-Z\s]/g, '')
    .trim()
    .split(/\s+/)
  if (cleanName.length === 0) return 'U'
  const initials = cleanName.length === 1
    ? cleanName[0].slice(0, 2).toUpperCase()
    : cleanName
        .slice(0, 2)
        .map((word: string) => word.charAt(0))
        .join('')
        .toUpperCase()
  return initials || 'U'
})

// Reset avatar error state when educator changes
watch(
  () => [props.set.educatorId, props.set.educatorImage],
  () => {
    avatarError.value = false
  },
  { deep: true }
)

const handleThumbnailError = () => {
  thumbnailError.value = true
}

// Get first letter of title for fallback
const getFirstLetter = computed(() => {
  if (!props.set.title) return '?'
  return props.set.title.charAt(0).toUpperCase()
})

// Update font size based on content length
const updateTitleSize = () => {
  if (titleElement.value) {
    const charCount = titleElement.value.textContent?.length || 0
    titleElement.value.style.setProperty('--char-count', charCount.toString())
  }
}

// Watch for title changes
watch(() => props.set.title, () => {
  nextTick(updateTitleSize)
})

onMounted(() => {
  nextTick(updateTitleSize)
})
</script>

<style scoped>
.title-container {
  display: flex;
  gap: 1rem;
  width: 100%;
}

.set-title {
  font-size: clamp(1.8em, calc(8em - (var(--char-count) * 0.15em)), 4em);
  margin-top: 0;
  line-height: 1.23;
  overflow-wrap: break-word;
  word-wrap: break-word;
  hyphens: auto;
  max-width: 100%;
  min-height: 60px;
}

.title-buttons {
  flex-shrink: 0;
}

/* Add new styles for thumbnail fallback */
.w-16.h-16 {
  position: relative;
  transition: all 0.2s ease;
}

.w-16.h-16:hover {
  transform: scale(1.02);
}

.w-16.h-16 img {
  transition: opacity 0.2s ease;
}

.w-16.h-16 img:hover {
  opacity: 0.9;
}

/* Ensure the fallback letter is properly centered and sized */
.w-16.h-16 .text-2xl {
  font-size: 1.75rem;
  line-height: 1;
}

/* Add styles to prevent layout shift */
.like-button {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 3rem;
  justify-content: center;
}

.likes-count {
  min-width: 1.5rem;
  text-align: center;
  display: inline-block;
}

/* Smooth transitions for like button */
.like-button i {
  transition: color 0.2s ease;
}

.like-button:hover i {
  transform: scale(1.1);
}

@media (max-width: 768px) {
  .title-buttons {
    text-align: center;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    flex-wrap: nowrap;
    white-space: nowrap;
  }
}
</style> 
