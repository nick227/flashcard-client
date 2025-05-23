<template>
    <div class="terms-page">
        <div class="terms-content">
            <h1>Terms of Service</h1>
            <p class="last-updated">Last updated: {{ new Date().toLocaleDateString() }}</p>

            <section class="terms-section">
                <h2>1. Acceptance of Terms</h2>
                <p>By accessing and using FlashCard Academy, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
            </section>

            <section class="terms-section">
                <h2>2. User Accounts</h2>
                <p>To use certain features of our service, you must:</p>
                <ul>
                    <li>Provide accurate account information</li>
                    <li>Maintain the security of your account</li>
                    <li>Notify us of any unauthorized use</li>
                </ul>
            </section>

            <section class="terms-section">
                <h2>3. User Content</h2>
                <p>You retain ownership of your content, but grant us a license to:</p>
                <ul>
                    <li>Host and display your flashcard sets</li>
                    <li>Share your content with other users</li>
                    <li>Use your content to improve our services</li>
                </ul>
            </section>

            <section class="terms-section">
                <h2>4. Prohibited Activities</h2>
                <p>You agree not to:</p>
                <ul>
                    <li>Violate any laws or regulations</li>
                    <li>Impersonate others</li>
                    <li>Share inappropriate content</li>
                    <li>Interfere with the service</li>
                </ul>
            </section>

            <section class="terms-section">
                <h2>5. Termination</h2>
                <p>We reserve the right to terminate or suspend your account for violations of these terms or for any other reason at our discretion.</p>
            </section>

            <section class="terms-section">
                <h2>6. Changes to Terms</h2>
                <p>We may modify these terms at any time. We will notify you of significant changes via email or through our website.</p>
            </section>

            <section class="terms-section">
                <h2>7. Contact</h2>
                <p>For questions about these Terms of Service, please contact us at:</p>
                <p class="contact-email">terms@flashcardacademy.com</p>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.terms-page {
    @apply max-w-3xl mx-auto px-4 py-2;
}

.terms-content {
    @apply space-y-12;
}

.terms-content h1 {
    @apply text-4xl font-bold text-gray-900 mb-2;
}

.last-updated {
    @apply text-gray-600 text-sm;
}

.terms-section {
    @apply space-y-4;
}

.terms-section h2 {
    @apply text-2xl font-semibold text-gray-900;
}

.terms-section p {
    @apply text-gray-600 leading-relaxed;
}

.terms-section ul {
    @apply list-disc list-inside space-y-2 text-gray-600;
}

.contact-email {
    @apply text-blue-600 font-medium;
}
</style> 