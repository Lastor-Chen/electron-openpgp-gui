<script setup lang="ts">
import { ref, watch } from 'vue'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { injectConfirmModal } from '@/composables/useConfirmModal'
import { apiAgent } from '@/rpcChild'

const emits = defineEmits<{
  created: []
}>()

const modal = injectConfirmModal()

const open = ref<boolean>()
watch(open, (isOpen) => {
  if (isOpen) {
    name.value = undefined
    email.value = undefined
    errMsg.value = ''
  }
})

const name = ref<string>()
const email = ref<string>()

const invalidStyle = 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30'
const errMsg = ref('')

const disableOverlayDismiss = (e: Event) => e.preventDefault()

const isEmail = (val = '') => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
}

const validate = () => {
  errMsg.value = ''

  if (!isEmail(email.value)) {
    errMsg.value = 'Invalid email format.'
    return
  }

  void genKey()
}

const genKey = async () => {
  try {
    await apiAgent.generateKey({
      name: name.value || undefined,
      email: email.value,
    })

    void modal.open({
      icon: 'success',
      title: 'Key pair created',
      cancelText: false,
    })

    emits('created')
  } catch (err) {
    void modal.open({
      icon: 'error',
      title: 'Error',
      content: err instanceof Error ? err.message : String(err),
      confirmText: 'Close',
      cancelText: false,
    })
  } finally {
    open.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <Button>+ New</Button>
    </DialogTrigger>
    <DialogContent
      class="max-w-sm!"
      :show-close-button="false"
      :aria-describedby="undefined"
      @interact-outside="disableOverlayDismiss"
    >
      <DialogHeader>
        <DialogTitle>Create new key pair</DialogTitle>
      </DialogHeader>
      <div class="space-y-4" @keyup.enter="() => validate()">
        <Input v-model="name" type="text" placeholder="name" />
        <Input
          v-model="email"
          type="email"
          class="mb-0"
          :class="{ [invalidStyle]: Boolean(errMsg) }"
          placeholder="*email"
        />
        <p class="text-red-500">
          {{ errMsg || '&nbsp;' }}
        </p>
      </div>
      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline" size="sm">Cancel</Button>
        </DialogClose>
        <Button size="sm" @click="() => validate()">Create</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
