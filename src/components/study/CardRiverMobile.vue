<template>
  <div class="panel-river-mobile max-w-3xl">
    <div v-for="card in cards" :key="card.id" class="panel-river-item">
      <div class="panel-face front">
        <div class="panel-content formatted-content">
          <img v-if="getFrontImage(card) && !isYouTubeUrl(getFrontImage(card))" :src="getFrontImage(card)" class="max-w-full max-h-full object-contain" />
          <div v-if="getFrontImage(card) && isYouTubeUrl(getFrontImage(card))" class="youtube-embed" v-html="getYouTubeEmbed(getFrontImage(card)!)"></div>
          <div v-if="getFrontText(card)" class="panel-text" v-html="getFrontText(card)"></div>
        </div>
      </div>
      <div class="panel-face back">
        <div class="panel-content formatted-content">
          <img v-if="getBackImage(card) && !isYouTubeUrl(getBackImage(card))" :src="getBackImage(card)" class="max-w-full max-h-full object-contain" />
          <div v-if="getBackImage(card) && isYouTubeUrl(getBackImage(card))" class="youtube-embed" v-html="getYouTubeEmbed(getBackImage(card)!)"></div>
          <div v-if="getBackText(card)" class="panel-text" v-html="getBackText(card)"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Card } from '@/types/card'

defineProps<{ cards: Card[] }>()

const getFrontText = (card: Card): string | undefined => {
  return card.front?.content ? processTextContent(card.front.content) : undefined
}

const getFrontImage = (card: Card): string | undefined => {
  return card.front?.mediaUrl || undefined
}

const getBackText = (card: Card): string | undefined => {
  return card.back?.content ? processTextContent(card.back.content) : undefined
}

const getBackImage = (card: Card): string | undefined => {
  return card.back?.mediaUrl || undefined
}

// Simple YouTube URL detection and iframe generation
const processTextContent = (content: string): string => {
  if (!content) return ''
  // Check if content is a YouTube URL
  const youtubeId = extractYouTubeId(content)
  if (youtubeId) {
    return `<div class="youtube-embed">
      <iframe 
        width="100%" 
        height="100%" 
        src="https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&autoplay=0" 
        frameborder="0" 
        allow="fullscreen" 
        loading="lazy"
        referrerpolicy="no-referrer"
        title="YouTube video player"
      ></iframe>
    </div>`
  }
  // Return original content if not a YouTube URL
  return content
}

const extractYouTubeId = (url: string): string | null => {
  const cleanedUrl = url.replace(/\s+/g, '').trim()
  if (!cleanedUrl) return null
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*&v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/
  ]
  for (const pattern of patterns) {
    const match = cleanedUrl.match(pattern)
    if (match?.[1] && /^[a-zA-Z0-9_-]{11}$/.test(match[1])) {
      return match[1]
    }
  }
  return null
}

const isYouTubeUrl = (url: string | undefined): boolean => {
  if (!url) return false
  const cleanedUrl = url.replace(/\s+/g, '').trim()
  return cleanedUrl.startsWith('https://www.youtube.com/') || cleanedUrl.startsWith('https://youtu.be/')
}

const getYouTubeEmbed = (url: string): string => {
  const youtubeId = extractYouTubeId(url)
  if (youtubeId) {
    return `<div class="youtube-embed">
      <iframe 
        width="100%" 
        height="100%" 
        src="https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&autoplay=0" 
        frameborder="0" 
        allow="fullscreen" 
        loading="lazy"
        referrerpolicy="no-referrer"
        title="YouTube video player"
      ></iframe>
    </div>`
  }
  return ''
}
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
  width: calc(100% - 2rem);
  margin: 0 auto;
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

.youtube-embed {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 200px;
  border-radius: 0.5rem;
  overflow: hidden;
}

.youtube-embed iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
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
  .youtube-embed {
    min-height: 150px;
  }
}
</style> 