<template>
  <section class="hero">
    <h1 class="hero-title" v-html="heroTitle"></h1>
    <p v-if="isDesktop" class="hero-description">Unlock your learning potential with interactive, beautifully designed flash card sets. Whether you're a student, professional, or lifelong learner, our platform helps you master any subject, faster.</p>
    <div class="hero-actions">
      <button class="button" @click="browseSets">Browse Sets</button>
      <button class="button button-success" @click="startTeaching">Start Teaching</button>
    </div>
    <div v-if="isDesktop" class="hero-subtext">
      <span>Join a global community of learners and educators. Track your progress, earn certificates, and discover new topics every day.</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { computed, ref } from 'vue'

const router = useRouter()

const browseSets = () => {
  router.push('/browse')
}

const startTeaching = () => {
  router.push('/creator')
}

const listHeroTitles = [
  'Learn anything through <span class="accent">flash cards</span>',
  'What is the deal with <span class="accent">flash cards</span>?',
  'Face your fears with <span class="accent">flash cards</span>',
  '<span class="accent">Flashcards</span> Because Google is dead',
  'Turn your coffee breaks into <span class="accent">flash cards</span>',
  'Your momma was right about <span class="accent">flash cards</span>',
  '<span class="accent">Flashcards</span>: The study method that might actually work',
  'Who wants more <span class="accent">flash cards</span>???',
  'Intensifying brain power with <span class="accent">flash cards</span>',
  'Because <span class="accent">flash cards</span> will never leave you.'
]

const heroTitle = computed(() => {
  return listHeroTitles[Math.floor(Math.random() * listHeroTitles.length)]
})

const isDesktop = ref(window.innerWidth > 768)

</script>

<style scoped>
.hero {
  padding: 3rem 0;
  margin-bottom: 4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: linear-gradient(120deg, var(--color-primary) 0%, var(--color-accent2, #a21caf) 100%);
  color: #fff;
  border-radius: var(--radius-lg);
  position: relative;
  overflow: hidden;
}

.hero-title {
  font-size: 3.2rem;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 1.5rem;
}

.hero-title .accent {
  color: var(--color-accent);
}

.hero-description {
  font-size: 1.25rem;
  line-height: 1.5;
  max-width: 42rem;
  margin: 0 auto 2rem;
  opacity: 0.9;
}

.hero-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 2rem 0;
}

@media (min-width: 640px) {
  .hero-actions {
    flex-direction: row;
  }
}

.hero-subtext {
  font-size: 1.125rem;
  opacity: 0.8;
  max-width: 36rem;
  margin: 2rem auto 0;
}

@media (max-width: 768px) {
  .hero {
    padding: 3rem 1.5rem;
    min-height: 480px;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-description {
    font-size: 1.1rem;
  }
}
</style> 