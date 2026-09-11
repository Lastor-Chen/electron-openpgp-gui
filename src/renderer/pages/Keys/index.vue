<script setup lang="ts">
import { Check } from '@lucide/vue'
import { useAsyncState } from '@vueuse/core'
import { ref } from 'vue'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import { injectConfirmModal } from '@/composables/useConfirmModal'
import CreateDialog from '@/pages/Keys/CreateDialog.vue'
import { apiAgent } from '@/rpcChild'

const modal = injectConfirmModal()

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

const openModal = ref(false)
const onCreated = () => {
  void getPgpKeys()

  void modal.open({
    icon: 'success',
    title: 'Key pair created',
    cancelText: false,
  })
}
const onFailed = (err: Error) => {
  void modal.open({
    icon: 'error',
    title: err.name,
    content: err.message,
    confirmText: 'Close',
    cancelText: false,
  })
}
</script>

<template>
  <div class="px-4 mt-4">
    <div class="mb-4 space-x-2">
      <Button @click="openModal = true">+ New</Button>
      <Button variant="outline">Import</Button>
      <Button variant="outline">Export</Button>
    </div>

    <CreateDialog v-model:open="openModal" @created="onCreated" @failed="onFailed" />

    <Table wrapper-class="border rounded max-h-[335px]" class="table-fixed">
      <TableHeader>
        <TableRow class="sticky top-0 z-1 bg-gray-100">
          <TableHead class="w-8/100">Owned</TableHead>
          <TableHead class="w-18/100">Name</TableHead>
          <TableHead class="w-25/100">Email</TableHead>
          <TableHead class="w-15/100">Expires</TableHead>
          <TableHead class="w-30/100">Key ID</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="row in keys" :key="row.key_id">
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
    </Table>
  </div>
</template>
