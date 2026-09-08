<script setup lang="ts">
import Navbar from '@/pages/Navbar.vue'
</script>

<template>
  <div>
    <header>
      <Navbar />
    </header>

    <main>
      <RouterView />
    </main>
  </div>
</template>
