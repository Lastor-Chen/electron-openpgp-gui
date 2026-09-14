<script setup lang="ts">
import type { PgpKeysResponse } from '@shared/types/apiAgent'

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { injectConfirmModal } from '@/composables/useConfirmModal'
import { apiAgent } from '@/rpcChild'

const props = defineProps<{
  selected?: PgpKeysResponse[number]
}>()

const emits = defineEmits<{
  dataChanged: []
}>()

const modal = injectConfirmModal()

const onDelete = async () => {
  if (!props.selected) return
  const { name, email, key_id } = props.selected

  const isConfirmed = await modal.open({
    icon: 'warn',
    title: 'Delete key(s)',
    content: `${name} <${email}> (${key_id})`,
    confirmText: 'Delete',
    cancelText: true,
  })
  if (!isConfirmed) return

  try {
    await apiAgent.deleteKey(props.selected.key_id)
    emits('dataChanged')
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
  <ContextMenu>
    <ContextMenuTrigger as-child>
      <slot />
    </ContextMenuTrigger>
    <ContextMenuContent>
      <ContextMenuItem>Export</ContextMenuItem>
      <ContextMenuItem @select="onDelete">Delete</ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</template>
