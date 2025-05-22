<template>
  <section v-if="set" class="featured-set">
    <div class="featured-content">
      <div class="featured-image">
        <img :src="set.thumbnail" :alt="set.title + ' Thumbnail'" class="rounded-xl shadow-xl w-full h-full object-cover" />
      </div>
      <div class="featured-info">
        <div v-if="set.category" @click="router.push({ path: '/browse/' + set.category })" class="category-badge link">
          {{ set.category }}
        </div>
        <div v-else class="category-badge link">Uncategorized</div>
        <h2 class="title">{{ set.title }}</h2>
        <p class="description">{{ set.description }}</p>
        
        <div class="tags-container">
          <span v-for="tag in set.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>

        <div class="price-info">
          <span v-if="set.isSubscriberOnly" class="price-subscribers">Subscribers Only</span>
          <span v-else-if="set.price && set.price > 0" class="price-premium">${{ set.price }}</span>
          <span v-else class="price-free">Free</span>
        </div>

        <div class="actions">
          <button class="button button-primary" @click="$emit('view', set.id)">
            Try This Set
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { FlashCardSet } from '@/types'
import { useRouter } from 'vue-router'
import { watch } from 'vue'

const router = useRouter()

const props = defineProps<{
  set: FlashCardSet | null
}>()

// Watch for changes to the set prop
watch(() => props.set, (newSet) => {
  console.log('Featured Set updated:', JSON.parse(JSON.stringify(newSet)))
}, { immediate: true })

defineEmits<{
  (e: 'view', setId: number): void
}>()
</script>

<style scoped>
.featured-set {
  @apply w-full py-16 px-4 md:px-8 mb-16 bg-gradient-to-r from-gray-50 to-white;
}

.featured-content {
  @apply max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 items-center;
}

.featured-image {
  @apply w-full lg:w-1/2 min-h-[400px] lg:h-[500px];
}

.featured-info {
  @apply flex-1 flex flex-col gap-6;
}

.category-badge {
  @apply inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200 transition-colors duration-200;
}

.title {
  @apply text-4xl font-bold leading-tight;
}

.description {
  @apply text-xl text-gray-600 leading-relaxed;
}

.tags-container {
  @apply flex flex-wrap gap-2;
}

.tag {
  @apply px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700;
}

.price-info {
  @apply mt-2;
}

.price-free {
  @apply text-green-600 font-semibold text-lg;
}

.price-subscribers {
  @apply text-blue-600 font-semibold text-lg;
}

.price-premium {
  @apply text-purple-600 font-semibold text-lg;
}

.actions {
  @apply flex flex-col sm:flex-row gap-4 mt-6;
}

.button {
  @apply px-6 py-3 rounded-lg font-medium transition-all duration-200;
}

.button-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}

.button-outline {
  @apply border-2 border-blue-600 text-blue-600 hover:bg-blue-50;
}
</style> 