<script setup lang="ts">
import { Check } from '@lucide/vue'
import { useAsyncState } from '@vueuse/core'
import { ref } from 'vue'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
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

const { state: keys, error } = useAsyncState(async () => {
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
</script>

<template>
  <div class="px-4 mt-4">
    <div v-if="false" class="flex gap-x-2 pt-4 px-2">
      <Input v-model="name" type="text" placeholder="name" />
      <Input v-model="email" type="email" placeholder="email" />
    </div>
    <div class="mb-4 space-x-2">
      <Button @click="genKey">+ New</Button>
      <Button variant="outline">Import</Button>
      <Button variant="outline">Export</Button>
    </div>

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
