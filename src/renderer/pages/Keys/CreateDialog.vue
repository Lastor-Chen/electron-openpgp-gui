<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { apiAgent } from '@/rpcChild'

const emits = defineEmits<{
  created: []
  failed: [error: Error]
}>()

const open = defineModel<boolean>('open')
watch(open, (isOpen) => {
  if (isOpen) {
    name.value = undefined
    email.value = undefined
  }
})

const name = ref<string>()
const email = ref<string>()
const canSubmit = computed(() => Boolean(email.value))

const disableOverlayDismiss = (e: Event) => e.preventDefault()

const genKey = async () => {
  try {
    await apiAgent.generateKey({
      name: name.value,
      email: email.value,
    })

    emits('created')
  } catch (err) {
    emits('failed', err as Error)
  } finally {
    open.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="max-w-sm!"
      :show-close-button="false"
      :aria-describedby="undefined"
      @interact-outside="disableOverlayDismiss"
    >
      <DialogHeader>
        <DialogTitle>Create new key pair</DialogTitle>
      </DialogHeader>
      <div class="space-y-4">
        <Input v-model="name" type="text" placeholder="name" />
        <Input v-model="email" type="email" placeholder="*email" />
      </div>
      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline" size="sm">Cancel</Button>
        </DialogClose>
        <Button size="sm" :disabled="!canSubmit" @click="genKey">Create</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
