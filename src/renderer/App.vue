<script setup lang="ts">
import { onMounted, onScopeDispose } from 'vue'

import { useApiAgent } from '@/composables/useChildIpc'

import HelloWorld from './components/HelloWorld.vue'

const { apiAgent, onApiAgentCrash } = useApiAgent()

const onClick = async () => {
  await apiAgent.ping()
}

onMounted(() => {
  const clear = onApiAgentCrash((err) => window.alert(`ApiAgent crashed: ${err}`))
  onScopeDispose(() => clear())
})
</script>

<template>
  <button @click="onClick">ping</button>
  <HelloWorld />
</template>
