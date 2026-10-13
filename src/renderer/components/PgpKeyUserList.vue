<script setup lang="ts">
import type { PgpKeyUser } from '@shared/types/apiAgent'
import { Primitive } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    keyInfos: PgpKeyUser[]
    as?: string
    class?: HTMLAttributes['class']
    showKeyId?: boolean
  }>(),
  {
    as: 'p',
  },
)
</script>

<template>
  <Primitive
    v-for="key in props.keyInfos"
    :key="key.key_id"
    :as="props.as"
    :class="cn('flex flex-wrap gap-x-2', props.class)"
  >
    <span :class="['truncate', props.showKeyId ? 'max-w-[25%]' : 'max-w-[40%]']">
      {{ key.name }}
    </span>
    <span :class="['flex', props.showKeyId ? 'max-w-[45%]' : 'max-w-[50%]']">
      <span><</span>
      <span class="truncate">{{ key.email }}</span>
      <span>></span>
    </span>
    <span v-if="props.showKeyId" class="flex-1 truncate">
      ({{ key.key_id.slice(-8).toUpperCase() }})
    </span>
  </Primitive>
</template>
