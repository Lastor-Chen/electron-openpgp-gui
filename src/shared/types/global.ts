export interface CustomImportMetaEnv {
  readonly VITE_APP_VERSION: string
  readonly NODE_ENV: string
}

export type ElectronApi = {
  appInfo: {
    version: string
    env: string
    platform: string
  }
  getPathForFile(file: File): string
}

export type IpcMainApis = {
  openFileBrowser(opts: {
    properties?: ('openDirectory' | 'openFile' | 'multiSelections')[]
    filters?: { name: string; extensions: string[] }[]
  }): { path: string; basename: string; dirname: string }[] | undefined
  saveFileBrowser(opts: {
    defaultPath?: string
    filters?: { name: string; extensions: string[] }[]
  }): { path: string; basename: string; dirname: string } | undefined
  openFileManager(filePath: string): void
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
