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
              <div class="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                <img v-if="user.image && !imageError" 
                  @click="triggerFileInput" 
                  :src="user.image" 
                  :alt="user.name"
                  class="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                  @error="handleImageError" />
                <div v-else
                  @click="triggerFileInput"
                  class="w-full h-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                  <i class="fa-solid fa-user text-gray-400 text-3xl"></i>
                </div>
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
              <div v-if="!isEditingBio" 
                @click="startEditingBio"
                class="bio-display p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group relative">
                <p v-if="user.bio" class="whitespace-pre-wrap">{{ user.bio }}</p>
                <p v-else class="text-gray-400 italic">Add a bio...</p>
                <div class="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <i class="fas fa-edit text-gray-400"></i>
                </div>
              </div>
              <textarea v-else
                ref="bioTextarea"
                v-model="editingBio"
                class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add a bio..."
                rows="3"
                @blur="handleBioUpdate"
                @keydown.esc="cancelBioEdit"></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- Dashboard Grid -->
      <div class="grid grid-cols-1 gap-8">
        <!-- Favorites -->
        <DataGrid title="Favorites" icon="fas fa-heart" iconColor="#ef4444" :loading="favorites.loading.value"
          :items="favorites.items.value" :total-items="favorites.totalItems.value"
          :current-page="favorites.currentPage.value" :page-size="6"
          :empty-message="favorites.error.value || 'No favorites yet'" @page-change="handleFavoritesPageChange">
          <template #default="{ items }">
            <div class="grid grid-cols-1 gap-4">
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
            <div class="grid grid-cols-1 gap-4">
              <PurchaseItem v-for="item in items as Purchase[]" :key="item.id" :item="item" />
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
            <div class="grid grid-cols-1 gap-4">
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
            <div class="grid grid-cols-1 gap-4">
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
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { api, apiEndpoints } from '@/api'
import DataGrid from '@/components/common/DataGrid.vue'
import { usePaginatedData } from '@/composables/usePaginatedData'
import FavoriteItem from '@/components/user/FavoriteItem.vue'
import PurchaseItem from '@/components/user/PurchaseItem.vue'
import SubscriptionItem from '@/components/user/SubscriptionItem.vue'
import ViewHistoryItem from '@/components/user/ViewHistoryItem.vue'
import { useAuthStore } from '@/stores/auth'

// TypeScript interfaces
import type { Favorite } from '@/types'
import type { Purchase } from '@/types'
import type { Subscription } from '@/types'
import type { ViewHistory } from '@/services/historyService'

// Router and auth store setup
const router = useRouter()
const auth = useAuthStore()
const user = computed(() => {
  const userData = auth.user
  console.log('UserProfile - Current user data:', userData)
  return userData
})
const isAuthenticated = computed(() => auth.isAuthenticated)
const imageError = ref(false)
const uploading = ref(false)

// Bio editing state
const isEditingBio = ref(false)
const editingBio = ref('')
const bioTextarea = ref<HTMLTextAreaElement | null>(null)

// Watch for user changes to ensure bio is loaded
watch(() => user.value, (newUser) => {
  if (newUser) {
    console.log('UserProfile - User data updated:', {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      bio: newUser.bio,
      role: newUser.role,
      image: newUser.image
    })
  }
}, { immediate: true })

// Initialize paginated data
const favoritesEndpoint = computed(() => {
  if (!user.value?.id) return ''
  return apiEndpoints.sets.getUserLikes(user.value.id)
})

const purchasesEndpoint = computed(() => {
  if (!user.value?.id) return ''
  return `${apiEndpoints.purchases}/user`
})

const subscriptionsEndpoint = computed(() => {
  if (!user.value?.id) return ''
  return `${apiEndpoints.subscriptions}/user`
})

const viewHistoryEndpoint = computed(() => {
  if (!user.value?.id) return ''
  return `${apiEndpoints.history.base}/user`
})

const favorites = usePaginatedData<Favorite>(favoritesEndpoint.value, {
  userId: user.value?.id,
  queryParams: {
    limit: 6
  },
  pageSize: 6
})

const purchases = usePaginatedData<Purchase>(purchasesEndpoint.value, {
  userId: user.value?.id,
  queryParams: {
    limit: 6
  },
  pageSize: 6
})

const subscriptions = usePaginatedData<Subscription>(subscriptionsEndpoint.value, {
  userId: user.value?.id,
  queryParams: {
    limit: 6
  },
  pageSize: 6
})

const viewHistory = usePaginatedData<ViewHistory>(viewHistoryEndpoint.value, {
  userId: user.value?.id,
  queryParams: {
    limit: 6
  },
  pageSize: 6
})

// Watch for user changes and update endpoints
watch(() => user.value?.id, (newId) => {
  if (newId) {
    favorites.fetchData()
    purchases.fetchData()
    subscriptions.fetchData()
    viewHistory.fetchData()
  }
})

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
    const file = target.files[0]
    await updateProfileImage(file)
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
onMounted(async () => {
  if (isAuthenticated.value) {
    console.log('UserProfile - Fetching initial data for user:', user.value?.id)
    try {
      // Force refresh user data
      const response = await api.get('/users/me')
      console.log('UserProfile - Fresh user data from /me:', response.data)
      if (response.data) {
        auth.setUser(response.data)
      }
    } catch (error) {
      console.error('UserProfile - Error fetching user data:', error)
    }
    
    favorites.fetchData()
    purchases.fetchData()
    subscriptions.fetchData()
    viewHistory.fetchData()
  }
})

// Page change handlers
const handleFavoritesPageChange = async (page: number) => {
  console.log('UserProfile - Favorites Page Change:', {
    page,
    currentItems: favorites.items.value.length,
    currentTotal: favorites.totalItems.value,
    currentPage: favorites.currentPage.value
  })
  await favorites.fetchData(page)
  console.log('UserProfile - Favorites Data Updated:', {
    newItems: favorites.items.value.length,
    newTotal: favorites.totalItems.value,
    newPage: favorites.currentPage.value,
    firstItem: favorites.items.value[0]
  })
}

const handlePurchasesPageChange = async (page: number) => {
  console.log('UserProfile - Purchases Page Change:', {
    page,
    currentItems: purchases.items.value.length,
    currentTotal: purchases.totalItems.value,
    currentPage: purchases.currentPage.value
  })
  await purchases.fetchData(page)
  console.log('UserProfile - Purchases Data Updated:', {
    newItems: purchases.items.value.length,
    newTotal: purchases.totalItems.value,
    newPage: purchases.currentPage.value,
    firstItem: purchases.items.value[0]
  })
}

const handleSubscriptionsPageChange = async (page: number) => {
  console.log('UserProfile - Subscriptions Page Change:', {
    page,
    currentItems: subscriptions.items.value.length,
    currentTotal: subscriptions.totalItems.value,
    currentPage: subscriptions.currentPage.value
  })
  await subscriptions.fetchData(page)
  console.log('UserProfile - Subscriptions Data Updated:', {
    newItems: subscriptions.items.value.length,
    newTotal: subscriptions.totalItems.value,
    newPage: subscriptions.currentPage.value,
    firstItem: subscriptions.items.value[0]
  })
}

const handleViewHistoryPageChange = async (page: number) => {
  console.log('UserProfile - View History Page Change:', {
    page,
    currentItems: viewHistory.items.value.length,
    currentTotal: viewHistory.totalItems.value,
    currentPage: viewHistory.currentPage.value
  })
  await viewHistory.fetchData(page)
  console.log('UserProfile - View History Data Updated:', {
    newItems: viewHistory.items.value.length,
    newTotal: viewHistory.totalItems.value,
    newPage: viewHistory.currentPage.value,
    firstItem: viewHistory.items.value[0]
  })
}

// Start editing bio
const startEditingBio = () => {
  editingBio.value = user.value?.bio || ''
  isEditingBio.value = true
  // Focus the textarea after it's rendered
  nextTick(() => {
    bioTextarea.value?.focus()
  })
}

// Cancel bio edit
const cancelBioEdit = () => {
  isEditingBio.value = false
  editingBio.value = ''
}

// Bio update handler
const handleBioUpdate = async (event: FocusEvent) => {
  const target = event.target as HTMLTextAreaElement
  const bio = target.value
  try {
    const res = await api.patch(`/users/${user.value?.id}`, { bio })
    if (res && res.data) {
      console.log('UserProfile - Bio update response:', res.data)
      auth.setUser(res.data)
    }
  } catch (error) {
    console.error('Error updating bio:', error)
    // Revert the textarea value on error
    if (user.value) {
      editingBio.value = user.value.bio || ''
    }
  } finally {
    isEditingBio.value = false
  }
}

// Handle image load error
const handleImageError = () => {
  imageError.value = true
  if (user.value) {
    user.value.image = undefined
  }
}

// Update profile image
async function updateProfileImage(file: File) {
  if (!user.value) return
  
  try {
    const formData = new FormData()
    formData.append('image', file)
    
    const res = await api.post('/users/profile/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    auth.setUser({
      ...user.value,
      image: res.data.image
    })
  } catch (error) {
    console.error('Failed to update profile image:', error)
  }
}
</script>

<style scoped>
.group-upload:hover .upload-text {
  display: inline;
}

.bio-display {
  min-height: 80px;
  position: relative;
}

.bio-display:hover {
  border-color: #d1d5db;
}

.bio-display:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}
</style>