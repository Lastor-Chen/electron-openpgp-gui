<script setup lang="ts">
import { computed, ref, toRaw } from 'vue'

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
import { Progress } from '@/components/ui/progress'
import { apiAgentRef } from '@/composables/useChildRef'
import { injectConfirmModal } from '@/composables/useConfirmModal'
import { apiAgent } from '@/rpcChild'

const props = defineProps<{
  files: string[]
  keyIds: string[]
  disabled?: boolean
}>()

const emits = defineEmits<{
  success: []
}>()

const modal = injectConfirmModal()

const canSubmit = computed(() => {
  return props.files.length && props.keyIds.length
})

const open = ref<boolean>()
const progress = apiAgentRef('progress', { initValue: 0 })

const encrypt = async () => {
  if (!canSubmit.value) return

  try {
    const output = await apiAgent.encrypt(toRaw(props.files), toRaw(props.keyIds))

    modal
      .open({
        icon: 'success',
        title: 'Encryption successful',
        content: output.name,
        cancelText: 'Open folder',
      })
      .then((bool) => {
        if (bool === false) window.ipcRenderer.invoke('openFileManager', output.path)
      })

    emits('success')
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

const cancel = () => {
  void apiAgent.abortEncrypt()
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <Button :disabled="!canSubmit" @click="encrypt">Encrypt</Button>
    </DialogTrigger>
    <DialogContent
      :show-close-button="false"
      :aria-describedby="undefined"
      @interact-outside="(e) => e.preventDefault()"
    >
      <DialogHeader>
        <DialogTitle>Encrypting...</DialogTitle>
      </DialogHeader>

      <div class="my-4">
        <Progress :model-value="progress" />
        <p class="text-right">{{ progress }}%</p>
      </div>

      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline" size="sm" @click="cancel">Cancel</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
