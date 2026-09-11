<script setup lang="ts">
import { InfoIcon, TriangleAlertIcon, CircleCheckIcon, CircleXIcon } from '@lucide/vue'
import { useConfirmDialog } from '@vueuse/core'
import { markRaw, ref } from 'vue'
import type { Component } from 'vue'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export type ConfirmModalConfig = {
  title: string
  content?: string | Component
  /** 使用 slot 替代 content */
  slot?: string
  /** @default "info" */
  icon?: 'info' | 'warn' | 'success' | 'error'
  confirmText?: string
  /** @default true */
  cancelText?: string | boolean
}

export type ConfirmModalProps = {
  defaultConfirm?: string
  defaultCancel?: string
}

const props = withDefaults(defineProps<ConfirmModalProps>(), {
  defaultConfirm: 'OK',
  defaultCancel: 'Cancel',
})

const config = ref<ConfirmModalConfig>()

const isComponent = (val: ConfirmModalConfig['content']): val is Component => {
  return Boolean(val && typeof val !== 'string')
}

const { reveal, isRevealed, confirm, cancel } = useConfirmDialog<ConfirmModalConfig, true, false>()

defineExpose({
  async open(configs: ConfirmModalConfig) {
    config.value = {
      ...configs,
      cancelText: configs.cancelText ?? true,
      // Component 為複雜物件, 不應直接存到 ref
      content: isComponent(configs.content) ? markRaw(configs.content) : configs.content,
    }

    const { data } = await reveal()

    return Boolean(data)
  },
})
</script>

<template>
  <AlertDialog :open="isRevealed">
    <AlertDialogContent @escape-key-down="cancel(false)">
      <AlertDialogHeader>
        <AlertDialogTitle class="flex items-center gap-x-2">
          <TriangleAlertIcon class="size-8 text-orange-400" v-if="config?.icon === 'warn'" />
          <CircleCheckIcon class="size-8 text-green-500" v-else-if="config?.icon === 'success'" />
          <CircleXIcon class="size-8 text-red-600" v-else-if="config?.icon === 'error'" />
          <InfoIcon class="size-8 text-blue-400" v-else />
          {{ config?.title }}
        </AlertDialogTitle>
        <AlertDialogDescription>
          <template v-if="isComponent(config?.content)">
            <component :is="config.content" />
          </template>
          <span v-else-if="config?.content" class="wrap-anywhere">
            {{ config.content }}
          </span>
          <slot v-else :name="config?.slot || 'default'" />
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel v-if="config?.cancelText" @click="cancel(false)">
          {{ config.cancelText === true ? props.defaultCancel : config.cancelText }}
        </AlertDialogCancel>
        <AlertDialogAction @click="confirm(true)">
          {{ config?.confirmText || props.defaultConfirm }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
