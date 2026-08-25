<script setup lang="ts">
import { onMounted, onScopeDispose } from 'vue'

import { useApiAgent } from '@/composables/useChildIpc'

const { apiAgent, onApiAgentCrash } = useApiAgent()

const pingMain = async () => {
  const res = await window.ipcRenderer.invoke('ping', 'hello')
  console.log(res)
}

const pingChild = async () => {
  await apiAgent.ping()
}

onMounted(() => {
  const clearMainListener = window.ipcRenderer.on('someEvent', (a, b) =>
    console.log('testEvent', { a, b }),
  )
  const clearChildListener = onApiAgentCrash((err) => window.alert(`ApiAgent crashed: ${err}`))

  onScopeDispose(() => {
    clearMainListener()
    clearChildListener()
  })
})
</script>

<template>
  <button @click="pingMain">ping main</button>
  <button @click="pingChild">ping child</button>
</template>
