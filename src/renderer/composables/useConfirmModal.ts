import { h, shallowRef, inject, provide } from 'vue'
import type { FunctionalComponent, InjectionKey } from 'vue'

import ConfirmModal from '@/components/ConfirmModal.vue'
import type { ConfirmModalConfig, ConfirmModalProps } from '@/components/ConfirmModal.vue'

type ConfirmModalExposed = {
  open(configs: ConfirmModalConfig): Promise<boolean>
}

const ConfirmModalKey = Symbol('GlobalQuickModal') as InjectionKey<ConfirmModalExposed>

export const useConfirmModal = (opts?: { provide?: boolean }) => {
  const modal = shallowRef<InstanceType<typeof ConfirmModal>>()

  const Wrapped: FunctionalComponent<ConfirmModalProps> = (props, { slots }) => {
    return h(ConfirmModal, { ref: modal, ...props }, slots)
  }

  const exposed: ConfirmModalExposed = {
    async open(configs) {
      if (!modal.value) throw new Error('Cannot find ConfirmModal instance.')

      return await modal.value.open(configs)
    },
  }

  if (opts?.provide) provide(ConfirmModalKey, exposed)

  return [exposed, Wrapped] as const
}

export const injectConfirmModal = (): ConfirmModalExposed => {
  const modal = inject(ConfirmModalKey)
  if (!modal) throw new Error('Cannot find ConfirmModal instance on parent.')

  return modal
}
