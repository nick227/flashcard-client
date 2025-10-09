<template>
    <div v-if="view === 'all'" class="category-cloud">
        <div @click="handleCategoryClick(category)" class="category-cloud-item chip" v-for="category in categories" :key="category.id">
            <span class="category-cloud-item-name">{{ category.name }} ({{ category.setCount }})</span>
        </div>
    </div>
    <div v-else class="category-cloud">
        <div class="category-cloud-item chip" v-for="category in currentCategories" :key="category.id">
            <span class="category-cloud-item-name">{{ category.name }} ({{ category.setCount }})</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { api } from '@/api'
import { useRouter } from 'vue-router'

interface Category {
    id: number
    name: string
    setCount?: number
}

const categories = ref<Category[]>([])
const router = useRouter()

const handleCategoryClick = (category: Category) => {
    router.push(`/browse/${category.name}`)
}

const props = defineProps<{
    view: 'fader' | 'all'
}>()

const view = computed(() => props.view)

const fadeSetStart = ref(0)
const numCategoriesPerFade = ref(4)
const fadeInterval = ref<number | null>(null)
const fadeSpeed = ref(3000)

const currentCategories = computed(() => {
    if (categories.value.length === 0) return [];
    const start = fadeSetStart.value % categories.value.length;
    let end = start + numCategoriesPerFade.value;
    if (end > categories.value.length) {
        return [
            ...categories.value.slice(start),
            ...categories.value.slice(0, end - categories.value.length)
        ];
    }
    return categories.value.slice(start, end);
});

onMounted(async () => {
    try {
        const res = await api.get('/categories')
        // Handle both wrapped and direct responses
        const data = res.data?.data || res.data
        categories.value = Array.isArray(data) ? data : []

        if (fadeInterval.value) {
            clearInterval(fadeInterval.value)
        }
        
        if (categories.value.length > 0) {
            fadeInterval.value = window.setInterval(() => {
                fadeSetStart.value = (fadeSetStart.value + numCategoriesPerFade.value) % categories.value.length;
            }, fadeSpeed.value)
        }
    } catch (error) {
        console.error('Error loading categories:', error)
        categories.value = []
    }
})
</script>

<style scoped>
.category-cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;
    align-items: center;
    max-width: var(--container-width);
    margin: 0 auto;
}

.category-cloud-item {
    cursor: pointer;
}
.chip {
    padding: 7px 18px;
    border-radius: 999px;
    background: #f6f7f9;
    color: #222;
    font-weight: 500;
    font-size: 1rem;
    border: 1px solid #e5e7eb;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
    cursor: pointer;
    user-select: none;
    outline: none;
    letter-spacing: 0.01em;
}
.chip:hover, .chip:focus {
    background: #eceff1;
    border-color: #cbd5e1;
    color: #111;
}
.chip:active {
    background: #e5e7eb;
    color: #222;
    border-color: #cbd5e1;
}
</style>