import type { CustomImportMetaEnv } from '@shared/types/global'

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: string
      APP_ROOT: string
    }
  }

  interface ImportMetaEnv extends CustomImportMetaEnv {}
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}
