export interface CustomImportMetaEnv {
  readonly VITE_APP_VERSION: string
  readonly NODE_ENV: string
}

export interface AppInfo {
  version: string
  env: string
}

export type IpcMainApis = {
  ping(msg: string): string
}

export type IpcMainEvents = {
  someEvent(a: string, b: number): void
}

export type IpcRendererApis = {
  invoke<K extends keyof IpcMainApis>(
    channel: K,
    ...args: Parameters<IpcMainApis[K]>
  ): Promise<ReturnType<IpcMainApis[K]>>
  on<K extends keyof IpcMainEvents>(
    channel: K,
    listener: (...args: Parameters<IpcMainEvents[K]>) => void,
  ): () => void
}
