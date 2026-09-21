<script setup lang="ts">
import { onMounted, onScopeDispose } from 'vue'

import Index from '@/pages/index.vue'
import { apiAgent } from '@/rpcChild'

import { useConfirmModal } from './composables/useConfirmModal'

const [, GlobalModal] = useConfirmModal({ provide: true })

apiAgent.initDb().catch((err: Error) => {
  if (err.message.includes('NO_DB_DIR')) {
    window.alert(String(err))
  } else {
    const bool = window.confirm(
      `Failed to load PGP key data. Do you want to reset now?\n\n${String(err)}`,
    )
    if (bool) {
      void apiAgent.resetDb()
    }
  }
})

onMounted(() => {
  const clearChildListener = apiAgent.onCrash((err) => window.alert(`ApiAgent crashed: ${err}`))

  onScopeDispose(() => clearChildListener())
})
</script>

<template>
  <Index />
  <GlobalModal />
</template>
