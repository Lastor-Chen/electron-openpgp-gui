<script setup lang="ts">
import { useAsyncState } from '@vueuse/core'
import { ref, toRaw } from 'vue'

import { Button } from '@/components/ui/button'
import { apiAgentRef } from '@/composables/useChildRef'
import { apiAgent } from '@/rpcChild'

const selectedKeyIds = ref<string[]>([])
const progress = apiAgentRef('progress', { initValue: 0 })

const { state: pgpKeys } = useAsyncState(
  async () => {
    return await apiAgent.getPgpKeys()
  },
  undefined,
  { throwError: true, immediate: true },
)

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
</script>

<template>
  <div class="mt-4">
    <select v-model="selectedKeyIds" multiple>
      <option v-for="key in pgpKeys" :key="key.key_id" :value="key.key_id">
        {{ key.name }}
        {{ key.email ? `<${key.email}>` : '' }}
        ({{ key.key_id }})
      </option>
    </select>
    <div class="mt-6">
      <Button @click="encrypt">Encrypt</Button>
    </div>
  </div>

  <div class="mt-2">{{ progress }}%</div>
</template>
