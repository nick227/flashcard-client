<template>
    <footer class="footer mt-64">
        <div class="footer-content">
            <!-- Logo and Description -->
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
                    Making learning fun and effective with interactive flashcards. Join our community of learners and educators!
                </p>
            </div>

            <!-- Quick Links -->
            <div class="footer-links">
                <h3>Quick Links</h3>
                <ul>
                    <li><a href="/browse" class="link">Browse Sets</a></li>
                    <li><a href="/create" class="link">Create Set</a></li>
                    <li><a href="/profile" class="link">My Profile</a></li>
                    <li><a href="/about" class="link">About Us</a></li>
                </ul>
            </div>

            <!-- Categories -->
            <div class="footer-categories">
                <h3>Popular Categories</h3>
                <div class="category-tags">
                    <a v-for="category in categories" 
                       :key="category.id" 
                       :href="'/browse/' + encodeURIComponent(category.name)" 
                       class="category-tag">
                        {{ category.name }}
                    </a>
                </div>
            </div>

            <!-- Social Links -->
            <div class="footer-social">
                <h3>Connect With Us</h3>
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

const { categories, loading, error } = useCategories()
</script>

<style scoped>
.footer {
    background-color: #f0f0f0;
    min-height: 380px;
}

.footer-content {
    @apply max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8;
}

.footer-brand {
    @apply space-y-4;
}

.navbar-logo {
    @apply flex items-center gap-2 text-gray-900 hover:text-blue-600 transition-colors duration-200;
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
    @apply text-gray-600 text-sm leading-relaxed;
}

.footer-links h3,
.footer-categories h3,
.footer-social h3 {
    @apply text-gray-900 font-semibold mb-4;
}

.footer-links ul {
    @apply space-y-2;
}

.footer-links a {
    @apply text-gray-600 hover:text-blue-600 transition-colors duration-200;
}

.category-tags {
    @apply flex flex-wrap gap-2;
}

.category-tag {
    @apply px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm hover:bg-blue-100 transition-colors duration-200;
}

.social-links {
    @apply flex gap-4;
}

.social-link {
    @apply w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition-all duration-200;
}

.footer-bottom {
    @apply max-w-7xl mx-auto px-4 pt-2 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4;
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

/* Quirky animations */
@keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
}

.logo-svg {
    animation: float 3s ease-in-out infinite;
}

.category-tag:hover {
    transform: scale(1.05);
}

.social-link:hover {
    transform: rotate(8deg);
}
</style>