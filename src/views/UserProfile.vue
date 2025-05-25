<template>

  <div class="container mx-auto px-4 py-8 min-h-screen bg-gray-50">
    <!-- Authenticated user profile view -->
    <div v-if="isAuthenticated && user" class="max-w-6xl mx-auto">
      <!-- Profile header card -->
      <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
        <div class="flex items-center gap-6">
          <!-- Profile image section -->
          <div class="relative flex flex-col gap-4 items-center">
            <div class="group-upload">
              <img v-if="user.image" @click="triggerFileInput" :src="user.image" alt="avatar"
                class="w-24 h-24 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity" />
              <div @click="triggerFileInput" v-else
                class="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors">
                <i class="fa-solid fa-user text-gray-400 text-3xl"></i>
              </div>
              <div class="w-full text-center h-8">
                <a @click="triggerFileInput"
                  class="upload-text hidden text-sm text-gray-500 hover:text-gray-700 cursor-pointer">upload</a>
              </div>
            </div>
            <!-- Loading spinner during upload -->
            <div v-if="uploading"
              class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
            <!-- Logout button -->
            <button @click="logout" class="button button-dark">Logout</button>
          </div>
          <!-- User information -->
          <div class="flex-1">
            <h1 class="text-2xl font-bold mb-2">{{ user.name }}</h1>
            <p class="text-gray-600 mb-1">{{ user.email }}</p>
            <p class="text-gray-500">{{ user.role }}</p>
            <div class="mt-2">
              <textarea v-model="user.bio" class="w-full p-2 border rounded-lg" placeholder="Add a bio..." rows="3"
                @blur="updateBio"></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- Dashboard Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Favorites -->
        <DataGrid title="Favorites" icon="fas fa-heart" iconColor="#ef4444" :loading="favorites.loading.value"
          :items="favorites.items.value" :total-items="favorites.totalItems.value"
          :current-page="favorites.currentPage.value" :page-size="6"
          :empty-message="favorites.error.value || 'No favorites yet'" @page-change="handleFavoritesPageChange">
          <template #default="{ items }">
            <div class="grid grid-cols-1 md:grid-cols-2 .lg:grid-cols-1 gap-4">
              <FavoriteItem v-for="item in items as Favorite[]" :key="item.id" :item="item" />
            </div>
          </template>
        </DataGrid>

        <!-- Purchases -->
        <DataGrid title="Purchases" icon="fas fa-shopping-cart" iconColor="#10b981" :loading="purchases.loading.value"
          :items="purchases.items.value" :total-items="purchases.totalItems.value"
          :current-page="purchases.currentPage.value" :page-size="6"
          :empty-message="purchases.error.value || 'No purchases yet'" @page-change="handlePurchasesPageChange">
          <template #default="{ items }">
            <div class="grid grid-cols-1 md:grid-cols-2 .lg:grid-cols-1 gap-4">
              <PurchaseItem v-for="item in items as Purchase[]" :key="item.id" :purchase="item" />
            </div>
          </template>
        </DataGrid>

        <!-- Subscriptions -->
        <DataGrid title="Subscriptions" icon="fas fa-crown" iconColor="#f59e0b" :loading="subscriptions.loading.value"
          :items="subscriptions.items.value" :total-items="subscriptions.totalItems.value"
          :current-page="subscriptions.currentPage.value" :page-size="6"
          :empty-message="subscriptions.error.value || 'No subscriptions yet'"
          @page-change="handleSubscriptionsPageChange">
          <template #default="{ items }">
            <div class="grid grid-cols-1 md:grid-cols-2 .lg:grid-cols-1 gap-4">
              <SubscriptionItem v-for="item in items as Subscription[]" :key="item.id" :subscription="item" />
            </div>
          </template>
        </DataGrid>

        <!-- View History -->
        <DataGrid title="View History" icon="fas fa-clock" iconColor="#0ea5e9" :loading="viewHistory.loading.value"
          :items="viewHistory.items.value" :total-items="viewHistory.totalItems.value"
          :current-page="viewHistory.currentPage.value" :page-size="6"
          :empty-message="viewHistory.error.value || 'No view history yet'" @page-change="handleViewHistoryPageChange">
          <template #default="{ items }">
            <div class="grid grid-cols-1 md:grid-cols-2 .lg:grid-cols-1 gap-4">
              <ViewHistoryItem v-for="item in items as ViewHistory[]" :key="item.id" :item="item" />
            </div>
          </template>
        </DataGrid>
      </div>
    </div>

    <!-- Unauthenticated user view -->
    <div v-else class="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
      <div class="text-center">
        <h2 class="text-2xl font-bold mb-4">Welcome to Flashcard Academy</h2>
        <p class="text-gray-600 mb-6">Please log in to view your profile and access your content.</p>
        <router-link to="/login" class="button button-accent">Login / Register</router-link>
      </div>
    </div>

    <!-- Hidden file input for image upload -->
    <input type="file" id="user-image" class="hidden" accept="image/*" @change="updateUserImage" />
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api, apiEndpoints } from '@/api/index'
import DataGrid from '@/components/common/DataGrid.vue'
import { usePaginatedData } from '@/composables/usePaginatedData'
import FavoriteItem from '@/components/user/FavoriteItem.vue'
import PurchaseItem from '@/components/user/PurchaseItem.vue'
import SubscriptionItem from '@/components/user/SubscriptionItem.vue'
import ViewHistoryItem from '@/components/user/ViewHistoryItem.vue'

// TypeScript interfaces
import type { Favorite } from '@/types'
import type { Purchase } from '@/types'
import type { Subscription } from '@/types'
import type { ViewHistory } from '@/services/historyService'

// Router and auth store setup
const router = useRouter()
const auth = useAuthStore()
const user = computed(() => auth.user)
const isAuthenticated = computed(() => auth.isAuthenticated)

// Initialize paginated data
const favorites = usePaginatedData<Favorite>(apiEndpoints.sets, {
  userId: user.value?.id,
  queryParams: {
    liked: true,
    userId: user.value?.id,
    user_id: user.value?.id
  },
  pageSize: 6
})

const purchases = usePaginatedData<Purchase>(apiEndpoints.purchases, {
  userId: user.value?.id,
  pageSize: 6
})

const subscriptions = usePaginatedData<Subscription>(apiEndpoints.subscriptions, {
  userId: user.value?.id,
  pageSize: 6
})

const viewHistory = usePaginatedData<ViewHistory>(apiEndpoints.history, {
  pageSize: 6
})

// Upload state
const uploading = ref(false)

// Logout handler
const logout = () => {
  auth.logout()
  router.push('/login')
}

// Handle profile image upload
const updateUserImage = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target?.files?.length) return

  try {
    uploading.value = true
    const formData = new FormData()
    const file = target.files[0]
    formData.append('image', file)

    const token = auth.jwt
    if (!token) throw new Error('No authentication token found')

    const res = await api.patch(`${apiEndpoints.users}/${user.value?.id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    })

    if (user.value && res.data.image) {
      user.value.image = res.data.image
    }
  } catch (err) {
    console.error('Failed to upload image:', err)
  } finally {
    uploading.value = false
    if (target) target.value = ''
  }
}

// Trigger file input click
const triggerFileInput = () => {
  const file = document.getElementById('user-image') as HTMLInputElement
  file?.click()
}

// Fetch initial data
onMounted(() => {
  if (isAuthenticated.value) {
    favorites.fetchData()
    purchases.fetchData()
    subscriptions.fetchData()
    viewHistory.fetchData()
  }
})

// Page change handlers
const handleFavoritesPageChange = (page: number) => {
  favorites.fetchData(page)
}

const handlePurchasesPageChange = (page: number) => {
  purchases.fetchData(page)
}

const handleSubscriptionsPageChange = (page: number) => {
  subscriptions.fetchData(page)
}

const handleViewHistoryPageChange = (page: number) => {
  viewHistory.fetchData(page)
}

// Bio update handler
const updateBio = async () => {
  try {
    const token = auth.jwt
    if (!token) throw new Error('No authentication token found')

    const res = await api.patch(`${apiEndpoints.users}/${user.value?.id}/bio`, {
      bio: user.value?.bio
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (user.value && res.data.bio) {
      user.value.bio = res.data.bio
    }
  } catch (err) {
    console.error('Failed to update bio:', err)
  }
}
</script>

<style scoped>
.group-upload:hover .upload-text {
  display: inline;
}
</style>