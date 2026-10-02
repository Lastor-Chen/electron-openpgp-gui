<script setup lang="ts">
import { XIcon } from '@lucide/vue'
import type { PgpKeyUser } from '@shared/types/apiAgent'
import { useDropZone } from '@vueuse/core'
import { ref, useTemplateRef } from 'vue'

import PgpKeyUserList from '@/components/PgpKeyUserList.vue'
import ProgressButton from '@/components/ProgressButton.vue'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from '@/components/ui/input-group'
import { injectConfirmModal } from '@/composables/useConfirmModal'
import { apiAgent } from '@/rpcChild'

const modal = injectConfirmModal()

const dropZone = useTemplateRef('dropZone')
useDropZone(dropZone, {
  multiple: false,
  onDrop(files) {
    const file = files?.[0]
    if (!file) return

    const filePath = window.electronApi.getPathForFile(file)

    selectedFile.value = filePath
    void readFileInfo(filePath)
  },
})

const selectedFile = ref('')
const fileInfo = ref<{
  recipients: PgpKeyUser[]
  unknownCount: number
}>()

const onChooseFile = async () => {
  const files = await window.ipcRenderer.invoke('openFileBrowser', {
    properties: ['openFile'],
    filters: [{ name: 'PGP Files', extensions: ['pgp', 'gpg'] }],
  })
  if (!files || !files[0]) return

  selectedFile.value = files[0].path
  void readFileInfo(files[0].path)
}

const readFileInfo = async (file: string) => {
  try {
    const { encryptedKeys, unknowns } = await apiAgent.readEncryptFileInfo(file)

    fileInfo.value = {
      recipients: encryptedKeys,
      unknownCount: unknowns,
    }
  } catch (err) {
    // TODO
  }
}

const clearSelected = () => {
  selectedFile.value = ''
  fileInfo.value = undefined
}

const decrypt = async () => {
  try {
    const output = await apiAgent.decrypt(selectedFile.value)

    modal
      .open({
        icon: 'success',
        title: 'Encryption successful',
        content: output.name,
        cancelText: 'Open folder',
      })
      .then((bool) => {
        if (bool === false) window.ipcRenderer.invoke('openFileManager', output.path)
      })

    clearSelected()
  } catch (err) {
    void modal.open({
      icon: 'error',
      title: 'Error',
      content: err instanceof Error ? err.message : String(err),
      confirmText: 'Close',
      cancelText: false,
    })
  }
}

const onCancel = () => {
  void apiAgent.abortStream()
}
</script>

<template>
  <div ref="dropZone" class="h-full px-4 pt-4">
    <h3 class="mb-2">Decrypt File</h3>
    <ButtonGroup class="w-full">
      <Button variant="outline" @click="onChooseFile">Choose</Button>
      <InputGroup>
        <InputGroupInput v-model="selectedFile" type="text" class="truncate" disabled />
        <InputGroupAddon align="inline-end">
          <InputGroupButton v-show="selectedFile" size="icon-xs" @click="clearSelected">
            <XIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </ButtonGroup>

    <h3 class="mt-4 mb-2">Recipients</h3>
    <div class="h-30 px-3 py-2 border rounded-md">
      <p v-if="!fileInfo?.recipients.length" class="text-muted-foreground">No file selected...</p>
      <ul v-else class="w-204.25 text-muted-foreground">
        <PgpKeyUserList as="li" :key-infos="fileInfo.recipients" />
        <li v-if="fileInfo.unknownCount">{{ fileInfo.unknownCount }} unknown recipients</li>
      </ul>
    </div>

    <div class="mt-8">
      <ProgressButton :disabled="!selectedFile" :on-click="decrypt" @cancel="onCancel">
        Decrypt
      </ProgressButton>
    </div>
  </div>
</template>
