<template>
  <div class="py-8x">
    <div class="w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col">
      <!-- Random Categories with Sets -->
      <div class="bg-white rounded-2xl p-8 border border-gray-200">
        <h2 class="text-2xl font-bold text-gray-900 flex justify-center mb-8">Categories</h2>
        <div class="grid grid-cols-1 gap-6">
          <div v-for="category in randomCategories" :key="category.id" class="flex flex-col gap-2 bg-gray-50 rounded-lg p-4">
            <div class="flex items-center gap-2 mb-2">
              <span class="font-semibold text-lg text-gray-800">{{ category.name }}</span>
              <span class="text-xs text-gray-500">({{ category.sets.length }} sets)</span>
            </div>
            <ul class="flex flex-col gap-1">
              <li v-for="set in category.sets.slice(0, 3)" :key="set.id" class="flex items-center gap-2">
                <img v-if="set.thumbnail" :src="set.thumbnail" alt="thumb" @error="handleImageError" class="w-6 h-6 rounded object-cover" />
                <div v-else class="w-6 h-6 rounded bg-gray-200"><i class="fa-solid fa-image"></i></div>
                <a :href="`/sets/${set.id}`" class="text-blue-600 hover:underline text-sm">{{ set.title }}</a>
                <span v-if="set.educatorName" class="flex items-center gap-1 text-xs text-gray-400">
                  <img v-if="set.educatorImage" :src="set.educatorImage" alt="avatar" class="w-5 h-5 rounded-full object-cover" />
                  <span v-else class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-gray-500 text-xs font-bold">{{ set.educatorName.charAt(0) }}</span>
                  by {{ set.educatorName }}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Random categories with sets
const randomCategories = ref<any[]>([])
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = 'https://via.placeholder.com/150'
}


onMounted(async () => {

  // Random categories with sets
  try {
    const categoriesData = await (await import('@/services/CachedApiService')).cachedApiEndpoints.getRandomCategoriesWithSets(8, 10)
    randomCategories.value = categoriesData as any[]
  } catch (error) {
    randomCategories.value = []
  }
})
</script>