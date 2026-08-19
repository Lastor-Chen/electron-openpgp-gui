import type { CustomImportMetaEnv, AppInfo } from '@shared/types/global'

declare global {
  interface Window {
    appInfo: AppInfo
  }

  interface ImportMetaEnv extends CustomImportMetaEnv {}
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}
