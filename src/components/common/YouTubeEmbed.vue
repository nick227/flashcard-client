<template>
  <div class="youtube-embed-container" :style="{ paddingBottom: aspectRatio + '%' }">
    <iframe
      :src="embedUrl"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
      class="youtube-iframe"
    ></iframe>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMediaUtils } from '@/composables/useMediaUtils'

const props = defineProps<{
  url: string
  aspectRatio?: number // Default is 16:9 (56.25%)
}>()

const { getYouTubeEmbedUrl } = useMediaUtils()

const embedUrl = computed(() => getYouTubeEmbedUrl(props.url))
const aspectRatio = computed(() => props.aspectRatio || 56.25) // 16:9 aspect ratio by default
</script>

<style scoped>
.youtube-embed-container {
  position: relative;
  width: 100%;
  height: 0;
  overflow: hidden;
  background: #000;
  border-radius: 0.5rem;
}

.youtube-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 0;
}
</style> 