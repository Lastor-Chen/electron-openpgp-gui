<script setup lang="ts">
import { useRouter } from 'vue-router'

import { Button } from '@/components/ui/button'

const router = useRouter()
const routes = router.getRoutes()
</script>

<template>
  <div>
    <header class="py-2 px-4 shadow">
      <template v-for="route in routes">
        <RouterLink :to="route.path">
          <Button variant="ghost" size="sm">
            {{ route.meta.label }}
          </Button>
        </RouterLink>
      </template>
    </header>

    <main>
      <RouterView />
    </main>
  </div>
</template>
