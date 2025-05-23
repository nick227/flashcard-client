import { ref, onMounted } from 'vue'
import { fetchCategories } from '@/api'

export function useCategories() {
    const categories = ref<{ id: number; name: string }[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    const loadCategories = async () => {
        loading.value = true
        error.value = null
        try {
            const data = await fetchCategories()
            // Take only the first 12 categories
            categories.value = data.slice(0, 12)
        } catch (err) {
            error.value = 'Failed to load categories'
            console.error('Error loading categories:', err)
        } finally {
            loading.value = false
        }
    }

    onMounted(() => {
        loadCategories()
    })

    return {
        categories,
        loading,
        error
    }
} 