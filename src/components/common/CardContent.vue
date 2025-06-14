<template>
  <Toaster :toasts="toasts" @remove="id => toasts.splice(toasts.findIndex(t => t.id === id), 1)" />
  <!-- Edit Mode -->
  <template v-if="mode === 'edit'">
    <div class="card-content full-size" :class="`layout-${currentView.layout || 'default'}`">
      <div class="content-flex full-size">
        <div class="content-container full-size">
          <div class="content-area full-size">
            <CardMedia 
              v-if="currentView.imageUrl" 
              type="image" 
              :url="currentView.imageUrl" 
              :alt="currentView.imageUrl" 
              :editable="true"
              class="media-preview" 
              @remove="onImageInput(null)"
            />
            <div 
              ref="contentRef"
              class="media-text full-size" 
              contenteditable="true" 
              @input="onTextInput"
              @paste="onPaste"
              v-html="detectAndRenderMedia(currentView.text)"
              :style="fontSizes[0]?.style"
            ></div>
          </div>
        </div>
      </div>
    </div>
    <div class="controls-bar">
      <CardControlsBar :aiLoading="aiLoading" @ai-generate="aiGenerate" @add-media="onImageInput" @toggle-layout="onToggleLayout" />
    </div>
  </template>

  <!-- View Mode -->
  <template v-else>
    <div class="card-content full-size" :class="`layout-${currentView.layout || 'default'}`">
      <div class="content-flex full-size">
        <div class="content-container full-size">
          <div class="content-area full-size">
            <CardMedia 
              v-if="currentView.imageUrl" 
              type="image" 
              :url="currentView.imageUrl" 
              :alt="currentView.imageUrl" 
              class="media-preview" 
            />
            <div 
              ref="contentRef"
              class="media-text full-size view-mode" 
              v-html="detectAndRenderMedia(transformContent(currentView.text))"
              :style="fontSizes[0]?.style"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import type { CardView, CardLayout } from '@/types/card'
import CardControlsBar from './CardControlsBar.vue'
import CardMedia from './CardMedia.vue'
import Toaster from '@/components/common/Toaster.vue'
import { useToaster } from '@/composables/useToaster'
import { useMediaUtils, type MediaType } from '@/composables/useMediaUtils'
import { useContentTransform } from '@/composables/useContentTransform'
import { useFontSizes } from '@/composables/useFontSizes'
import { aiCardService } from '@/services/AICardService'

const props = defineProps<{ 
  card?: CardView,
  text?: string | { text: string, imageUrl: string | null, layout: CardLayout },
  imageUrl?: string | null,
  mode?: 'edit' | 'view',
  side?: 'front' | 'back',
  title?: string,
  description?: string,
  category?: string,
  layout?: CardLayout
}>()

const emit = defineEmits<{
  (e: 'update', value: CardView): void
}>()

// Helper function to create a default card view
function createDefaultCardView(text?: string, imageUrl?: string | null, layout?: CardLayout): CardView {
  const defaultLayout: CardLayout = layout || 'default'
  return {
    id: 0,
    setId: 0,
    front: {
      text: typeof text === 'string' ? text : '',
      imageUrl: imageUrl || null,
      layout: defaultLayout
    },
    back: {
      text: '',
      imageUrl: null,
      layout: defaultLayout
    },
    hint: null
  }
}

// Initialize state based on props
const initialState: CardView = (() => {
  // If we have a card prop, use it
  if (props.card) {
    return { ...props.card }
  }

  // Handle legacy text prop
  if (props.text) {
    if (typeof props.text === 'string') {
      return createDefaultCardView(props.text, props.imageUrl)
    }

    // Handle text object with layout
    const defaultLayout: CardLayout = props.text.layout || 'default'
    return {
      id: 0,
      setId: 0,
      front: {
        text: typeof props.text.text === 'string' ? props.text.text : '',
        imageUrl: props.text.imageUrl || null,
        layout: defaultLayout
      },
      back: {
        text: '',
        imageUrl: null,
        layout: defaultLayout
      },
      hint: null
    }
  }

  // Default empty state
  return createDefaultCardView('', props.imageUrl)
})()

// Local state
const state = ref<CardView>(initialState)

// AI loading state
const aiLoading = ref(false)

const { toasts, toast } = useToaster()
const { 
  detectAndRenderMedia,
  parseContentBlocks 
} = useMediaUtils()
const { transformContent } = useContentTransform('full')

// Get current side view
const currentSide = computed(() => props.side || 'front')
const currentView = computed(() => state.value[currentSide.value])

console.log('CardContent: ', {
  currentSide: currentSide.value,
  currentView: currentView.value
})

// Font size handling
const contentRef = ref<HTMLElement | null>(null)
const textContent = computed(() => [currentView.value.text])
const areaCount = computed(() => 1)

const { fontSizes } = useFontSizes(
  textContent,
  areaCount,
  props.mode || 'view'
)

// Editing handlers
function onTextInput(e: Event) {
  const target = e.target as HTMLElement
  const selection = window.getSelection()
  const range = selection?.getRangeAt(0)
  const cursorPosition = range?.startOffset || 0
  
  // Get the current content and parse it into blocks
  const blocks = parseContentBlocks(target.innerHTML)
  
  // Convert blocks back to a string representation
  const content = blocks.map((block: { type: MediaType; content: string; url?: string }) => {
    switch (block.type) {
      case 'image':
      case 'youtube':
        return block.url || block.content
      case 'link':
        return block.url || block.content
      default:
        return block.content
    }
  }).join('\n')
  
  // Ensure we're setting a string for text
  const newText = typeof content === 'string' ? content : ''
  
  state.value = {
    ...state.value,
    [currentSide.value]: {
      ...currentView.value,
      text: newText
    }
  }
  
  emit('update', state.value)

  // Restore cursor position after Vue updates the DOM
  nextTick(() => {
    if (selection && range) {
      const newRange = document.createRange()
      const textNode = target.firstChild || target
      newRange.setStart(textNode, Math.min(cursorPosition, textNode.textContent?.length || 0))
      newRange.collapse(true)
      selection.removeAllRanges()
      selection.addRange(newRange)
    }
  })
}

function onImageInput(url: string | null) {
  state.value = {
    ...state.value,
    [currentSide.value]: {
      ...currentView.value,
      imageUrl: url
    }
  }
  
  emit('update', state.value)
}

function onToggleLayout() {
  const layouts = ['default', 'two-row', 'two-column']
  const currentIndex = layouts.indexOf(currentView.value.layout)
  const nextLayout = layouts[(currentIndex + 1) % layouts.length]
  
  // Update only the current side's layout
  state.value = {
    ...state.value,
    [currentSide.value]: {
      ...currentView.value,
      layout: nextLayout
    }
  }
  
  emit('update', state.value)
}

// AI Generate for single card face
async function aiGenerate() {
  if (aiLoading.value) return
  
  aiLoading.value = true
  toast('Generating card...', 'info')

  try {
    await aiCardService.generateCardFace({
      side: currentSide.value,
      title: props.title || '',
      description: props.description || '',
      category: props.category || '',
      otherSideContent: state.value[currentSide.value === 'front' ? 'back' : 'front'].text,
      onResult: (text: string) => {
        state.value = {
          ...state.value,
          [currentSide.value]: {
            ...currentView.value,
            text
          }
        }
        
        emit('update', state.value)
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

// Add paste handler
function onPaste(e: ClipboardEvent) {
  e.preventDefault()
  const text = e.clipboardData?.getData('text/plain') || ''
  document.execCommand('insertText', false, text)
}

// Watch for prop changes
watch(() => props.card, (newCard) => {
  if (newCard) {
    state.value = { ...newCard }
  }
}, { deep: true })
</script>

<style scoped>
.full-size {
  width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
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
  gap: var(--space-lg);
  transition: all var(--transition-duration) var(--transition-timing);
  align-items: stretch;
  justify-content: stretch;
}

.content-container {
  display: flex;
  width: 100%;
  height: 100%;
  gap: var(--space-lg);
  transition: all var(--transition-duration) var(--transition-timing);
  align-items: stretch;
  justify-content: stretch;
}

.controls-bar {
  width: 100%;
  background: linear-gradient(to top, #fff 90%, #fff0 100%);
  padding: var(--space-lg) 0 var(--space-sm) 0;
  box-sizing: border-box;
  margin-top: var(--space-sm);
}

.content-area {
  flex: 1 1 0;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-duration) var(--transition-timing);
}

/* Layouts */
.layout-default .content-area {
  flex-direction: column;
}

.layout-default .content-area > * {
  width: 100%;
  height: 100%;
}

.layout-two-row .content-area {
  flex-direction: column;
}

.layout-two-row .content-area > * {
  width: 100%;
  height: 50%;
  min-height: 0;
}

.layout-two-column .content-area {
  flex-direction: row;
}

.layout-two-column .content-area > * {
  width: 50%;
  height: 100%;
  min-width: 0;
}

.media-text {
  flex: 1 1 0;
  min-height: 50%;
  padding: 1rem 2rem;
  outline: none;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease-in-out;
  border: none;
  box-sizing: border-box;
  line-height: 1.5;
  font-size: inherit;
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
}

.media-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  object-fit: contain;
  min-height: 0;
  min-width: 0;
}

.youtube-embed {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.youtube-embed iframe {
  width: 100%;
  height: 100%;
  max-width: 560px;
  max-height: 315px;
}

.auto-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.media-text :deep(a) {
  color: var(--color-primary);
  text-decoration: none;
  word-break: break-all;
}

.media-text :deep(a:hover) {
  text-decoration: underline;
}
</style>