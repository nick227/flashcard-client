<template>
    <footer class="footer mt-8 pt-8">
        <div class="footer-content">
            <!-- Main Footer Grid -->
            <div class="footer-grid">
                <!-- Brand Section -->
                <div class="footer-brand">
                    <router-link to="/" class="navbar-logo">
                        <svg width="40" height="40" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"
                            class="logo-svg">
                            <rect x="4" y="8" width="36" height="28" rx="8" fill="currentColor" class="logo-primary" />
                            <rect x="12" y="16" width="20" height="14" rx="4" fill="currentColor" class="logo-secondary" />
                            <rect x="18" y="20" width="8" height="6" rx="2" fill="currentColor" class="logo-accent" />
                        </svg>
                        <span class="logo-text">FlashCard Academy</span>
                    </router-link>
                    <p class="brand-description">
                        We like to make flashcards.
                    </p>
                </div>

                <!-- Stats Section -->
                <StatsSection />
            </div>

            <!-- Main Navigation Grid -->
            <div class="footer-nav-grid">
                <!-- Latest Sets Feed -->
                <div class="footer-latest">
                    <h3>Flash Cards</h3>
                    <div class="latest-sets">
                        <a v-for="set in latestSets" 
                           :key="set.id" 
                           :href="'/sets/' + set.id" 
                           class="latest-set-item">
                            <span class="set-title">{{ set.title }}</span>
                            <span class="set-meta">
                                <i class="fas fa-clock"></i>
                                {{ formatTimeAgo(set.createdAt) }}
                            </span>
                        </a>
                    </div>
                </div>

                <!-- Quick Links -->
                <div class="footer-links">
                    <h3>Site</h3>
                    <div class="links-list">
                        <a href="/browse" class="link-item">
                            <i class="fas fa-compass"></i>
                            <span>Discover Sets</span>
                        </a>
                        <a href="/create" class="link-item">
                            <i class="fas fa-plus-circle"></i>
                            <span>Create Set</span>
                        </a>
                        <a href="/profile" class="link-item">
                            <i class="fas fa-user-circle"></i>
                            <span>My Profile</span>
                        </a>
                        <a href="/about" class="link-item">
                            <i class="fas fa-info-circle"></i>
                            <span>About Us</span>
                        </a>
                    </div>
                </div>

                <!-- Categories -->
                <div class="footer-section">
                    <h3>Categories</h3>
                    <div class="footer-section justify-between">
                    <div class="category-tags">
                        <a v-for="category in categories"
                           :href="`/browse/${category.name}`"
                           class="category-tag">
                            {{ category.name }}
                    </a>
                    </div>
                    
                <div class="newsletter">
                    <NewsletterSubscribe />
                </div>
            </div>

                </div>
            </div>

            <!-- Social and Newsletter Section -->
            <div class="footer-connect">
                <div class="social-links">
                    <a href="#" class="social-link" title="Twitter">
                        <i class="fab fa-twitter"></i>
                    </a>
                    <a href="#" class="social-link" title="Facebook">
                        <i class="fab fa-facebook"></i>
                    </a>
                    <a href="#" class="social-link" title="Instagram">
                        <i class="fab fa-instagram"></i>
                    </a>
                    <a href="#" class="social-link" title="LinkedIn">
                        <i class="fab fa-linkedin"></i>
                    </a>
                </div>
            </div>
        </div>

        <!-- Copyright -->
        <div class="footer-bottom">
            <p>&copy; {{ new Date().getFullYear() }} FlashCard Academy. All rights reserved.</p>
            <div class="footer-legal">
                <a href="/privacy" class="link">Privacy Policy</a>
                <a href="/terms" class="link">Terms of Service</a>
            </div>
        </div>
    </footer>
</template>

<script setup lang="ts">
import { useCategories } from '@/composables/useCategories'
import { useSets } from '@/composables/useSets'
import StatsSection from './StatsSection.vue'
import NewsletterSubscribe from './NewsletterSubscribe.vue'
import { onMounted, computed } from 'vue'

const { categories } = useCategories()
const { sets, initialize } = useSets()

// Get latest 5 sets
const latestSets = computed(() => sets.value?.slice(0, 5) || [])

onMounted(async () => {
  await initialize()
})

const formatTimeAgo = (date: string) => {
    const now = new Date()
    const created = new Date(date)
    const diff = now.getTime() - created.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return created.toLocaleDateString()
}
</script>

<style scoped>
.footer {
    position: relative;
    background-color: var(--color-subtle);
    min-height: 480px;
}

.footer-content {
    padding: 0 1rem;
    width: calc(100% - 2rem);
    max-width: var(--container-max-width);
    margin: 0 auto;
}

.footer-grid {
    @apply grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8;
}

.footer-brand {
    @apply space-y-4;
}

.navbar-logo {
    @apply flex items-center gap-3 text-gray-900 hover:text-blue-600 transition-colors duration-200;
}

.logo-svg {
    @apply w-10 h-10;
}

.logo-primary {
    @apply text-blue-600;
}

.logo-secondary {
    @apply text-blue-400;
}

.logo-accent {
    @apply text-white;
}

.logo-text {
    @apply text-xl font-bold;
}

.brand-description {
    @apply text-gray-600 text-sm leading-relaxed w-full;
}

.footer-nav-grid {
    @apply grid grid-cols-1 md:grid-cols-3 gap-8 mb-8;
}

.footer-latest {
    @apply space-y-2;
}

.footer-latest h3 {
    @apply text-gray-900 font-semibold mb-2 text-base;
}

.latest-sets {
    @apply space-y-1;
}

.latest-set-item {
    @apply flex items-center justify-between py-2 px-3 bg-white/50 hover:bg-white rounded-lg transition-all duration-200;
}

.set-title {
    @apply text-sm text-gray-700 truncate max-w-[200px];
}

.set-meta {
    @apply text-xs text-gray-400 flex items-center gap-1;
}

.footer-links {
    @apply space-y-2;
}

.footer-links h3 {
    @apply text-gray-900 font-semibold mb-2 text-base;
}

.links-list {
    @apply space-y-1;
}

.link-item {
    @apply flex items-center gap-2 py-2 px-3 bg-white/50 hover:bg-white rounded-lg transition-all duration-200;
}

.link-item i {
    @apply text-blue-600 w-4;
}

.link-item span {
    @apply text-sm text-gray-700;
}

.footer-section {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.footer-section h3 {
    @apply text-gray-900 font-semibold mb-2 text-base;
}

.category-tags {
    @apply flex flex-wrap gap-2;
}

.category-tags a {
    color: var(--color-black);
}

.category-tag {
    @apply px-3 py-1 text-white rounded-full text-sm hover:opacity-90 transition-opacity duration-200;
}

.footer-connect {
    @apply flex flex-col md:flex-row justify-between items-center gap-6 p-2;
}

.social-links {
    @apply flex gap-4 justify-center items-center w-full;
}

.social-link {
    @apply w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200;
}

.footer-bottom {
    @apply w-full px-4 py-4 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4;
    max-width: 1600px;
    margin: 0 auto;
}

.footer-bottom p {
    @apply text-gray-600 text-sm;
}

.footer-legal {
    @apply flex gap-4;
}

.footer-legal a {
    @apply text-gray-600 hover:text-blue-600 text-sm transition-colors duration-200;
}

/* Animations */
@keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
}

.logo-svg {
    animation: float 3s ease-in-out forwards;
}

@media (max-width: 768px) {
    .latest-sets, .stats-section, .footer-nav-grid, .footer-connect {
        width: 100%;
    }
}
</style>