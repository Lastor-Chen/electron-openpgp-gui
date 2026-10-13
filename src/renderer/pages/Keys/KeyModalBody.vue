<script setup lang="ts">
import type { PgpKeyUser } from '@shared/types/apiAgent'

import PgpKeyUserList from '@/components/PgpKeyUserList.vue'

const props = defineProps<{
  keyInfos: PgpKeyUser[]
  description?: string
}>()
</script>

<template>
  <p v-if="description" class="mb-2">
    {{ props.description }}
  </p>
  <PgpKeyUserList class="w-115.5" :key-infos="keyInfos" show-key-id />
</template>
