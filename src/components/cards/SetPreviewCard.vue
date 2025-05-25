<template>
  <div class="set-preview-card">
    <div class="card-image-container">
      <div v-if="set.category" @click="router.push({ path: '/browse/' + set.category })" class="category-badge link">{{ set.category }}</div>
      <div class="image-wrapper">
        <img 
          v-if="set.thumbnail && !imageLoadError"
          @click="goToSet" 
          :src="set.thumbnail" 
          :alt="set.title + ' thumbnail'" 
          class="card-image link"
          @error="handleImageError"
          @load="handleImageLoad"
        />
        <div 
          v-else 
          class="card-image-placeholder"
          @click="goToSet"
        >
        {{ set.title }}
        </div>
      </div>
    </div>
    <div class="card-content">
      <div class="card-header w-full text-left">
        <h3 class="card-title">
          <a @click="goToSet" class="link">{{ set.title }}</a>
        </h3>
        <a :href="`/u/${set.educator?.name}`"><h6 class="text-sm text-gray-500 mt-2">{{ set.educator?.name || 'Unknown' }}</h6></a>
        <p class="card-description w-full text-left">{{ set.description }}</p>
      </div>
      <div class="card-stats w-full text-left">
        <div class="stat-group">
          <span class="stat">
            <i class="fas fa-cards"></i>
            {{ cardCount }} cards
          </span>
          <span class="stat">
            <i class="fas fa-eye"></i>
            {{ viewCount }} views
          </span>
          <span class="stat">
            <i class="fas fa-heart"></i>
            {{ likeCount }} likes
          </span>
        </div>
      </div>
      <div class="card-footer w-full text-left">
        <div class="price-tag" :class="{
          'free': set.price === 0 && !set.isSubscriberOnly,
          'subscriber': set.isSubscriberOnly,
          'paid': set.price > 0
        }">
          <span v-if="set.price === 0 && !set.isSubscriberOnly">Free</span>
          <span v-else-if="set.isSubscriberOnly">Subscriber Only</span>
          <span v-else>${{ set.price }}</span>
        </div>
        <TagsList :tags="tags" :removable="false" class="tags-list" />
      </div>
    </div>
    <div class="card-actions">
      <button class="button button-primary w-full" @click="goToSet">
        <span class="button-text">Start Learning</span>
        <span class="button-icon">→</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { computed, ref, onMounted, watch } from 'vue'
import TagsList from '@/components/common/TagsList.vue'
import axios from 'axios'
import { apiEndpoints } from '@/api'

const props = defineProps({
  set: {
    type: Object,
    required: true
  }
})

defineEmits(['view'])

const router = useRouter()
const viewCount = ref(0)
const likeCount = ref(0)
const cardCount = ref(0)
const imageLoadError = ref(false)

const goToSet = () => {
  router.push({ path: '/study/' + props.set.id })
}

const tags = computed(() => props.set.tags || [])

const fetchSetStats = async () => {
  try {
    // Fetch views count
    const viewsRes = await axios.get(`${apiEndpoints.sets}/${props.set.id}/views`);
    viewCount.value = viewsRes.data.count || 0;
    
    // Fetch likes count
    const likesRes = await axios.get(`${apiEndpoints.sets}/${props.set.id}/likes`);
    likeCount.value = likesRes.data.count || 0;
    
    // Fetch cards count
    const cardsRes = await axios.get(`${apiEndpoints.sets}/${props.set.id}/cards`);
    cardCount.value = cardsRes.data.count || 0;
    
  } catch (err) {
    console.error('Failed to fetch set stats:', err);
    // Set default values on error
    viewCount.value = 0;
    likeCount.value = 0;
    cardCount.value = 0;
  }
}

function handleImageError() {
  imageLoadError.value = true
}

function handleImageLoad() {
  imageLoadError.value = false
}

// Reset error state when set changes
watch(() => props.set?.thumbnail, () => {
  imageLoadError.value = false
})

// Fetch stats when component is mounted
onMounted(() => {
  if (props.set?.id) {
    fetchSetStats();
  }
});

// Watch for set ID changes
watch(() => props.set?.id, (newId) => {
  if (newId) {
    fetchSetStats();
  }
});
</script>

<style scoped>
.set-preview-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  transition: all 0.2s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.set-preview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

.card-image-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  overflow: hidden;
  background: #f3f4f6;
}

.image-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.card-image,
.card-image-placeholder {
  width: 100%;
  height: 100%;
  transition: transform 0.3s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
}

.card-image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  position: relative;
  overflow: hidden;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
  }
}

.card-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  flex: 1;
  text-align: left;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  text-align: left;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.4;
  color: #1a1a1a;
  margin: 0;
  width: 100%;
  text-align: left;
}

.card-title a {
  color: inherit;
  text-decoration: none;
}

.card-title a:hover {
  color: #2563eb;
}

.card-description {
  font-size: 0.9375rem;
  line-height: 1.5;
  color: #4b5563;
  margin: 0;
  width: 100%;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-align: left;
}

.card-stats {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 0.75rem 0;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
}

.stat-group {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  justify-content: flex-start;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  white-space: nowrap;
}

.stat i {
  font-size: 0.875rem;
  color: #9ca3af;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  gap: 1rem;
}

.price-tag {
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  white-space: nowrap;
}

.price-tag.free {
  background: #dcfce7;
  color: #166534;
}

.price-tag.subscriber {
  background: #f3e8ff;
  color: #6b21a8;
}

.price-tag.paid {
  background: #dbeafe;
  color: #1e40af;
}

.tags-list {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-start;
}

.card-actions {
  padding: 1.5rem;
  padding-top: 0;
}

.button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.button-icon {
  transition: transform 0.2s ease;
}

.button:hover .button-icon {
  transform: translateX(2px);
}

.category-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 10;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  backdrop-filter: blur(4px);
  transition: background-color 0.2s ease;
}

.category-badge:hover {
  background: rgba(0, 0, 0, 0.8);
}
</style>