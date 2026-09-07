<script setup lang="ts">
import { ref } from 'vue'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiAgent } from '@/rpcChild'

const name = ref<string>()
const email = ref<string>()

const genKey = async () => {
  await apiAgent.generateKey({
    name: name.value || undefined,
    email: email.value || undefined,
  })

  window.alert('Key pair generated')
}
</script>

<template>
  <div class="flex gap-x-2 pt-4 px-2">
    <Input v-model="name" type="text" placeholder="name" />
    <Input v-model="email" type="email" placeholder="email" />
    <Button @click="genKey">Generate Key</Button>
  </div>
</template>
