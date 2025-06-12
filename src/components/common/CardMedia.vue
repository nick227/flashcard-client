<template>
  <div class="card-media" :class="{ 'is-loading': isLoading }">
    <img
      v-if="type === 'image'"
      :src="url"
      :alt="alt"
      @load="onLoad"
      @error="onError"
      class="media-image"
    />
    <iframe
      v-else-if="type === 'youtube'"
      :src="embedUrl"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
      class="media-iframe"
    ></iframe>
    <a
      v-else-if="type === 'link'"
      :href="url"
      target="_blank"
      rel="noopener noreferrer"
      class="media-link"
    >
      {{ url }}
    </a>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { MediaType } from '@/types/media'

const props = defineProps<{
  type: MediaType
  url: string
  alt?: string
}>()

const emit = defineEmits(['error'])

const isLoading = ref(true)

// Immediately remove loading for YouTube and links
watch(
  () => props.type,
  (type) => {
    if (type === 'youtube' || type === 'link') {
      isLoading.value = false;
    }
  },
  { immediate: true }
)

// Log initial props
console.log('CardMedia - Component created with props:', {
  type: props.type,
  url: props.url,
  alt: props.alt
})

// Compute YouTube embed URL (robust extraction)
const embedUrl = computed(() => {
  if (props.type !== 'youtube') return '';
  // Extract the video ID from various YouTube URL formats
  const match = props.url.match(/(?:v=|\/embed\/|youtu\.be\/)([\w-]{11})/);
  const videoId = match ? match[1] : null;
  const embed = videoId ? `https://www.youtube.com/embed/${videoId}` : '';
  console.log('CardMedia - Computed embedUrl:', { url: props.url, videoId, embed });
  return embed;
});

onMounted(() => {
  console.log('CardMedia - Component mounted:', {
    type: props.type,
    url: props.url,
    alt: props.alt,
    isLoading: isLoading.value,
    embedUrl: embedUrl.value
  })
})

const onLoad = () => {
  console.log('CardMedia - Media loaded:', {
    type: props.type,
    url: props.url
  })
  isLoading.value = false
}

const onError = (e: Event) => {
  console.error('CardMedia - Media error:', {
    type: props.type,
    url: props.url,
    error: e
  })
  isLoading.value = false
  emit('error', e)
}
</script>

<style scoped>
.card-media {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 8px;
  background: #f5f5f5;
}

.card-media.is-loading::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

.media-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.media-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.media-link {
  color: #0066cc;
  text-decoration: none;
  word-break: break-all;
  padding: 1rem;
  text-align: center;
}

.media-link:hover {
  text-decoration: underline;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style> 