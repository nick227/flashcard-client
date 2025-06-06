<template>
  <div class="funny-loading-indicator flex flex-col justify-center items-center py-16">
    <div class="minimal-spinner mb-6">
      <svg class="spinner-svg" width="56" height="56" viewBox="0 0 56 56">
        <circle class="spinner-bg" cx="28" cy="28" r="24" fill="none" stroke="#e5e7eb" stroke-width="4" />
        <circle class="spinner-fg" cx="28" cy="28" r="24" fill="none" stroke="#6366f1" stroke-width="4" stroke-linecap="round" />
      </svg>
    </div>
    <div class="funny-message chic-message text-center mt-2 animate-fade-in">
      {{ displayMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const funnyMessages = [
  "Loading something cool...",
  "Whoah slow down there skippy...",
  "What is the meaning of life...",
  "I mean what's the purpose...",
  "Just a sec, good things take time...",
  "Polishing the door knobs...",
  "Slow down young grasshopper...",
  "Hey man that's some good scrolling...",
  "Loading please be patient...",
  "Brewing up some knowledge..."
]

const props = defineProps<{ message?: string }>()
const displayMessage = computed(() => props.message || funnyMessages[Math.floor(Math.random() * funnyMessages.length)])
</script>

<style scoped>
.funny-loading-indicator {
  min-height: 180px;
  background: none;
}
.minimal-spinner {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.spinner-svg {
  width: 56px;
  height: 56px;
  display: block;
}
.spinner-bg {
  stroke-dasharray: 151;
  stroke-dashoffset: 0;
}
.spinner-fg {
  stroke-dasharray: 151;
  stroke-dashoffset: 120;
  animation: spinner-arc-minimal 1.1s cubic-bezier(.4,0,.2,1) infinite;
}
@keyframes spinner-arc-minimal {
  0% { stroke-dashoffset: 120; }
  50% { stroke-dashoffset: 30; }
  100% { stroke-dashoffset: 120; }
}
.chic-message {
  font-size: 1.1rem;
  color: #444;
  font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
  font-weight: 400;
  letter-spacing: 0.01em;
  line-height: 1.5;
  max-width: 320px;
  opacity: 0.92;
}
@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 0.6s cubic-bezier(.4,0,.2,1);
}
</style> 