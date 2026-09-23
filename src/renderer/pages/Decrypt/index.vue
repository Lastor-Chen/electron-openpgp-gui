<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ButtonGroup } from '@/components/ui/button-group'
import { apiAgentRef } from '@/composables/useChildRef'
import { apiAgent } from '@/rpcChild'
import { ref } from 'vue'

const progress = apiAgentRef('progress', { initValue: 0 })

const selectedFile = ref('')

const onChooseFile = async () => {
  const files = await window.ipcRenderer.invoke('openFileBrowser', {
    properties: ['openFile'],
    filters: [{ name: 'PGP Files', extensions: ['pgp', 'gpg'] }],
  })
  if (!files || !files[0]) return

  selectedFile.value = files[0].path

  // TODO 撈出接手者, 會有未持有該 key 的情況
  const res = await apiAgent.readEncryptFileInfo(files[0].path)
  console.log(res)
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

    <h3 class="mt-4 mb-2">File Information</h3>
    <div class="h-30 px-3 py-2 border rounded-md">
      <p v-if="true" class="text-muted-foreground">No file selected...</p>
      <template v-else>
        <h4>Recipients:</h4>
        <ul>
          <li>user0 {{ '<user0@example.com>' }}</li>
          <li>user1 {{ '<user1@example.com>' }}</li>
        </ul>
      </template>
    </div>

    <div class="mt-8">
      <Button @click="decrypt">Decrypt</Button>
    </div>
  </div>
</template>
