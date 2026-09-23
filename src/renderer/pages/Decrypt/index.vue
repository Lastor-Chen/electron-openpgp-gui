<script setup lang="ts">
import type { PgpKeyUser } from '@shared/types/apiAgent'
import { ref } from 'vue'

import PgpKeyUserList from '@/components/PgpKeyUserList.vue'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Input } from '@/components/ui/input'
import { apiAgentRef } from '@/composables/useChildRef'
import { apiAgent } from '@/rpcChild'

const progress = apiAgentRef('progress', { initValue: 0 })

const selectedFile = ref('')
const recipients = ref<PgpKeyUser[]>()
const unknownCount = ref(0)

const onChooseFile = async () => {
  const files = await window.ipcRenderer.invoke('openFileBrowser', {
    properties: ['openFile'],
    filters: [{ name: 'PGP Files', extensions: ['pgp', 'gpg'] }],
  })
  if (!files || !files[0]) return

  selectedFile.value = files[0].path
  const { encryptedKeys, unknowns } = await apiAgent.readEncryptFileInfo(files[0].path)

  recipients.value = encryptedKeys
  unknownCount.value = unknowns
}

const decrypt = async () => {
  progress.value = 0
  await apiAgent.decrypt(selectedFile.value)

  window.alert('Decryption successful')
}
</script>

<template>
  <div class="h-full px-4 pt-4">
    <h3 class="mb-2">Decrypt File</h3>
    <ButtonGroup class="w-full">
      <Button variant="outline" @click="onChooseFile">Choose</Button>
      <Input v-model="selectedFile" class="truncate" disabled />
    </ButtonGroup>

    <h3 class="mt-4 mb-2">Recipients</h3>
    <div class="h-30 px-3 py-2 border rounded-md">
      <p v-if="!recipients?.length" class="text-muted-foreground">No file selected...</p>
      <ul v-else class="w-204.25 text-muted-foreground">
        <PgpKeyUserList as="li" :key-infos="recipients" />
        <li v-if="unknownCount">Unknown recipients: {{ unknownCount }}</li>
      </ul>
    </div>

    <div class="mt-8">
      <Button @click="decrypt">Decrypt</Button>
    </div>
  </div>
</template>
