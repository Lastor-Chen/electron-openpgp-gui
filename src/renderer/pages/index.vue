<script setup lang="ts">
import { onMounted, onScopeDispose, ref, toRaw } from 'vue'

import { apiAgentRef } from '@/composables/useChildRef'
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

const pgpKeys = ref<{ key_id: string; name?: string | null; email?: string | null }[]>([])
const selectedKeyIds = ref<string[]>([])

const getKeys = async () => {
  pgpKeys.value = await apiAgent.getPgpKeys()
}

const progress = apiAgentRef('progress', { initValue: 0 })

const encrypt = async () => {
  const files = await window.ipcRenderer.invoke('openFileBrowser', {
    properties: ['openFile', 'openDirectory', 'multiSelections'],
    filters: [{ name: 'All Files', extensions: ['*'] }],
  })
  if (!files) return

  const filePaths = files.map((file) => file.path)

  progress.value = 0
  await apiAgent.encrypt(filePaths, toRaw(selectedKeyIds.value))

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
  await apiAgent.decrypt(filePaths[0], privKeyPaths[0])

  window.alert('Decryption successful')
}

onMounted(() => {
  void getKeys()

  const clearMainListener = window.ipcRenderer.on('someEvent', (a, b) =>
    console.log('testEvent', { a, b }),
  )
  const clearChildListener = apiAgent.onCrash((err) => window.alert(`ApiAgent crashed: ${err}`))

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
    <button @click="genKey">Generate Key</button>
  </div>

  <div style="margin-top: 8px">
    <select v-model="selectedKeyIds" multiple>
      <option v-for="key in pgpKeys" :key="key.key_id" :value="key.key_id">
        {{ key.name }}
        {{ key.email ? `<${key.email}>` : '' }}
        ({{ key.key_id }})
      </option>
    </select>
    <button @click="encrypt">Encrypt</button>
  </div>
  <div style="margin-top: 8px">
    <button @click="decrypt">Decrypt</button>
  </div>
  <div style="margin-top: 8px">{{ progress }}%</div>
</template>
