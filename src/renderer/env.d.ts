import type { CustomImportMetaEnv, AppInfo, IpcRendererApis } from '@shared/types/global'

declare global {
  interface Window {
    appInfo: AppInfo
    ipcRenderer: IpcRendererApis
  }

  interface ImportMetaEnv extends CustomImportMetaEnv {}
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}
