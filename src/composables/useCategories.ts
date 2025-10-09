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
            // Ensure data is an array before calling slice
            if (Array.isArray(data)) {
                categories.value = data.slice(0, 12)
            } else {
                console.warn('Categories response is not an array:', data)
                categories.value = []
            }
        } catch (err) {
            error.value = 'Failed to load categories'
            console.error('Error loading categories:', err)
            categories.value = []
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