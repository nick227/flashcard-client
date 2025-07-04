<template>
  <section class="load-more-sets-section">
    <div class="witty-message">
      {{ wittyMessage }}
    </div>
    <button
      class="load-more-sets-btn"
      :class="{ 'loading': props.loading }"
      @click="$emit('loadMore')"
      :disabled="props.loading"
    >
      <span v-if="props.loading">Loading...</span>
      <span v-else>Show More Sets</span>
    </button>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, defineEmits } from 'vue'

const emit = defineEmits(['loadMore'])
const props = defineProps<{ loading?: boolean }>()

const messages = [
  "Still curious? There's always another set. Go on, see what's next.",
  "You could stop now. Or you could see more sets.",
  "Another set awaits. The journey continues.",
  "Scroll on. Knowledge is just a click away.",
  "More sets. Because why not?",
  "Curiosity didn't kill the cat. It just found more flashcards.",
  "You're not done yet. Neither are we.",
  "Keep going. The next set might surprise you.",
  "If you insist, here's another set.",
  "Learning never ends. Neither do these sets."
]

const wittyMessage = ref(messages[0])

onMounted(() => {
  wittyMessage.value = messages[Math.floor(Math.random() * messages.length)]
  console.log('[LoadMoreSetsButton.vue] Mounted, wittyMessage:', wittyMessage.value)
})
</script>

<style scoped>
.loading {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f0f0f0;
  color: #999;
  border-color: #999;
  transform: scale(1);
  animation: pulse 2s infinite;
}
.load-more-sets-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3.5rem 0 3rem 0;
  background: #fff;
  border-radius: 0.75rem;
  margin: 0 auto;
  max-width: 520px;
  width: 100%;
}
.witty-message {
  color: #222;
  font-size: 1.25rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 2.2rem;
  line-height: 1.6;
  letter-spacing: 0.01em;
  padding: 0 1.5rem;
}
.load-more-sets-btn {
  background: #fff;
  color: #e53935;
  font-size: 1.15rem;
  font-weight: 700;
  border: 2px solid #e53935;
  border-radius: 2.5rem;
  padding: 1.1rem 0;
  width: 90%;
  max-width: 340px;
  text-align: center;
  cursor: pointer;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
  outline: none;
  margin: 0 auto;
  letter-spacing: 0.01em;
}
.load-more-sets-btn:active {
  background: #ffeaea;
  color: #b71c1c;
  border-color: #b71c1c;
}
@keyframes pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style> 