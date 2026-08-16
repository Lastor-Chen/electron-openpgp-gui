import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('appInfo', {
  version: import.meta.env.VITE_APP_VERSION,
  env: import.meta.env.NODE_ENV,
})
