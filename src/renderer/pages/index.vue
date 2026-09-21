<script setup lang="ts">
import Navbar from '@/pages/Navbar.vue'
</script>

<template>
  <div class="grid grid-rows-[auto_1fr] min-h-screen">
    <header>
      <Navbar />
    </header>

    <main>
      <RouterView />
    </main>
  </div>
</template>
