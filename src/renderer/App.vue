<script setup lang="ts">
import { onMounted, onScopeDispose, ref } from 'vue'

import { useApiAgent } from '@/composables/useChildIpc'

const { apiAgent, onApiAgentCrash } = useApiAgent()

const name = ref('')
const email = ref('')
const comment = ref('')

const genKey = async () => {
  const dir = await window.ipcRenderer.invoke('openFileBrowser', {
    properties: ['openDirectory'],
  })
  if (!dir) return

  await apiAgent.generateKey({
    outputDir: dir[0].path,
    name: name.value,
    email: email.value,
    comment: comment.value,
  })

  window.alert('Key pair generated')
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
  <div>
    <input v-model="name" type="text" placeholder="name" />
    <input v-model="email" type="text" placeholder="email" />
    <input v-mode="comment" type="text" placeholder="comment" />
    <button @click="genKey">Generate Key</button>
  </div>
</template>
