import type { ElectronApi } from '@shared/types/global'
import { bridgeRpcChild } from '@utility-bridger/electron/preload'
import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type { IpcRendererEvent } from 'electron'

bridgeRpcChild()

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

contextBridge.exposeInMainWorld('electronApi', {
  appInfo: {
    version: import.meta.env.VITE_APP_VERSION,
    env: import.meta.env.NODE_ENV,
    platform: process.platform,
  },
  getPathForFile(file: File) {
    return webUtils.getPathForFile(file)
  },
} satisfies ElectronApi)
