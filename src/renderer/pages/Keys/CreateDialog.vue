<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue'

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
  failed: [error: Error]
}>()

const emailInput = useTemplateRef('emailInput')
const myForm = useTemplateRef('myForm')

const open = ref<boolean>()
watch(open, (isOpen) => {
  if (isOpen) {
    name.value = undefined
    email.value = undefined
    errMsg.value = ''

    myForm.value?.reset()
  }
})

const modal = injectConfirmModal()

const name = ref<string>()
const email = ref<string>()
const canSubmit = computed(() => Boolean(email.value))
const errMsg = ref('')

const disableOverlayDismiss = (e: Event) => e.preventDefault()

const isEmail = (val: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
}

const validate = () => {
  // const el = emailInput.value?.$el as HTMLInputElement
  // if (!el.checkValidity()) return void (errMsg.value = 'Invalid email format.')
  myForm.value?.checkValidity()

  // void genKey()
}

const genKey = async () => {
  try {
    await apiAgent.generateKey({
      name: name.value,
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
    emits('failed', err as Error)
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
      <div class="space-y-4">
        <form ref="myForm">
          <Input v-model="name" type="text" placeholder="name" />
          <Input
            ref="emailInput"
            v-model="email"
            type="email"
            class="mb-0 invalid:border-pink-500"
            placeholder="*email"
            required
          />
        </form>
        <p class="text-red-500">
          {{ errMsg || '&nbsp;' }}
        </p>
      </div>
      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline" size="sm">Cancel</Button>
        </DialogClose>
        <Button size="sm" :disabled="!canSubmit" @click="validate">Create</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
