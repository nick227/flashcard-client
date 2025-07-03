<template>
  <div v-if="relatedSets.length > 0" class="w-full">
    <h2 class="text-xl font-semibold mb-4 text-center w-full">Related Sets</h2>
    <div v-if="loading" class="text-gray-500 text-sm">Loading related sets...</div>
    <div v-else-if="error" class="text-red-500 text-sm">{{ error }}</div>
    <div v-else-if="relatedSets.length === 0" class="text-gray-500 text-sm">No related sets found</div>
    <div v-else class="related-sets gap-4">
      <div 
        v-for="relatedSet in relatedSets" 
        :key="relatedSet.id"
        class="related-set-card bg-white border border-gray-200 rounded-lg p-4 transition-colors"
      >
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0">
            <div
            @click="navigateToSet(relatedSet.id)" 
            class="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer link">
              <img 
                v-if="relatedSet.thumbnail && !imageErrors[relatedSet.id]" 
                :src="relatedSet.thumbnail" 
                :alt="relatedSet.title"
                @error="handleImageError(relatedSet.id)"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center bg-gray-100">
                <i class="fas fa-layer-group text-gray-400"></i>
              </div>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <h3 
            @click="navigateToSet(relatedSet.id)" class="font-medium text-gray-900 truncate link cursor-pointer hover:underline w-full title">{{ relatedSet.title }}</h3>
            <p class="text-sm text-gray-500 line-clamp-2 w-full">{{ relatedSet.description }}</p>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                {{ relatedSet.category?.name || relatedSet.category }}
              </span>
              <span class="text-xs text-gray-500">{{ relatedSet.cardCount || 0 }} cards</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { api, getApiUrl, apiEndpoints } from '@/api'
import type { RelatedSet } from '@/types/flashCardSet'

const props = defineProps<{
  setId: number | string
}>()

const loading = ref(false)
const error = ref('')
const relatedSets = ref<RelatedSet[]>([])
const imageErrors = ref<Record<number, boolean>>({})

const fetchRelatedSets = async () => {
  if (!props.setId) return
  
  loading.value = true
  error.value = ''
  
  try {
    const response = await api.get(getApiUrl(`${apiEndpoints.sets.base}/${props.setId}/related`))
    relatedSets.value = response.data || []
  } catch (err) {
    console.error('Error fetching related sets:', err)
    error.value = 'Failed to load related sets'
  } finally {
    loading.value = false
  }
}

const handleImageError = (setId: number) => {
  imageErrors.value[setId] = true
}

const navigateToSet = (setId: number) => {
  window.location.href = `/sets/${setId}`
}

// Watch for setId changes and fetch related sets
watch(() => props.setId, (newId) => {
  if (newId) {
    fetchRelatedSets()
  }
}, { immediate: true })

onMounted(() => {
  if (props.setId) {
    fetchRelatedSets()
  }
})
</script>

<style scoped>
h3{
  margin: 0;
  padding: 0;
}
.related-sets {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: flex-start;
  justify-content: center;
  margin: 0 auto;
  max-width: var(--container-width);
}
.title {
  max-width: calc(var(--container-width) - 85px);
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: wrap;

}
</style>

