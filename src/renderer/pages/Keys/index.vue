<script setup lang="ts">
import { Check, XIcon } from '@lucide/vue'
import type { PgpKeysResponse } from '@shared/types/apiAgent'
import { useAsyncState } from '@vueuse/core'
import { computed, h, ref, toRaw } from 'vue'

import { Button } from '@/components/ui/button'
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from '@/components/ui/input-group'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import { injectConfirmModal } from '@/composables/useConfirmModal'
import ContextMenu from '@/pages/Keys/ContextMenu.vue'
import CreateDialog from '@/pages/Keys/CreateDialog.vue'
import KeyModalBody from '@/pages/Keys/KeyModalBody.vue'
import { apiAgent } from '@/rpcChild'

const modal = injectConfirmModal()

const contextTarget = ref<PgpKeysResponse[number]>()
const selectedKeyIds = ref<Set<string>>(new Set())
const anchorIndex = ref<number>()

const selectedKeys = computed(() => {
  if (selectedKeyIds.value.size) {
    return keys.value.filter((key) => selectedKeyIds.value.has(key.key_id))
  } else if (contextTarget.value) {
    return [toRaw(contextTarget.value)]
  }
  return []
})

const {
  state: keys,
  error,
  execute: getPgpKeys,
} = useAsyncState(async () => {
  return await apiAgent.getPgpKeys()
}, [])

const search = ref('')
const filteredKeys = computed(() =>
  keys.value.filter((key) => {
    return (
      key.name?.toLowerCase().includes(search.value.toLowerCase()) ||
      key.email?.toLowerCase().includes(search.value.toLowerCase()) ||
      key.key_id?.toLowerCase().includes(search.value.toLowerCase())
    )
  }),
)

const formatFingerprint = (val = '') => {
  return val
    .toUpperCase()
    .match(/.{1,4}/g)
    ?.join(' ')
}

const dateFormatter = new Intl.DateTimeFormat('zh-TW', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const formatDate = (iso?: string | null) => {
  if (!iso) return ''
  return dateFormatter.format(new Date(iso))
}

const onSelectRow = (event: MouseEvent, rowId: string, rowIndex: number) => {
  event.stopPropagation()

  const toggleKey = window.appInfo.platform === 'win32' ? 'ctrlKey' : 'metaKey'

  if (event[toggleKey]) {
    // ctrl/cmd click, toggle selection
    if (selectedKeyIds.value.has(rowId)) {
      selectedKeyIds.value.delete(rowId)
    } else {
      selectedKeyIds.value.add(rowId)
    }
  } else if (event.shiftKey && typeof anchorIndex.value !== 'undefined') {
    // shift click, range selection
    const start = Math.min(anchorIndex.value, rowIndex)
    const end = Math.max(anchorIndex.value, rowIndex)

    selectedKeyIds.value = new Set(
      keys.value //
        .slice(start, end + 1)
        .map((item) => item.key_id),
    )
  } else {
    selectedKeyIds.value = new Set([rowId])
    anchorIndex.value = rowIndex
  }
}

// 需搭配子層阻止冒泡
const unSelectAll = () => {
  selectedKeyIds.value.clear()
  anchorIndex.value = undefined
}

const onImport = async () => {
  const files = await window.ipcRenderer.invoke('openFileBrowser', {
    properties: ['openFile'],
    filters: [{ name: 'PGP key', extensions: ['asc'] }],
  })
  if (!files || !files[0]) return

  const { path: filePath } = files[0]

  try {
    const { parsedCount, imported } = await apiAgent.importKey(filePath)

    void modal.open({
      icon: 'success',
      title: 'Key(s) imported',
      content: h(KeyModalBody, {
        description: `${parsedCount} keys ware parsed, ${imported.length} imported.`,
        keyInfos: imported,
      }),
      cancelText: false,
    })

    void getPgpKeys()
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

const onExport = async (e?: PointerEvent) => {
  e?.stopPropagation()

  if (!selectedKeys.value.length) {
    return void modal.open({
      icon: 'warn',
      title: 'Export key(s)',
      content: 'Please select key(s) first.',
      cancelText: false,
    })
  }

  let includePrivate = false
  if (selectedKeys.value.some((key) => key.has_private)) {
    includePrivate = await modal.open({
      icon: 'info',
      title: 'Include private key(s)?',
      confirmText: 'Yes',
      cancelText: 'No',
    })
  }

  let defaultName = ''
  if (selectedKeys.value.length === 1) {
    const { key_id, name } = selectedKeys.value[0]!
    const shortKeyId = key_id?.slice(-8).toUpperCase()
    defaultName = name ? `${name}_${shortKeyId}` : shortKeyId
  } else {
    defaultName = `${selectedKeys.value.length}_PGP_Keys`
  }

  const file = await window.ipcRenderer.invoke('saveFileBrowser', {
    defaultPath: defaultName,
    filters: [{ name: 'ASC', extensions: ['asc'] }],
  })
  if (!file) return

  try {
    await apiAgent.exportKeys([...selectedKeyIds.value], file.path, includePrivate)

    void modal.open({
      icon: 'success',
      title: 'Export public key(s) successful',
      content: h(KeyModalBody, { keyInfos: selectedKeys.value }),
      cancelText: false,
    })
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
</script>

<template>
  <div class="h-full px-4 pt-4" @click="unSelectAll">
    <div class="mb-4 flex justify-between">
      <div class="space-x-2">
        <CreateDialog @created="getPgpKeys()" />
        <Button variant="outline" @click="onImport">Import</Button>
        <Button variant="outline" @click="(e: PointerEvent) => onExport(e)">Export</Button>
      </div>
      <div class="w-[30%]">
        <InputGroup>
          <InputGroupInput
            v-model="search"
            type="text"
            placeholder="Filter"
            @keyup.esc="search = ''"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton v-show="search" size="icon-xs" @click="search = ''">
              <XIcon />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </div>

    <Table wrapper-class="border rounded max-h-[335px]" class="table-fixed select-none">
      <TableHeader>
        <TableRow class="sticky top-0 z-1 bg-gray-100">
          <TableHead class="w-8/100">Private</TableHead>
          <TableHead class="w-18/100">Name</TableHead>
          <TableHead class="w-25/100">Email</TableHead>
          <TableHead class="w-15/100">Expires</TableHead>
          <TableHead class="w-30/100">Key ID</TableHead>
        </TableRow>
      </TableHeader>
      <ContextMenu :selected="selectedKeys" @data-changed="getPgpKeys()" @export="() => onExport()">
        <TableBody>
          <TableRow
            v-for="(row, index) in filteredKeys"
            :key="row.key_id"
            class="hover:bg-muted"
            :class="{ 'bg-blue-300!': selectedKeyIds.has(row.key_id) }"
            @contextmenu="contextTarget = row"
            @click="(e: MouseEvent) => onSelectRow(e, row.key_id, index)"
          >
            <TableCell>
              <Check v-if="row.has_private" class="inline" :size="16" />
            </TableCell>
            <TableCell class="truncate">{{ row.name || '-' }}</TableCell>
            <TableCell class="truncate">
              {{ row.email || '-' }}
            </TableCell>
            <TableCell>{{ formatDate(row.expires) || '-' }}</TableCell>
            <TableCell class="tabular-nums font-mono">{{
              formatFingerprint(row.key_id) || '-'
            }}</TableCell>
          </TableRow>

          <TableRow v-if="error || !keys.length">
            <TableCell colspan="5" class="text-center">{{ error || 'Nothing' }}</TableCell>
          </TableRow>
        </TableBody>
      </ContextMenu>
    </Table>
  </div>
</template>
