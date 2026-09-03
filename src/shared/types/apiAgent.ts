export type ApiAgentApis = {
  initDb(): Promise<string | undefined>
  resetDb(): Promise<void>
  generateKey(opts: { name?: string; email?: string }): Promise<void>
  getPgpKeys(): Promise<{ key_id: string; name?: string | null; email?: string | null }[]>
  encrypt(filePaths: string[], pubkeyIds: string[]): void
  decrypt(filePath: string): void
}

export type ApiAgentEvents = {
  progress(percent: number): void
}
