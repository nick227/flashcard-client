<template>
  
  <div class="container-main  flex flex-col items-center justify-center py-16 min-h-screen">
    <div v-if="loading" class="text-gray-500">Loading profile...</div>
    <div v-else-if="error" class="text-red-500">{{ error }}</div>
    <div v-else-if="educator" class="w-full max-w-6xl">
      <!-- Educator Info Section -->
      <div class="flex items-center gap-6 mb-12">
        <div class="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
          <img 
            v-if="educator.image" 
            :src="educator.image" 
            :alt="educator.name" 
            class="w-full h-full object-cover"
          />
          <i v-else class="fa-solid fa-user text-4xl text-gray-400"></i>
        </div>
        <div>
          <h1 class="text-3xl font-bold mb-2">{{ educator.name }}</h1>
          <p v-if="educator.bio" class="text-gray-600 mb-4">{{ educator.bio }}</p>
          <p v-else class="text-gray-400 italic">No bio available</p>
        </div>
      </div>

      <!-- Sets Grid -->
      <div class="mb-8">
        <h2 class="text-2xl font-semibold mb-6">Flash Card Sets</h2>
        <div v-if="loading" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <div v-else-if="sets && sets.length === 0" class="text-gray-500">
          This educator hasn't created any sets yet.
        </div>
        <div v-else-if="sets && sets.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SetPreviewCard
            v-for="set in sets"
            :key="set.id"
            :set="set"
            @view="viewSet"
          />
        </div>
      </div>
    </div>
    <div v-else class="text-red-500">Educator not found</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import SetPreviewCard from '@/components/cards/SetPreviewCard.vue'
import { api } from '@/api'
import type { User, FlashCardSet } from '@/types'

const route = useRoute()

// The userName from the URL is the target educator's name
const targetEducatorName = route.params.userName as string
const educator = ref<User | null>(null)
const sets = ref<FlashCardSet[]>([])
const loading = ref(true)
const error = ref('')

const currentPage = ref(1)
const pageSize = ref(12)
const totalPages = ref(1)

const fetchEducator = async () => {
  try {
    const res = await api.get(`/users?name=${targetEducatorName}`)
    const userData = Array.isArray(res.data) ? res.data[0] : res.data
    
    if (!userData) {
      error.value = 'Educator not found'
      return
    }

    educator.value = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      image: userData.image,
      bio: userData.bio,
      created_at: userData.created_at,
      updated_at: userData.updated_at,
      role: userData.role || { id: 1, name: 'user' }
    }

    if (educator.value && educator.value.id) {
      await fetchSets()
    } else {
      sets.value = []
    }
  } catch (err) {
    console.error('Error fetching educator:', err)
    error.value = 'Failed to load educator profile'
    educator.value = null
    sets.value = []
  }
}

const fetchSets = async () => {
  try {
    loading.value = true
    
    const res = await api.get(`/sets`, {
      params: {
        educator_id: educator.value?.id,
        page: currentPage.value,
        limit: pageSize.value
      }
    })

    if (!res.data || !res.data.items) {
      sets.value = []
      return
    }

    const items = Array.isArray(res.data.items) ? res.data.items : []
    
    sets.value = items.map((set: any) => {
      const mappedSet: any = {
        id: set.id,
        title: set.title,
        description: set.description,
        image: set.image || set.thumbnail || '/images/default-set.png',
        thumbnail: set.image || set.thumbnail || '/images/default-set.png',
        educatorName: set.educatorName || educator.value?.name || '',
        price: set.price || { type: 'free' },
        category: typeof set.category === 'string' ? set.category : (set.category?.name || 'Uncategorized'),
        tags: Array.isArray(set.tags) ? set.tags.map((tag: any) => typeof tag === 'string' ? tag : tag.name).filter(Boolean) : [],
        createdAt: set.createdAt || set.created_at,
        updatedAt: set.updatedAt || set.updated_at,
        cardsCount: Array.isArray(set.cards) ? set.cards.length : 0,
        type: set.type || 'public',
        isPublic: true,
        isPurchased: false,
        isLiked: false,
        hidden: set.hidden || false,
        views: set.views || 0,
        likes: set.likes || 0,
        educatorId: set.educatorId || educator.value?.id,
        educatorImage: set.educatorImage || educator.value?.image || undefined
      }
      if (Array.isArray(set.cards)) {
        mappedSet.cards = set.cards.map((card: any) => ({
          id: card.id,
          front: typeof card.front === 'object'
            ? card.front
            : {
                content: card.front ?? '',
                mediaUrl: card.front_image ?? null,
                layout: card.layout_front ?? 'default'
              },
          back: typeof card.back === 'object'
            ? card.back
            : {
                content: card.back ?? '',
                mediaUrl: card.back_image ?? null,
                layout: card.layout_back ?? 'default'
              },
          hint: card.hint ?? null,
          front_image: card.front_image ?? null,
          back_image: card.back_image ?? null,
          layout_front: card.layout_front ?? undefined,
          layout_back: card.layout_back ?? undefined
        }))
      }
      return mappedSet
    })

    totalPages.value = res.data.pagination?.totalPages || 1
  } catch (err) {
    console.error('Error fetching sets:', err)
    error.value = 'Failed to load sets'
    sets.value = []
  } finally {
    loading.value = false
  }
}

const viewSet = (setId: number) => {
  //router.push(`/study/${setId}`)
  window.location.href = '/study/' + setId
}

onMounted(async () => {
  loading.value = true
  error.value = ''
  await fetchEducator()
  loading.value = false
})
</script>