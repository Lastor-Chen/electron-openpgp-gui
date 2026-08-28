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

const decrypt = async () => {
  const files = await window.ipcRenderer.invoke('openFileBrowser', {
    properties: ['openFile'],
    filters: [{ name: 'PGP Files', extensions: ['pgp', 'gpg'] }],
  })
  if (!files) return

  const privKeys = await window.ipcRenderer.invoke('openFileBrowser', {
    properties: ['openFile'],
    filters: [{ name: 'PGP keys', extensions: ['asc'] }],
  })
  if (!privKeys) return

  const filePaths = files.map((file) => file.path)
  const privKeyPaths = privKeys.map((key) => key.path)

  progress.value = 0
  const clear = onApiAgent('progress', (percent) => (progress.value = percent))

  await apiAgent.decrypt(filePaths[0], privKeyPaths[0])

  clear()
  window.alert('Decryption successful')
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
    <input v-model="comment" type="text" placeholder="comment" />
    <button @click="genKey">Generate Key</button>
  </div>

  <div style="margin-top: 8px">
    <button @click="encrypt">Encrypt</button>
  </div>
  <div style="margin-top: 8px">
    <button @click="decrypt">Decrypt</button>
  </div>
  <div style="margin-top: 8px">{{ progress }}%</div>
</template>
