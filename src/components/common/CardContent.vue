<template>
  <Toaster :toasts="toasts" @remove="id => toasts.splice(toasts.findIndex(t => t.id === id), 1)" />
  <!-- Edit Mode -->
  <template v-if="mode === 'edit'">
    <div class="card-content full-size">
      <div class="content-flex full-size" :class="`layout-${layout}`">
        <div class="content-container full-size">
          <div v-for="idx in areaCount" :key="idx" class="content-area full-size">
            <div v-if="mediaTypes[idx - 1] !== 'text'" class="media-container" :data-media-type="mediaTypes[idx - 1]">
              <CardMedia 
                :type="mediaTypes[idx - 1]" 
                :url="contentAreas[idx - 1]" 
                :alt="contentAreas[idx - 1]"
                class="media-preview" 
              />
              <button class="media-trash" @click="removeMedia(idx - 1)" title="Remove media">
                <i class="fa fa-trash"></i>
              </button>
            </div>
            <div v-else 
              class="media-text full-size" 
              contenteditable="true"
              :style="fontSizes[idx - 1].style"
              :ref="el => editableDivs[idx - 1] = el as HTMLElement | null"
              @input="e => onInput(idx - 1, e, val => emit('update', val))">
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="controls-bar">
      <CardControlsBar :aiLoading="aiLoading" @ai-generate="aiGenerate" @add-media="addMedia"
        @toggle-layout="() => toggleLayout(val => emit('update', val))" />
    </div>
  </template>

  <!-- View Mode -->
  <template v-else>
    <div class="card-content full-size">
      <div class="content-flex full-size" :class="`layout-${layout}`">
        <div class="content-container full-size">
          <div v-for="idx in areaCount" :key="idx" class="content-area full-size">
            <div v-if="mediaTypes[idx - 1] !== 'text'" class="media-container" :data-media-type="mediaTypes[idx - 1]">
              <CardMedia 
                :type="mediaTypes[idx - 1]" 
                :url="contentAreas[idx - 1]" 
                :alt="contentAreas[idx - 1]" 
                class="media-preview"
                :data-media-type="mediaTypes[idx - 1]"
              />
            </div>
            <div v-else 
              class="media-text full-size view-mode" 
              :style="fontSizes[idx - 1].style"
              v-html="transformContent(contentAreas[idx - 1])">
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import { useCardContent } from '@/composables/useCardContent'
import CardControlsBar from './CardControlsBar.vue'
import CardMedia from './CardMedia.vue'
import Toaster from '@/components/common/Toaster.vue'
import { useToaster } from '@/composables/useToaster'
import { useMediaUtils } from '@/composables/useMediaUtils'
import { useContentTransform } from '@/composables/useContentTransform'
import { useDynamicFontSize } from '@/composables/useDynamicFontSize'
import { aiCardService } from '@/services/AICardService'

const props = defineProps<{ 
  text: string, 
  mode?: 'edit' | 'view', 
  side?: 'front' | 'back',
  title?: string,
  description?: string,
  category?: string,
  imageUrl?: string
}>()
const emit = defineEmits(['update'])

// Add debug logging for props
console.log('CardContent props:', {
  text: props.text,
  imageUrl: props.imageUrl,
  mode: props.mode,
  side: props.side
})

const {
  layout,
  contentAreas,
  areaCount,
  onInput,
  toggleLayout,
  initialize
} = useCardContent(props.text)

// Add debug logging for content areas
console.log('CardContent contentAreas:', contentAreas.value)

const { toasts, toast } = useToaster()
const { getMediaType } = useMediaUtils()
const { transformContent } = useContentTransform('full')

// Local DOM refs for editable divs (plain array)
const editableDivs: (HTMLElement | null)[] = []

const mediaTypes = computed(() => {
  const types = contentAreas.value.map(area => getMediaType(area))
  console.log('mediaTypes computed:', types)
  return types
})

// Create dynamic font size handlers for each content area
const fontSizes = computed(() => 
  contentAreas.value.map(text => {
    // Use different font size ranges for front and back
    const isMobile = window.innerWidth < 768
    return useDynamicFontSize(text, {
      minChars: isMobile ? 4 : 8,
      maxChars: isMobile ? 200 : 300,
      minSize: isMobile ? 0.5 : 0.8,
      maxSize: isMobile ? 2 : 4, 
      unit: 'em'
    })
  })
)

function removeMedia(idx: number) {
  contentAreas.value[idx] = ''
  emit('update', contentAreas.value.length === 1 ? contentAreas.value[0] : contentAreas.value.join('\n'))
}

function addMedia() {
  const url = window.prompt('Enter image, YouTube, or link URL:')?.trim()
  if (!url) return
  const type = getMediaType(url)
  if (type === 'text') {
    window.alert('Invalid media URL.')
    return
  }
  // Always insert into the first empty area, or replace the first area
  const idx = contentAreas.value.findIndex(area => !area)
  contentAreas.value[idx !== -1 ? idx : 0] = url
  emit('update', contentAreas.value.length === 1 ? contentAreas.value[0] : contentAreas.value.join('\n'))
}

// AI Generate for single card face
const aiLoading = ref(false)
async function aiGenerate() {
  if (aiLoading.value) return
  
  aiLoading.value = true
  toast('Generating card...', 'info')

  // Determine which side and content to generate
  let side: 'front' | 'back' = props.side || (contentAreas.value.length === 2 ? 'front' : 'front')
  let idx = side === 'front' ? 0 : 1
  // If only one area, always use idx 0
  if (contentAreas.value.length === 1) idx = 0
  const otherSideContent = contentAreas.value.length === 2 ? contentAreas.value[1 - idx] : ''

  try {
    await aiCardService.generateCardFace({
      side,
      title: props.title || '',
      description: props.description || '',
      category: props.category || '',
      otherSideContent,
      onResult: (text: string) => {
        contentAreas.value[idx] = text
        // Update the editable div content
        if (editableDivs[idx]) {
          editableDivs[idx]!.innerHTML = text
        }
        console.log('CardContent emitting update', { idx, text, contentAreas: contentAreas.value })
        emit('update', contentAreas.value.length === 1 ? text : contentAreas.value.join('\n'))
        toast('Card generated successfully', 'success')
      },
      onError: (err: string) => {
        toast('AI error: ' + err, 'error')
      }
    })
  } finally {
    aiLoading.value = false
  }
}

// Watch for both text and imageUrl changes
watch([() => props.text, () => props.imageUrl], ([newText, newImageUrl]) => {
  console.log('CardContent - Initializing with:', { text: newText, imageUrl: newImageUrl });
  
  // If we have an imageUrl, use it as the content
  if (newImageUrl) {
    console.log('CardContent - Using imageUrl as content:', newImageUrl);
    contentAreas.value[0] = newImageUrl;
    // Update the editable div if it exists
    nextTick(() => {
      if (editableDivs[0]) {
        editableDivs[0]!.innerHTML = '';
      }
    });
  } else {
    console.log('CardContent - Using text as content:', newText);
    initialize(newText);
  }
}, { immediate: true })
</script>

<style scoped>
.full-size {
  width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
  box-sizing: border-box;
}

.card-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  background: var(--color-white);
  border-radius: 8px;
  min-height: 400px;
  min-width: 300px;
  box-sizing: border-box;
}

.back .card-content {
  background: var(--color-primary);
  color: var(--color-white);
  overflow: hidden;
}

.content-flex {
  display: flex;
  width: 100%;
  height: 100%;
  gap: 1rem;
  transition: all 0.3s ease-in-out;
  align-items: stretch;
  justify-content: stretch;
}

.content-container {
  display: flex;
  width: 100%;
  height: 100%;
  gap: 1rem;
  transition: all 0.3s ease-in-out;
  align-items: stretch;
  justify-content: stretch;
}

.controls-bar {
  width: 100%;
  background: linear-gradient(to top, #fff 90%, #fff0 100%);
  padding: 1rem 0 0.5rem 0;
  box-sizing: border-box;
  margin-top: 0.5rem;
}

.content-area {
  flex: 1 1 0;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: stretch;
}

/* Layouts */
.layout-default .content-container,
.layout-single-column .content-container,
.layout-two-row .content-container {
  flex-direction: column;
}

.layout-two-column .content-container {
  flex-direction: row;
}

.layout-default .content-area,
.layout-single-column .content-area,
.layout-two-row .content-area {
  width: 100%;
}

.layout-two-column .content-area {
  width: 50%;
}

.media-text {
  flex: 1 1 0;
  min-height: 100px;
  padding: 3rem;
  border-radius: 4px;
  outline: none;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease-in-out;
  border: 1px solid var(--color-border);
  box-sizing: border-box;
  line-height: 1.5;
  font-size: inherit;
}

.media-text:focus {
  border-color: var(--color-primary);
}

.media-text:empty:not(:has(+ .card-media))::before {
  content: 'Enter text or paste a URL...';
  color: #999;
}

.media-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  object-fit: contain;
}

.media-text.view-mode {
  pointer-events: none;
  background: none;
  border: none;
  color: inherit;
  min-height: 2em;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.media-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-white);
  border-radius: 4px;
  overflow: hidden;
}

.media-trash {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255, 255, 255, 0.85);
  border: none;
  border-radius: 50%;
  padding: 0.4em;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 10;
}

.media-container:hover .media-trash {
  opacity: 1;
}

.media-trash i {
  color: #ef4444;
  font-size: 1.2em;
}
</style>