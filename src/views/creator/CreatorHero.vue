<template>
    <div class="hero flex w-full gap-4 flex-col justify-center items-center">
        <h2>{{ funnyWelcomeMessage }}, {{ user?.name ?? 'Creator' }}</h2>
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
        "Read to get to work"
    ]
    return messages[Math.floor(Math.random() * messages.length)]
})

</script>

<style scoped>
.hero {
    min-height: 0;
}
</style>

