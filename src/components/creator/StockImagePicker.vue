<template>
    <div class="stock-image-picker">
        <h2 class="text-lg font-medium mb-2">Stock Images</h2>
        <p class="text-sm text-gray-600 mb-4">Select a stock image to use for your thumbnail</p>
        <div class="stock-images-grid">
            <div v-for="(image, index) in stockImages" :key="index" 
                @click="selectImage(image.url)" class="cursor-pointer" :class="{ 'selected': selectedImage === image.url, 'opacity-50 cursor-not-allowed': isLoading }">
                <img :src="image.url" :alt="image.alt" class="stock-image" :class="{ 'opacity-50 cursor-not-allowed': isLoading }" />
            </div>
            <div class="refresh-button"><i v-if="!isLoading" class="fa-solid fa-refresh text-sm text-gray-500 cursor-pointer" @click="refreshImages" :class="{ 'opacity-50 cursor-not-allowed': isLoading }"></i>
            <i v-else class="fa-solid fa-spinner fa-spin"></i>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api, apiEndpoints } from '@/api'

interface StockImage {
    url: string
    alt: string
}

const emit = defineEmits<{
    (e: 'select', url: string): void
}>()

const selectedImage = ref<string | null>(null)
const isLoading = ref(false)

// Stock images could be moved to a separate config file or API call
const stockImages = ref<StockImage[]>([])

onMounted(async () => {
    const response = await api.get(apiEndpoints.stockImages)
    stockImages.value = response.data
})

function selectImage(url: string) {
    selectedImage.value = url
    emit('select', url)
}

async function refreshImages() {
    if (isLoading.value) return
    isLoading.value = true
    const response = await api.get(apiEndpoints.stockImages)
    stockImages.value = response.data
    isLoading.value = false
}
</script>

<style scoped>
.stock-image-picker {
    background: rgba(255, 255, 255, 0.95);
    padding: 1rem;
    border-top: 1px solid var(--color-border);
    z-index: 10;
    width: 100%;
}

.stock-images-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.5rem;
    width: 100%;
    position: relative;
}

.refresh-button {
    position: absolute;
    bottom: 0;
    right: 0;
    z-index: 10;
    margin-right: 0px;
    margin-bottom: -30px;
}

.stock-image-item {
    aspect-ratio: 1;
    border-radius: 0.5rem;
    overflow: hidden;
    cursor: pointer;
    border: 2px solid transparent;
    transition: all 0.2s ease;
}

.stock-image-item:hover {
    transform: scale(1.05);
    border-color: var(--color-primary);
}

.stock-image-item.selected {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary-light);
}

.stock-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

@media (max-width: 600px) {
    .stock-images-grid {
        gap: 0.1rem;
    }
}
</style>
