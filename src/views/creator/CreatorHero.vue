<template>
    <div class="hero flex w-full gap-4 flex-col justify-center items-center px-0 py-16">
        <h2 class="text-3xl font-bold cursive px-4">{{ funnyWelcomeMessage }}, {{ user?.name ?? 'Creator' }}</h2>
        <p>Ready to create your next set?</p>
        <router-link to="/creator/wizard" class="button button-accent mb-6 inline-block w-fit mt-4">+ Create New Set</router-link>
    </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { computed } from 'vue'

const auth = useAuthStore()
const user = computed(() => auth.user)

const funnyWelcomeMessage = computed(() => {
    const messages = [
        "Welcome back",
        "Nice to see you again",
        "Hey, you look good",
        "Hi there and hello",
        "Glad to see you",
        "Let's get to work"
    ]
    return messages[Math.floor(Math.random() * messages.length)]
})

</script>

<style scoped>
.hero {
    min-height: 0;
}
p, h2 {
    margin: 0;
}
</style>

