<script setup lang="ts">
import { apiAgent } from '@/rpcChild'

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
</script>

<template>
  <main>
    <RouterView />
  </main>
</template>
