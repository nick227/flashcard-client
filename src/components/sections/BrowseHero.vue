<template>
  <section class="hero">
    <div class="hero-content">
      <h1 class="title">
        <span class="highlight">Flash</span>Card Academy
      </h1>
      <h4>Get your flash on.</h4>
    </div>
  </section>
</template>

<script setup lang="ts">
</script>

<style scoped>
.hero {
  background: var(--color-subtle);
}

.hero-content {
  width: calc(100% - 3rem);
  margin: 0 auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.title {
  font-size: 4rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
  line-height: 1.2;
  letter-spacing: -0.02em;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .title {
    font-size: 2rem;
    white-space: normal;
  }
}
</style>