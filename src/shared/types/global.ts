export interface CustomImportMetaEnv {
  readonly VITE_APP_VERSION: string
  readonly NODE_ENV: string
}

export interface AppInfo {
  version: string
  env: string
}
