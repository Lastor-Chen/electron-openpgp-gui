import type { AppInfo } from '@shared/types/global'
import { bridgeIpcChild } from '@utility-bridger/electron/preload'
import { contextBridge } from 'electron'

bridgeIpcChild()

contextBridge.exposeInMainWorld('appInfo', {
  version: import.meta.env.VITE_APP_VERSION,
  env: import.meta.env.NODE_ENV,
} satisfies AppInfo)
