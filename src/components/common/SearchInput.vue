<template>
  <form class="search-bar" @submit.prevent="onSubmit">
    <div class="search-bar-inner">
      <input
        ref="inputRef"
        type="text"
        :value="localValue"
        @input="onInput"
        :placeholder="placeholder"
        :disabled="disabled"
        aria-label="Search sets"
        class="search-input"
        autocomplete="off"
      />
      <button type="submit" :disabled="searchDisabled" class="icon-btn search-btn" aria-label="Search">
        <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
    </div>
    <button type="button" class="icon-btn mic-btn" :aria-pressed="isListening" aria-label="Voice search" @click="onMicClick" :disabled="disabled">
      <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="22" />
        <line x1="8" y1="22" x2="16" y2="22" />
      </svg>
    </button>
  </form>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, watch, computed } from 'vue'

// Type for Web Speech API
interface SpeechRecognitionType {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string
      }
    }
  }
}

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Search'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'submit'])

const localValue = ref(props.modelValue)
const inputRef = ref<HTMLInputElement>()
const isListening = ref(false)
let recognition: SpeechRecognitionType | null = null
let debounceTimeout: ReturnType<typeof setTimeout> | null = null

// Longer debounce delay for better UX
const DEBOUNCE_DELAY = 600 // ms

const searchDisabled = computed(() => {
  return props.disabled || localValue.value.length < 2
})

watch(() => props.modelValue, (val) => {
  // Only update local value if it's different and input is not focused
  // This prevents losing cursor position while typing
  if (val !== localValue.value && document.activeElement !== inputRef.value) {
    localValue.value = val
  }
})

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  localValue.value = value
  
  // Clear existing timeout
  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
  }
  
  // Debounce the emit with longer delay
  debounceTimeout = setTimeout(() => {
    emit('update:modelValue', value)
  }, DEBOUNCE_DELAY)
}

function onSubmit() {
  // Clear debounce timeout and emit immediately on submit
  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
  }
  emit('update:modelValue', localValue.value)
  emit('submit', localValue.value)
  // Don't refocus - let the input maintain its current state
}

function onMicClick() {
  if (isListening.value) {
    stopListening()
    return
  }
  
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    // Show error to user
    window.alert('Sorry, your browser does not support speech recognition.')
    return
  }
  
  if (!recognition) {
    // Access browser's SpeechRecognition API
    interface WindowWithSpeechAPI {
      SpeechRecognition?: new () => SpeechRecognitionType
      webkitSpeechRecognition?: new () => SpeechRecognitionType
    }
    
    const windowWithSpeech = window as unknown as WindowWithSpeechAPI
    
    const SpeechRecognitionConstructor = windowWithSpeech.SpeechRecognition || 
                                        windowWithSpeech.webkitSpeechRecognition
    
    if (!SpeechRecognitionConstructor) return
    
    recognition = new SpeechRecognitionConstructor()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript
      localValue.value = transcript
      
      // Clear debounce timeout for voice input
      if (debounceTimeout) {
        clearTimeout(debounceTimeout)
      }
      
      emit('update:modelValue', transcript)
      emit('submit', transcript)
      isListening.value = false
    }
    recognition.onerror = () => {
      isListening.value = false
    }
    recognition.onend = () => {
      isListening.value = false
    }
  }
  isListening.value = true
  recognition.start()
}

function stopListening() {
  if (recognition && isListening.value) {
    recognition.stop()
    isListening.value = false
  }
}
</script>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin: 0 auto;
  max-width: var(--container-width);
  background: transparent;
  border: none;
  box-shadow: none;
}
.search-bar-inner {
  display: flex;
  align-items: center;
  flex: 1 1 0%;
  padding: 0;
}
.search-input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 1.1rem;
  flex: 1 1 0%;
  padding: 12px 0;
  border-radius: 999px;
  margin-right: 12px;
  background: #fafafa;
}
.search-input:disabled {
  background: #f5f5f5;
}
.icon-btn {
  background: #fafafa;
  border: none;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.15s;
}
.icon-btn:active, .icon-btn:focus {
  background: #f0f0f0;
}
.search-btn {
  border-radius: 50%;
}
.mic-btn {
  margin-left: 8px;
  background: #fafafa;
  border: 1px solid #eee;
  transition: background 0.15s, border 0.15s;
}
.mic-btn[aria-pressed="true"] {
  background: #e3f0ff;
  border-color: #90caf9;
}
.mic-btn:active, .mic-btn:focus {
  background: #f0f0f0;
}
</style> 