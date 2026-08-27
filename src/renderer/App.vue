<script setup lang="ts">
import { onMounted, onScopeDispose, ref } from 'vue'

import { useApiAgent } from '@/composables/useChildIpc'

const { apiAgent, onApiAgent, onApiAgentCrash } = useApiAgent()

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

const progress = ref(0)

const encrypt = async () => {
  const files = await window.ipcRenderer.invoke('openFileBrowser', {
    properties: ['openFile', 'openDirectory', 'multiSelections'],
    filters: [{ name: 'All Files', extensions: ['*'] }],
  })
  if (!files) return

  const pubKeys = await window.ipcRenderer.invoke('openFileBrowser', {
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'PGP keys', extensions: ['asc'] }],
  })
  if (!pubKeys) return

  const filePaths = files.map((file) => file.path)
  const pubkeyPaths = pubKeys.map((pubkey) => pubkey.path)

  progress.value = 0
  const clear = onApiAgent('progress', (percent) => (progress.value = percent))

  await apiAgent.encrypt(filePaths, pubkeyPaths)

  clear()

  window.alert('Encryption successful')
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

  <div style="margin-top: 8px">
    <button @click="encrypt">Encrypt</button>
    <span style="margin-left: 4px">{{ progress }}%</span>
  </div>
</template>
