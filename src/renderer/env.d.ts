import type { CustomImportMetaEnv, IpcRendererApis, ElectronApi } from '@shared/types/global'

declare global {
  interface Window {
    ipcRenderer: IpcRendererApis
    electronApi: ElectronApi
  }

  interface ImportMetaEnv extends CustomImportMetaEnv {}
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}
