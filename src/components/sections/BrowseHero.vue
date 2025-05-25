<template>
  <section class="hero">
    <div class="hero-content">
      <div class="hero-text">
        <h1 class="hero-title">{{ currentContent.titles }}</h1>
        <p class="hero-description">{{ currentContent.descriptions }}</p>
        <div v-if="isDesktop" class="hero-stats">
          <div class="stat">
            <span class="stat-number">{{ currentContent.statNumbers[0] }}</span>
            <span class="stat-label">{{ currentContent.statLabels[0] }}</span>
          </div>
          <div class="stat">
            <span class="stat-number">{{ currentContent.statNumbers[1] }}</span>
            <span class="stat-label">{{ currentContent.statLabels[1] }}</span>
          </div>
          <div class="stat">
            <span class="stat-number">{{ currentContent.statNumbers[2] }}</span>
            <span class="stat-label">{{ currentContent.statLabels[2] }}</span>
          </div>
        </div>
      </div>
      <div v-if="isDesktop" class="hero-features">
        <div class="feature">
          <div class="feature-icon">{{ currentContent.icons[0] }}</div>
          <h3>{{ currentContent.featureTitles[0] }}</h3>
          <p>{{ currentContent.featureDescriptions[0] }}</p>
        </div>
        <div class="feature">
          <div class="feature-icon">{{ currentContent.icons[1] }}</div>
          <h3>{{ currentContent.featureTitles[1] }}</h3>
          <p>{{ currentContent.featureDescriptions[1] }}</p>
        </div>
        <div class="feature">
          <div class="feature-icon">{{ currentContent.icons[2] }}</div>
          <h3>{{ currentContent.featureTitles[2] }}</h3>
          <p>{{ currentContent.featureDescriptions[2] }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const content = {
  titles: [
    'Flashcards Rule!',
    'Study Smarter, Not Harder',
    'Master Any Subject',
    'Learn at Your Pace',
    'Knowledge at Your Fingertips'
  ],
  descriptions: [
    'You are totally your own judge. You look at the back of the card whenever you are ready. No rush and no timer.',
    'Take control of your learning journey. Study when you want, where you want, at your own pace.',
    'Break free from traditional study methods. Your success, your way, your time.',
    'No pressure, no deadlines. Just pure, effective learning at your own speed.',
    'The most flexible way to learn. You decide when you\'re ready to move forward.'
  ],
  statNumbers: [
    '0',
    '∞',
    '100%',
    '24/7',
    '1M+'
  ],
  statLabels: [
    'Paper Cuts',
    'Coffee Breaks',
    'Less Lost Cards',
    'Study Hours',
    'Cards Created'
  ],
  icons: [
    '🎯',
    '👥',
    '⚡',
    '📚',
    '🎓',
    '💡',
    '🚀',
    '🎮'
  ],
  featureTitles: [
    'No More Excuses',
    'Share the Pain',
    'Quick & Easy',
    'Learn Anywhere',
    'Stay Motivated',
    'Track Progress',
    'Join Community',
    'Smart Learning'
  ],
  featureDescriptions: [
    'Study anywhere, even in your pajamas (we won\'t tell)',
    'Join other students who also procrastinated until now',
    'Create cards faster than you can say "I\'ll study tomorrow"',
    'From your bed to the beach, learning follows you',
    'Stay on track with our friendly reminders',
    'Watch your knowledge grow with detailed stats',
    'Connect with fellow learners worldwide',
    'Adaptive learning that fits your style'
  ]
}

const currentContent = ref({
  titles: content.titles[0],
  descriptions: content.descriptions[0],
  statNumbers: [content.statNumbers[0], content.statNumbers[1], content.statNumbers[2]],
  statLabels: [content.statLabels[0], content.statLabels[1], content.statLabels[2]],
  icons: [content.icons[0], content.icons[1], content.icons[2]],
  featureTitles: [content.featureTitles[0], content.featureTitles[1], content.featureTitles[2]],
  featureDescriptions: [content.featureDescriptions[0], content.featureDescriptions[1], content.featureDescriptions[2]]
})

const isDesktop = ref(window.innerWidth > 1024)

function getRandomItem(array: string[]): string {
  return array[Math.floor(Math.random() * array.length)]
}

function updateContent() {
  currentContent.value = {
    titles: getRandomItem(content.titles),
    descriptions: getRandomItem(content.descriptions),
    statNumbers: [
      getRandomItem(content.statNumbers),
      getRandomItem(content.statNumbers),
      getRandomItem(content.statNumbers)
    ],
    statLabels: [
      getRandomItem(content.statLabels),
      getRandomItem(content.statLabels),
      getRandomItem(content.statLabels)
    ],
    icons: [
      getRandomItem(content.icons),
      getRandomItem(content.icons),
      getRandomItem(content.icons)
    ],
    featureTitles: [
      getRandomItem(content.featureTitles),
      getRandomItem(content.featureTitles),
      getRandomItem(content.featureTitles)
    ],
    featureDescriptions: [
      getRandomItem(content.featureDescriptions),
      getRandomItem(content.featureDescriptions),
      getRandomItem(content.featureDescriptions)
    ]
  }
}

onMounted(() => {
  // Initial content update
  updateContent()
})
</script>

<style scoped>
.hero-content {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-xl);
  max-width: var(--container-max-width);
  margin: 0 auto;
}

.hero-text {
  display: flex;
  flex-direction: column;
}

.hero-title {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 1.5rem;
  background: linear-gradient(to right, #fff, rgba(255, 255, 255, 0.8));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-align: left;
}

.hero-description {
  font-size: 1.25rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  color: rgba(255, 255, 255, 0.9);
  text-align: left;
}

.hero-stats {
  display: flex;
  gap: 2rem;
  margin-top: 2rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
}

.stat-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
}

.hero-features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  align-content: center;
}

.feature {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 1.5rem;
  border-radius: var(--radius);
  text-align: center;
  transition: transform 0.2s ease;
}

.feature:hover {
  transform: translateY(-5px);
}

.feature-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.feature h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #fff;
}

.feature p {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
}

@media (max-width: 1024px) {
  .hero-content {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .hero-stats {
    justify-content: center;
  }

  .stat {
    align-items: center;
  }

  .hero-features {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .hero {
    padding: var(--space-lg);
  }

  .hero-title {
    font-size: 2.25rem;
  }

  .hero-description {
    font-size: 1.1rem;
  }

  .hero-stats {
    flex-direction: column;
    gap: 1rem;
  }

  .hero-features {
    grid-template-columns: 1fr;
  }
}
</style>