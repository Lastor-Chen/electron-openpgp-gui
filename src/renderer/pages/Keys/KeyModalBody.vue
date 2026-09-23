<script setup lang="ts">
import type { PgpKeyUser } from '@shared/types/apiAgent'

const props = defineProps<{
  keyInfos: PgpKeyUser[]
  description?: string
}>()
</script>

<template>
  <p v-if="description" class="mb-2">
    {{ props.description }}
  </p>
  <template v-for="key in keyInfos" :key="key.key_id">
    <p class="max-w-115.5 flex flex-wrap gap-x-2">
      <span class="max-w-[25%] truncate">{{ key.name }}</span>
      <span class="max-w-[45%] flex items-center">
        <span><</span>
        <span class="truncate">{{ key.email }}</span>
        <span>></span>
      </span>
      <span class="flex-1 truncate">({{ key.key_id.slice(-8).toUpperCase() }})</span>
    </p>
  </template>
</template>
