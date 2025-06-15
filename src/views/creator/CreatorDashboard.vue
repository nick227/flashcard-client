<template>
  <div class="min-h-screen flex flex-col">
    
    <main class="container flex-1">
      <CreatorHero />
      <h2 class="text-xl font-semibold mb-4">Your Sets</h2>
      <div v-if="loading" class="text-gray-500">Loading your sets...</div>
      <div v-else-if="sets.length === 0" class="text-gray-500">You have not created any sets yet.</div>
      <SetsTable
        v-else
        :sets="sets"
        :current-page="setsPage"
        :total-pages="setsTotalPages"
        :total-items="totalSets"
        :page-size="PAGE_SIZE"
        :loading="actionLoading"
        @page-change="handleSetsPageChange"
        @edit="editSet"
        @delete="deleteSet"
        @sort="handleSort"
      />

      <div class="my-12">
        <h2 class="text-xl font-semibold mb-4">All Sales</h2>
        <div v-if="salesLoading" class="text-gray-500">Loading sales...</div>
        <div v-else-if="paginatedSales.length === 0" class="text-gray-500">No sales yet.</div>
        <SalesTable
          v-else
          :sales="paginatedSales"
          :current-page="salesPage"
          :total-pages="salesTotalPages"
          :total-items="totalSales"
          :page-size="PAGE_SIZE"
          :loading="salesLoading"
          @page-change="handleSalesPageChange"
          @sort="handleSalesSort"
        />
      </div>

      <div>
        <h2 class="text-xl font-semibold mb-4">All Subscribers</h2>
        <div v-if="subsLoading" class="text-gray-500">Loading subscribers...</div>
        <div v-else-if="paginatedSubs.length === 0" class="text-gray-500">No subscribers yet.</div>
        <SubscribersTable
          v-else
          :subscribers="paginatedSubs"
          :current-page="subsPage"
          :total-pages="subsTotalPages"
          :total-items="totalSubs"
          :page-size="PAGE_SIZE"
          :loading="subsLoading"
          @page-change="handleSubsPageChange"
          @sort="handleSubsSort"
        />
      </div>
    </main>
    <ConfirmDialog 
      v-model="showDeleteConfirm"
      title="Delete Set"
      text="Are you sure you want to delete this set? This action cannot be undone."
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { api } from '@/api/index'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import type { User, FlashCardSet, Sale, Subscription } from '@/types'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import SetsTable from '@/components/creator/SetsTable.vue'
import SalesTable from '@/components/creator/SalesTable.vue'
import SubscribersTable from '@/components/creator/SubscribersTable.vue'
import CreatorHero from '@/views/creator/CreatorHero.vue'

const router = useRouter()
const auth = useAuthStore()
const user = computed(() => auth.user)
const sets = ref<FlashCardSet[]>([])
const loading = ref(true)
const users = ref<User[]>([])
const allSales = ref<Sale[]>([])
const allSubs = ref<Subscription[]>([])
const salesLoading = ref(true)
const subsLoading = ref(true)
const salesPage = ref(1)
const subsPage = ref(1)
const PAGE_SIZE = 25
const LOGGED_IN_USER_ID = user.value?.id

const showDeleteConfirm = ref(false)
const setToDelete = ref<FlashCardSet | null>(null)

// Add pagination state
const setsPage = ref(1)
const setsTotalPages = ref(1)
const totalSets = ref(0)

const actionLoading = ref(false)

const totalSales = ref(0)
const totalSubs = ref(0)

const fetchSets = async () => {
  loading.value = true
  try {
    const res = await api.get(`/sets?showHidden=true&educatorId=${LOGGED_IN_USER_ID}&page=${setsPage.value}&limit=${PAGE_SIZE}&sortBy=createdAt&sortOrder=desc`)
    console.log('Client: Fetched sets:', res.data)
    // Ensure hidden property is properly handled
    sets.value = (res.data.items || res.data).map((set: any) => ({
      ...set,
      hidden: Boolean(set.hidden) // Ensure hidden is a boolean
    }))
    console.log('Processed sets with hidden status:', sets.value.map(s => ({ id: s.id, title: s.title, hidden: s.hidden })))
    setsTotalPages.value = Math.ceil(res.data.pagination?.total / PAGE_SIZE) || 1
    totalSets.value = res.data.pagination?.total || sets.value.length
    loading.value = false
  } catch (err) {
    console.error('Error fetching sets:', err)
    loading.value = false
  }
}

const fetchUsers = async () => {
  try {
    const res = await api.get('/users')
    users.value = res.data
  } catch (err) {
    console.error('Error fetching users:', err)
  }
}

const fetchSales = async () => {
  salesLoading.value = true
  try {
    const res = await api.get(`/sales?page=${salesPage.value}&limit=${PAGE_SIZE}&sortBy=date&sortOrder=desc`)
    // Handle potential paginated response
    const sales = res.data.items || res.data
    allSales.value = sales.map((sale: any) => ({
      ...sale,
      buyerName: sale.user?.name || 'Unknown',
      setTitle: sale.set?.title || 'Unknown'
    }))
    salesTotalPages.value = Math.ceil(res.data.pagination?.total / PAGE_SIZE) || 1
    totalSales.value = res.data.pagination?.total || allSales.value.length
  } catch (err) {
    console.error('Error fetching sales:', err)
  } finally {
    salesLoading.value = false
  }
}

const fetchSubs = async () => {
  subsLoading.value = true
  try {
    const res = await api.get(`/subscriptions?educatorId=${LOGGED_IN_USER_ID}&page=${subsPage.value}&limit=${PAGE_SIZE}&sortBy=date&sortOrder=desc`)
    // Handle potential paginated response
    const subscriptions = res.data.items || res.data
    allSubs.value = subscriptions.map((sub: any) => {
      const user = users.value.find((u: any) => String(u.id) === String(sub.userId))
      return {
        ...sub,
        subscriberName: user ? user.name : 'Unknown'
      }
    })
    subsTotalPages.value = Math.ceil(res.data.pagination?.total / PAGE_SIZE) || 1
    totalSubs.value = res.data.pagination?.total || allSubs.value.length
  } catch (err) {
    console.error('Error fetching subscriptions:', err)
  } finally {
    subsLoading.value = false
  }
}

const paginatedSales = computed(() => allSales.value)
const salesTotalPages = ref(1)

const paginatedSubs = computed(() => allSubs.value)
const subsTotalPages = ref(1)

const editSet = (set: FlashCardSet) => {
  router.push(`/creator/wizard/${set.id}`)
}

const deleteSet = (set: FlashCardSet) => {
  setToDelete.value = set
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (!setToDelete.value || actionLoading.value) return
  actionLoading.value = true
  try {
    await api.delete(`/sets/${setToDelete.value.id}`)
    sets.value = sets.value.filter(s => s.id !== setToDelete.value!.id)
    setToDelete.value = null
  } catch (error) {
    console.error('Failed to delete set:', error)
  } finally {
    actionLoading.value = false
  }
}

// Update pagination handlers
const handleSetsPageChange = (newPage: number) => {
  setsPage.value = newPage
  fetchSets()
}

const handleSalesPageChange = (newPage: number) => {
  salesPage.value = newPage
  fetchSales()
}

const handleSubsPageChange = (newPage: number) => {
  subsPage.value = newPage
  fetchSubs()
}

const handleSort = async (key: string, order: 'asc' | 'desc') => {
  try {
    const res = await api.get(`/sets?showHidden=true&educatorId=${LOGGED_IN_USER_ID}&page=${setsPage.value}&limit=${PAGE_SIZE}&sortBy=${key}&sortOrder=${order.toUpperCase()}`)
    sets.value = res.data.items || res.data
    setsTotalPages.value = Math.ceil(res.data.pagination?.total / PAGE_SIZE) || 1
    totalSets.value = res.data.pagination?.total || sets.value.length
  } catch (err) {
    console.error('Error sorting sets:', err)
  }
}

const handleSalesSort = async (key: string, order: 'asc' | 'desc') => {
  try {
    const res = await api.get(`/sales?page=${salesPage.value}&limit=${PAGE_SIZE}&sortBy=${key}&sortOrder=${order.toUpperCase()}`)
    const sales = res.data.items || res.data
    allSales.value = sales.map((sale: any) => ({
      ...sale,
      buyerName: sale.user?.name || 'Unknown',
      setTitle: sale.set?.title || 'Unknown'
    }))
  } catch (err) {
    console.error('Error sorting sales:', err)
  }
}

const handleSubsSort = async (key: string, order: 'asc' | 'desc') => {
  try {
    const res = await api.get(`/subscriptions?educatorId=${LOGGED_IN_USER_ID}&page=${subsPage.value}&limit=${PAGE_SIZE}&sortBy=${key}&sortOrder=${order.toUpperCase()}`)
    const subscriptions = res.data.items || res.data
    allSubs.value = subscriptions.map((sub: any) => {
      const user = users.value.find((u: any) => String(u.id) === String(sub.userId))
      return {
        ...sub,
        subscriberName: user ? user.name : 'Unknown'
      }
    })
  } catch (err) {
    console.error('Error sorting subscriptions:', err)
  }
}

// Watch for page changes
watch(setsPage, handleSetsPageChange)
watch(salesPage, handleSalesPageChange)
watch(subsPage, handleSubsPageChange)

onMounted(async () => {
  await fetchSets()
  await fetchUsers()
  await fetchSales()
  await fetchSubs()
})
</script> 

<style scoped>
.table-controls button {
  width: 33%;
}
</style>

