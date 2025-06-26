<template>
    <div class="about-page">
        <!-- Hero Section -->
        <section class="hero hero-section">
            <div class="hero-content">
                <h1 class="hero-title">
                    FlashCard Academy is really really cool.
                </h1>
            </div>
            <div class="hero-image">
                <div class="floating-card card-1">
                    <i class="fas fa-book text-blue-500"></i>
                </div>
                <div class="floating-card card-2">
                    <i class="fas fa-lightbulb text-yellow-500"></i>
                </div>
                <div class="floating-card card-3">
                    <i class="fas fa-graduation-cap text-purple-500"></i>
                </div>
            </div>
        </section>

        <!-- CTA Section -->
        <section class="cta-section">
            <h2>Ready to Start Learning?</h2>
            <p>This website is a work in progress. Please check back soon for more features.</p>
            <router-link to="/browse" class="cta-button">
                Explore Sets
                <i class="fas fa-arrow-right"></i>
            </router-link>
        </section>
    </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.about-page {
    @apply max-w-7xl mx-auto px-4 py-12;
}

.floating-card {
    @apply absolute w-24 h-24 rounded-2xl bg-white shadow-xl flex items-center justify-center text-4xl;
    animation: float 6s ease-in-out infinite;
}

.card-1 {
    top: 20%;
    left: 20%;
    animation-delay: 0s;
}

.card-2 {
    top: 40%;
    left: 50%;
    animation-delay: 2s;
}

.card-3 {
    top: 60%;
    left: 30%;
    animation-delay: 4s;
}

/* Mission Section */
.mission-section {
    @apply mb-24;
}

.mission-content {
    @apply max-w-3xl mx-auto text-center space-y-8;
}

.mission-content h2 {
    @apply text-3xl font-bold mb-4;
}

.mission-content p {
    @apply text-lg text-gray-600;
}

.mission-stats {
    @apply grid grid-cols-1 md:grid-cols-3 gap-8 mt-12;
}

.stat-item {
    @apply flex flex-col items-center;
}

.stat-number {
    @apply text-4xl font-bold text-blue-600;
}

.stat-label {
    @apply text-gray-600 mt-2;
}

/* Features Section */
.features-section {
    @apply mb-24;
}

.features-section h2 {
    @apply text-3xl font-bold text-center mb-12;
}

.features-grid {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8;
}

.feature-card {
    @apply p-6 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow duration-300;
}

.feature-icon {
    @apply w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl mb-4;
}

.feature-card h3 {
    @apply text-xl font-semibold mb-2;
}

.feature-card p {
    @apply text-gray-600;
}

/* Team Section */
.team-section {
    @apply mb-24;
}

.team-section h2 {
    @apply text-3xl font-bold text-center mb-12;
}

.team-grid {
    @apply grid grid-cols-1 md:grid-cols-3 gap-8;
}

.team-member {
    @apply text-center;
}

.member-avatar {
    @apply w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-4xl text-gray-400 mx-auto mb-4;
}

.team-member h3 {
    @apply text-xl font-semibold mb-1;
}

.team-member p {
    @apply text-gray-600;
}

/* CTA Section */
.cta-section {
    @apply text-center py-16 px-4 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50;
}

.cta-section h2 {
    @apply text-3xl font-bold mb-4;
}

.cta-section p {
    @apply text-gray-600 mb-8;
}

.cta-button {
    @apply inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200;
}

/* Animations */
@keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
}

/* Hover Effects */
.feature-card:hover {
    transform: translateY(-5px);
    transition: transform 0.3s ease;
}

.team-member:hover .member-avatar {
    @apply bg-blue-100 text-blue-600;
    transition: all 0.3s ease;
}

.cta-button:hover i {
    transform: translateX(5px);
    transition: transform 0.3s ease;
}
</style>