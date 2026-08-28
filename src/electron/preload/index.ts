import type { AppInfo } from '@shared/types/global'
import { bridgeRpcChild } from '@utility-bridger/electron/preload'
import { contextBridge, ipcRenderer } from 'electron'
import type { IpcRendererEvent } from 'electron'

bridgeRpcChild()

contextBridge.exposeInMainWorld('appInfo', {
  version: import.meta.env.VITE_APP_VERSION,
  env: import.meta.env.NODE_ENV,
} satisfies AppInfo)

contextBridge.exposeInMainWorld('ipcRenderer', {
  on(channel: string, listener: (...args: unknown[]) => void) {
    const cb = (_ev: IpcRendererEvent, ...args: unknown[]) => listener(...args)
    ipcRenderer.on(channel, cb)

    return () => {
      ipcRenderer.off(channel, cb)
    }
  },
  invoke(channel: string, ...args: unknown[]) {
    return ipcRenderer.invoke(channel, ...args)
  },
})
