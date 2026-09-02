export type ApiAgentApis = {
  initDb(): Promise<string | undefined>
  resetDb(): Promise<void>
  generateKey(opts: { name?: string; email?: string }): Promise<void>
  encrypt(filePaths: string[], pubkeyPaths: string[]): void
  decrypt(filePath: string, privKeyPath: string): void
}

export type ApiAgentEvents = {
  progress(percent: number): void
}
