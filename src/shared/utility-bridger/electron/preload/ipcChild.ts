import type { ErrorLike, WindowIpcChild } from '@utility-bridger/types'
import { ipcRenderer, contextBridge } from 'electron'
import type { IpcRendererEvent } from 'electron'

export function bridgeIpcChild() {
  /** 紀錄已經 crash 的子程序 */
  const crashedChildMap: Record<string, ErrorLike> = {}

  // 負責紀錄 crash 狀態
  ipcRenderer.on('system:childCrash', (_, errorLike: ErrorLike, childName: string) => {
    crashedChildMap[childName] = errorLike
  })

  contextBridge.exposeInMainWorld('ipcChild', {
    postMessage(childName, key, ...args) {
      return ipcRenderer.invoke('invoke-child', childName, key, ...args)
    },
    on(childName, event, listener) {
      const channel = `${childName}:trigger:${event}`
      const cb = (_ev: IpcRendererEvent, ...args: any[]) => {
        listener(...args)
      }

      ipcRenderer.on(channel, cb)

      return () => {
        ipcRenderer.removeListener(channel, cb)
      }
    },
    onCrash(childName, listener) {
      const channel = 'system:childCrash'
      const cb = (_ev: IpcRendererEvent, errorLike: ErrorLike, crashedChildName: string) => {
        if (childName !== crashedChildName) return
        listener(errorLike)
      }

      ipcRenderer.on(channel, cb)

      // 在 crash 之後才掛監聽, 會走這
      if (childName in crashedChildMap) {
        const errorLike = crashedChildMap[childName]
        if (errorLike) listener(errorLike)
      }

      return () => {
        ipcRenderer.removeListener(channel, cb)
      }
    },
  } satisfies WindowIpcChild)
}
