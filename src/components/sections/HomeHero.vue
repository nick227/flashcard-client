<template>
  <section class="hero">
    <h1 class="hero-title" v-html="heroTitle"></h1>
    <p class="hero-description" v-html="heroDescription"></p>
    <div class="hero-actions">
      <button class="button button-primary" @click="browseSets">Browse Sets</button>
      <button class="button button-success" @click="startTeaching">Start Teaching</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const listHeroDescriptions = [
  'Unlock your learning potential with interactive, beautiful flash cards.',
  'Create and share flash cards with your friends and family.',
  'Possibly even make some money with your flash cards.',
  'Get creative and surprise us with your brilliance.',
  'Step right up and get your flash cards here.',
  'Money, love, and flash cards.',
  'There\'s only two certainties in life: death and flash cards.',
  "Think like Wikipedia, but for flashcards.", 
  "Videos are lame, flashcards rule.", 
  "Flip, flip, flip-a-flashcard.", 
  "Mysterious world of flashcards. They don't want you to know about."
];

const listHeroTitles = [
  'Learn your future through <span class="accent">flash cards</span>',
  'What is the deal with <span class="accent">flash cards</span>?',
  'Face your fears with <span class="accent">flash cards</span>',
  '<span class="accent">Flashcards</span> Because Google is dead',
  'Turn your coffee breaks into <span class="accent">flash cards</span>',
  'Your momma was right about <span class="accent">flash cards</span>',
  '<span class="accent">Flashcards</span>: The forgotten art.',
  'Who wants more <span class="accent">flash cards</span>???',
  'Intensifying brain power with <span class="accent">flash cards</span>',
  'Because <span class="accent">flash cards</span> will never leave you.',
  'Get your flash on.', 'Learn anything, anywhere, anytime.', 'Flash cards rock.', 'Flash card party!', 'Better than videos.'
]

const heroTitle = computed(() => {
  return listHeroTitles[Math.floor(Math.random() * listHeroTitles.length)]
})

const heroDescription = computed(() => {
  return listHeroDescriptions[Math.floor(Math.random() * listHeroDescriptions.length)]
})

const browseSets = () => {
  window.location.href = '/browse'
}

const startTeaching = () => {
  window.location.href = '/creator'
}

</script>

<style scoped>
</style> 