<template>
  <div class="panel-river-mobile max-w-3xl">
    <div v-for="card in cards" :key="card.id" class="panel-river-item">
      <div class="panel-face front">
        <div class="panel-content formatted-content">
          <img v-if="card.front.imageUrl" :src="card.front.imageUrl" class="max-w-full max-h-full object-contain" />
          <div v-if="card.front.text" class="panel-text">{{ card.front.text }}</div>
        </div>
      </div>
      <div class="panel-face back">
        <div class="panel-content formatted-content">
          <img v-if="card.back.imageUrl" :src="card.back.imageUrl" class="max-w-full max-h-full object-contain" />
          <div v-if="card.back.text" class="panel-text">{{ card.back.text }}</div>
        </div>
        <div v-if="card.hint" class="panel-hint">{{ card.hint }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Card } from '@/types/card'
defineProps<{ cards: Card[] }>()
</script>

<style scoped>
.panel-river-mobile {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  margin: 0 auto;
}
.panel-river-item {
  display: flex;
  flex-direction: column;
  gap: 0;
  background: transparent;
  border-radius: 1.25rem;
  box-shadow: none;
  padding: 0;
  width: 100%;
  min-height: 420px;
}
.panel-face {
  width: 100%;
  min-height: 400px;
  border-radius: 1rem;
  box-shadow: 0 4px 24px 0 rgba(30, 41, 59, 0.08);
  margin-bottom: 1.2rem;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.panel-face.back {
  background: #2563eb;
  color: #fff;
}
.formatted-content {
  text-align: center;
  padding: 2rem;
  width: 100%;
  max-width: 100%;
  overflow-wrap: break-word;
  word-wrap: break-word;
  hyphens: auto;
  user-select: text;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}
.panel-img {
  max-width: 100%;
  max-height: 220px;
  object-fit: contain;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(30,41,59,0.10);
  background: #f8fafc;
}
.panel-text {
  font-size: 3.3rem;
  font-weight: 600;
  color: inherit;
  line-height: 1.5;
  margin-top: 0.5rem;
}
.panel-hint {
  font-size: 1.05rem;
  color: #e0e7ef;
  margin-top: 0.5rem;
  font-style: italic;
  opacity: 0.85;
  text-align: center;
}
@media (max-width: 600px) {
  .panel-river-mobile {
    max-width: 100vw;
    padding: 1rem 0.25rem;
  }
  .panel-face {
    min-height: 180px;
    padding: 0.5rem;
  }
  .formatted-content {
    padding: 1rem;
  }
  .panel-img {
    max-height: 120px;
  }
  .panel-text {
    font-size: 1.05rem;
  }
}
</style> 