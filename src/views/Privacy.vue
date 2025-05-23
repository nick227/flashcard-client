<template>
    <div class="privacy-page">
        <div class="privacy-content">
            <h1>Privacy Policy</h1>
            <p class="last-updated">Last updated: {{ new Date().toLocaleDateString() }}</p>

            <section class="policy-section">
                <h2>Information We Collect</h2>
                <p>We collect information that you provide directly to us, including:</p>
                <ul>
                    <li>Account information (name, email, password)</li>
                    <li>Profile information (avatar, bio)</li>
                    <li>Learning progress and activity</li>
                    <li>Flashcard sets you create or study</li>
                </ul>
            </section>

            <section class="policy-section">
                <h2>How We Use Your Information</h2>
                <p>We use the information we collect to:</p>
                <ul>
                    <li>Provide and maintain our services</li>
                    <li>Improve your learning experience</li>
                    <li>Track your progress and achievements</li>
                    <li>Send you important updates and notifications</li>
                </ul>
            </section>

            <section class="policy-section">
                <h2>Data Security</h2>
                <p>We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.</p>
            </section>

            <section class="policy-section">
                <h2>Your Rights</h2>
                <p>You have the right to:</p>
                <ul>
                    <li>Access your personal information</li>
                    <li>Correct inaccurate data</li>
                    <li>Request deletion of your data</li>
                    <li>Opt-out of communications</li>
                </ul>
            </section>

            <section class="policy-section">
                <h2>Contact Us</h2>
                <p>If you have any questions about this Privacy Policy, please contact us at:</p>
                <p class="contact-email">privacy@flashcardacademy.com</p>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.privacy-page {
    @apply max-w-3xl mx-auto px-4 py-2;
}

.privacy-content {
    @apply space-y-12;
}

.privacy-content h1 {
    @apply text-4xl font-bold text-gray-900 mb-2;
}

.last-updated {
    @apply text-gray-600 text-sm;
}

.policy-section {
    @apply space-y-4;
}

.policy-section h2 {
    @apply text-2xl font-semibold text-gray-900;
}

.policy-section p {
    @apply text-gray-600 leading-relaxed;
}

.policy-section ul {
    @apply list-disc list-inside space-y-2 text-gray-600;
}

.contact-email {
    @apply text-blue-600 font-medium;
}
</style> 