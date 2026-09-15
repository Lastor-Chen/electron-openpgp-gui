<script setup lang="ts">
import { Check } from '@lucide/vue'
import type { PgpKeysResponse } from '@shared/types/apiAgent'
import { useAsyncState } from '@vueuse/core'
import { computed, ref, toRaw } from 'vue'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import ContextMenu from '@/pages/Keys/ContextMenu.vue'
import CreateDialog from '@/pages/Keys/CreateDialog.vue'
import { apiAgent } from '@/rpcChild'

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
</script>

<template>
  <div class="h-full px-4 pt-4" @click="unSelectAll">
    <div class="mb-4 space-x-2">
      <CreateDialog @created="getPgpKeys()" />
      <Button variant="outline">Import</Button>
      <Button variant="outline">Export</Button>
    </div>

    <Table wrapper-class="border rounded max-h-[335px]" class="table-fixed select-none">
      <TableHeader>
        <TableRow class="sticky top-0 z-1 bg-gray-100">
          <TableHead class="w-8/100">Owned</TableHead>
          <TableHead class="w-18/100">Name</TableHead>
          <TableHead class="w-25/100">Email</TableHead>
          <TableHead class="w-15/100">Expires</TableHead>
          <TableHead class="w-30/100">Key ID</TableHead>
        </TableRow>
      </TableHeader>
      <ContextMenu :selected="selectedKeys" @data-changed="getPgpKeys()">
        <TableBody>
          <TableRow
            v-for="(row, index) in keys"
            :key="row.key_id"
            class="hover:bg-muted"
            :class="{ 'bg-blue-300!': selectedKeyIds.has(row.key_id) }"
            @contextmenu="contextTarget = row"
            @click="(e: MouseEvent) => onSelectRow(e, row.key_id, index)"
          >
            <TableCell class="text-center">
              <Check v-if="row.is_owner" class="inline" :size="16" />
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
