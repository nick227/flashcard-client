<template>
  <div class="site-landing-page">
    <div class="container">
      <!-- Hero Section -->
      <div class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title">Flashcard Academy</h1>
          <p class="hero-subtitle">Think like Wikipedia, but for flashcards.</p>
          <div class="hero-actions">
            <button class="button button-primary" @click="browseSets">Browse Sets</button>
            <button class="button button-secondary" @click="createSet">Create Your Own</button>
          </div>
        </div>
      </div>

      <!-- Stats & Newest User Row -->
      <div class="stats-user-row">
        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-number">{{ formatNumber(setsCount) }}</span>
            <span class="stat-label">Sets</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ formatNumber(usersCount) }}</span>
            <span class="stat-label">Educators</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ formatNumber(categoriesCount) }}</span>
            <span class="stat-label">Categories</span>
          </div>
        </div>
        
        <div class="newest-user-card" v-if="newestUser" @click="viewEducator(newestUser.name)">
          <div class="newest-user-avatar">
            <img v-if="newestUser.image" :src="newestUser.image" :alt="newestUser.name" loading="lazy" />
            <div v-else class="placeholder-avatar"><i class="fas fa-user"></i></div>
          </div>
          <div class="newest-user-info">
            <div class="newest-user-badge">Newest</div>
            <div class="newest-user-name">{{ newestUser.name }}</div>
          </div>
        </div>
      </div>

      <!-- Categories Section -->
      <div class="categories-section">
        <div class="section-header">
          <h2 class="section-title">Explore by Category</h2>
        </div>
        <div class="categories-grid">
          <div v-for="category in categoriesWithSets" :key="category.id" class="category-card">
            <div class="category-header">
              <h3 class="category-name">{{ category.name }}</h3>
              <button class="view-all-button" @click="viewCategory(category.name)">View All</button>
            </div>
            <div class="sets-masonry">
              <div v-for="set in category.sets" :key="set.id" class="set-card flex gap-2 whitespace-nowrap" @click="viewSet(set.id)">
                <div class="set-thumbnail">
                  <img 
                    v-if="set.thumbnail" 
                    :src="set.thumbnail" 
                    :alt="set.title"
                    loading="lazy"
                    @error="handleImageError"
                  />
                  <div class="placeholder-thumbnail" :style="{ display: set.thumbnail ? 'none' : 'flex' }">
                    <i class="fas fa-layer-group"></i>
                  </div>
                </div>
                <div class="set-info">
                  <h4 class="set-title">{{ set.title }}</h4>
                  <div class="set-meta">
                    <span class="set-author">{{ set.educator?.name || 'Unknown' }}</span>
                    <span class="set-price" v-if="set.price > 0">${{ set.price }}</span>
                    <span class="set-price" v-else>Free</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/api'
import { cachedApiEndpoints } from '@/services/CachedApiService'

const router = useRouter()

// Reactive data
const setsCount = ref(0)
const usersCount = ref(0)
const categoriesCount = ref(0)
const newestUser = ref<any>(null)
const categoriesWithSets = ref<any[]>([])

// Methods
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const browseSets = () => {
  router.push('/browse')
}

const createSet = () => {
  router.push('/creator')
}

const viewSet = (id: string) => {
  router.push(`/sets/${id}`)
}

const viewEducator = (id: string) => {
  router.push('/u/' + id)
}

const viewCategory = (categoryName: string) => {
  router.push(`/browse?category=${encodeURIComponent(categoryName)}`)
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  if (target) {
    target.style.display = 'none'
    const placeholder = target.nextElementSibling as HTMLElement
    if (placeholder) {
      placeholder.style.display = 'flex'
    }
  }
}

// Load stats on mount
onMounted(async () => {
  try {
    // Sets count
    const setsCountRes = await api.get('/sets/count')
    setsCount.value = setsCountRes.data.count
    
    // Users count
    const usersCountRes = await api.get('/users/count')
    usersCount.value = usersCountRes.data.count
    
    // Categories count
    const categoriesCountRes = await api.get('/categories/count')
    categoriesCount.value = categoriesCountRes.data.count

    // Newest user
    try {
      const newestUserData = await cachedApiEndpoints.getNewestUser()
      newestUser.value = newestUserData
    } catch (error) {
      console.error('Error loading newest user:', error)
    }

    // Categories with sets
    try {
      const isMobile = window.innerWidth < 768
      const catNum = isMobile ? 1 : 4
      const setsPerCat = isMobile ? 3 : 5
      const categoriesData = await cachedApiEndpoints.getRandomCategoriesWithSets(catNum, setsPerCat)
      categoriesWithSets.value = categoriesData as any[]
    } catch (error) {
      console.error('Error loading categories with sets:', error)
    }
  } catch (error) {
    console.error('Error loading stats:', error)
  }
})
</script>

<style scoped>
.site-landing-page {
  line-height: 1.6;
  padding: 1.5rem 0;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* Hero Section */
.hero-section {
  text-align: center;
  margin-bottom: 2rem;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #212529;
  margin: 0 0 0.5rem;
  letter-spacing: -0.02em;
}

.hero-subtitle {
  font-size: 1.125rem;
  color: #6c757d;
  margin: 0 0 1.5rem;
  font-weight: 400;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Stats & Newest User Row */
.stats-user-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 1rem 1.5rem;
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e9ecef;
}

.stats-row {
  display: flex;
  gap: 2rem;
  flex: 1;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #007bff;
}

.stat-label {
  font-size: 0.75rem;
  color: #6c757d;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Newest User Card */
.newest-user-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border: 1px solid #e9ecef;
  min-width: 200px;
}

.newest-user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid var(--primary-color);
}

.newest-user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder-avatar {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  border-radius: 50%;
}

.newest-user-info {
  flex: 1;
  min-width: 0;
}

.newest-user-badge {
  display: block;
  background: #007bff;
  color: white;
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  width: fit-content;
}

.newest-user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #212529;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Categories Section */
.categories-section {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  border: 1px solid #e9ecef;
}

.section-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #212529;
  margin: 0;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.category-card {
  border-radius: 0.5rem;
  border: 1px solid #e9ecef;
}

.category-header {
  padding: 0.75rem 1rem;
  background: white;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-name {
  font-size: 1rem;
  font-weight: 600;
  color: #212529;
  margin: 0;
}

.view-all-button {
  background: transparent;
  color: #007bff;
  border: none;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

.sets-masonry {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
}

.set-card {
  background: var(--color-subtle);
  border-radius: 0.375rem;
  overflow: hidden;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border: 1px solid #e9ecef;
  padding: 0.2rem 0.1rem;
}

.set-thumbnail {
  width: 100px;
  height: 80px;
  text-align: center;
}

.set-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.placeholder-thumbnail {
  width: 100px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  font-size: 1.25rem;
}

.set-info {
  padding: 0.5rem;
}

.set-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #212529;
  margin: 0 0 0.25rem;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.set-meta {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  font-size: 0.625rem;
  color: #6c757d;
}

.set-author {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.set-price {
  font-weight: 600;
  color: #28a745;
}

/* Responsive Design */
@media (max-width: 768px) {
  .container {
    padding: 0 1rem;
  }
  
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .button {
    width: 100%;
    max-width: 200px;
  }
  
  .stats-user-row {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  
  .stats-row {
    justify-content: space-around;
    gap: 1rem;
  }
  
  .categories-grid {
    grid-template-columns: 1fr;
  }

  .sets-masonry {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }

  .newest-user-card {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .site-landing-page {
    padding: 1rem 0;
  }
  
  .hero-title {
    font-size: 1.75rem;
  }
  
  .section-title {
    font-size: 1.25rem;
  }
  
  .stat-number {
    font-size: 1.25rem;
  }
  
  .sets-masonry {
    display: flex;
    flex-direction: column;
  }
}
</style>