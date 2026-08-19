import type { WindowIpcChild } from '@utility-bridger/types'

declare global {
  interface Window {
    ipcChild: WindowIpcChild
    allowDevLog: boolean
  }
}
