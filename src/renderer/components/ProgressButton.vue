<script setup lang="ts">
import { ref } from 'vue'

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

const props = defineProps<{
  onClick(): void | Promise<void>
  disabled?: boolean
}>()

const emits = defineEmits<{
  cancel: []
}>()

const open = ref(false)
const progress = apiAgentRef('progress', { initValue: 0 })

const onClick = async () => {
  try {
    await props.onClick()
  } finally {
    open.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <Button :disabled="props.disabled" @click="onClick">
        <slot />
      </Button>
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
          <Button variant="outline" size="sm" @click="emits('cancel')">Cancel</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
