<template>
  <section class="hero">
    <div class="hero-content">
      <h1 class="title">
        <span class="highlight">Flash</span>Card Academy
      </h1>
      <h4>{{ briefMessage }}</h4>
    </div>
  </section>
</template>

<script setup lang="ts">
const randomMessages = ['Get your flash on.', 'Learn anything, anywhere, anytime.', 'Flash cards rock.', 'Flash card party!', 'Better than videos.']
const briefMessage = randomMessages[Math.floor(Math.random() * randomMessages.length)]

</script>