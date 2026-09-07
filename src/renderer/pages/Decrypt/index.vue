<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { apiAgentRef } from '@/composables/useChildRef'
import { apiAgent } from '@/rpcChild'

const progress = apiAgentRef('progress', { initValue: 0 })

const decrypt = async () => {
  const files = await window.ipcRenderer.invoke('openFileBrowser', {
    properties: ['openFile'],
    filters: [{ name: 'PGP Files', extensions: ['pgp', 'gpg'] }],
  })
  if (!files) return

  const filePaths = files.map((file) => file.path)

  progress.value = 0
  await apiAgent.decrypt(filePaths[0])

  window.alert('Decryption successful')
}
</script>

<template>
  <div class="mt-4">
    <Button @click="decrypt">Decrypt</Button>
  </div>

  <div class="mt-2">{{ progress }}%</div>
</template>
