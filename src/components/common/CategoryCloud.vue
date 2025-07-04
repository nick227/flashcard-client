<template>
    <div class="category-cloud">
        <div @click="handleCategoryClick(category)" class="category-cloud-item chip" v-for="category in categories" :key="category.id">
            <span class="category-cloud-item-name">{{ category.name }} ({{ category.setCount }})</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/api'
import { useRouter } from 'vue-router'

const categories = ref<any[]>([])
const router = useRouter()

const handleCategoryClick = (category: any) => {
    router.push(`/browse/${category.name}`)
}

onMounted(async () => {
    const res = await api.get('/categories')
    categories.value = res.data
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