<script setup lang="ts">
import { XIcon, FileUpIcon } from '@lucide/vue'
import { useAsyncState, useDropZone } from '@vueuse/core'
import { computed, ref, toRaw, useTemplateRef } from 'vue'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { apiAgentRef } from '@/composables/useChildRef'
import { apiAgent } from '@/rpcChild'

const selectedKeyIds = ref<string[]>([])
const progress = apiAgentRef('progress', { initValue: 0 })

const selectFiles = ref<string[]>([])
const dropZone = useTemplateRef('dropZone')

const canSubmit = computed(() => {
  return selectFiles.value.length && selectedKeyIds.value.length
})

const { state: pgpKeys } = useAsyncState(
  async () => {
    return await apiAgent.getPgpKeys()
  },
  undefined,
  { throwError: true, immediate: true },
)

useDropZone(dropZone, {
  multiple: true,
  onDrop(files) {
    if (!files?.length) return

    selectFiles.value = files.map((file) => window.electronApi.getPathForFile(file))
  },
})

const browserFiles = async () => {
  const platform = window.electronApi.appInfo.platform
  const files = await window.ipcRenderer.invoke('openFileBrowser', {
    properties:
      platform === 'darwin'
        ? ['openFile', 'openDirectory', 'multiSelections']
        : ['openFile', 'multiSelections'],
    filters: [{ name: 'All Files', extensions: ['*'] }],
  })
  if (!files) return

  selectFiles.value = files.map((file) => file.path)
}

const submit = async () => {
  if (!canSubmit.value) return

  await apiAgent.encrypt(toRaw(selectFiles.value), toRaw(selectedKeyIds.value))

  window.alert('Encryption successful')
}
</script>

<template>
  <div class="h-full px-4 pt-4">
    <div>
      <h3 class="mb-2 flex justify-between items-center">Encrypt Files</h3>
      <div
        ref="dropZone"
        class="h-41 w-210.75 border border-dashed rounded-md px-4 py-2 overflow-auto scrollbar-gutter-stable"
      >
        <div
          v-if="!selectFiles.length"
          class="h-full flex flex-col items-center justify-center cursor-pointer"
          @click="() => browserFiles()"
        >
          <FileUpIcon class="inline text-muted-foreground" :size="32" />
          <span class="mt-2">Drop files here</span>
          <span class="text-muted-foreground">or click to browser</span>
        </div>
        <div v-else class="space-y-2">
          <div>
            <Button class="h-auto py-1 px-2" variant="ghost" @click="() => browserFiles()">
              Reselect
            </Button>
            <Button
              class="h-auto py-1 px-2 text-pink-600 hover:text-pink-600"
              variant="ghost"
              @click="selectFiles = []"
            >
              Clear all
            </Button>
          </div>
          <div
            v-for="(file, index) in selectFiles"
            class="w-max min-w-full flex items-center rounded-md text-sm bg-gray-100"
          >
            <Button variant="ghost" size="icon-sm" @click="selectFiles.splice(index, 1)">
              <XIcon class="cursor-pointer text-pink-600" />
            </Button>
            <span class="pr-3">{{ file }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-2">
      <h3 class="mb-2">Recipients</h3>
      <Select v-model="selectedKeyIds" multiple>
        <SelectTrigger class="w-full">
          <SelectValue>
            {{
              selectedKeyIds.length ? `${selectedKeyIds.length} selected` : 'Select recipients...'
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="key in pgpKeys" :key="key.key_id" :value="key.key_id">
            {{ key.name }}
            {{ key.email ? `<${key.email}>` : '' }}
            ({{ key.key_id }})
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="mt-8">
      <Button :disabled="!canSubmit" @click="submit">Encrypt</Button>
    </div>
  </div>
</template>
