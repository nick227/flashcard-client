<template>
  <div class="home-page">

    <div class="container-main py-0 pt-8">
      <BrowseHero />
    </div>

    <div class="container-main flex flex-col gap-4 items-center justify-center pb-24">
      <CategoryCloud />
      <StatsSection />
    </div>

    <transition-group name="fade" tag="div">
      <div v-for="id in newestSets" :key="id" class="py-24 alternate-bg">
        <FlashCardViewer :set-id="id" :hideRelatedSets="true" />
      </div>
    </transition-group>

    <div class="container-main flex flex-col gap-4 items-center justify-center py-48">
      <HomeHero />
      <LoadMoreSetsButton
        v-if="!noMoreResults"
        :loading="loading"
        @loadMore="loadMore"
      />
      <div v-else class="end-message">🎉 You've reached the end of the sets!</div>
    </div>

    <div class="container-main py-4">
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import HomeHero from '@/components/sections/HomeHero.vue'
import { api } from '@/api'
import FlashCardViewer from '@/components/study/FlashCardViewer.vue'
import CategoryCloud from '@/components/common/CategoryCloud.vue'
import BrowseHero from '@/components/sections/BrowseHero.vue'
import StatsSection from '@/components/common/StatsSection.vue'
import LoadMoreSetsButton from '@/components/common/LoadMoreSetsButton.vue'

const newestSets = ref<number[]>([])
const limit = 3
const offset = ref(0)
const noMoreResults = ref(false)
const loading = ref(false)

const getSets = async ({ limit, offset, fields }: { limit: number, offset: number, fields?: string }) => {
  const res = await api.get('/sets', { params: { limit, offset, fields } })
  return res.data
}

const loadMore = async () => {
  loading.value = true
  try {
    console.log('loadMore', { limit, offset: offset.value })
    const data = await getSets({ limit, offset: offset.value, fields: 'id' })
    const unique = data.items.map((item: { id: number }) => item.id).filter((id: number) => !newestSets.value.includes(id))
    newestSets.value = [...newestSets.value, ...unique]
    // nextTick is not strictly necessary here, but can help if UI update is delayed
    // await nextTick()
    offset.value += limit
    if (data.items.length < limit) {
      noMoreResults.value = true
    }
    console.log('loadMore', { unique: unique })
  } finally {
    loading.value = false
  }
}

onMounted(loadMore)
</script>

<style scoped>
.alternate-bg:nth-child(odd) {
  background: #fafafa;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.4s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.end-message {
  color: #888;
  font-size: 1.2rem;
  text-align: center;
  margin: 2rem 0;
}
</style>
