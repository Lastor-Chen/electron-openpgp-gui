export type ApiAgentApis = {
  initDb(): Promise<string | undefined>
  resetDb(): Promise<void>
  generateKey(opts: { name?: string; email?: string }): Promise<void>
  getPgpKeys(): Promise<PgpKeysResponse>
  encrypt(filePaths: string[], pubkeyIds: string[]): void
  decrypt(filePath: string): void
}

export type ApiAgentEvents = {
  progress(percent: number): void
}

export type PgpKeysResponse = {
  key_id: string
  is_owner: boolean
  name?: string | null
  email?: string | null
  expires?: string | null
  fingerprint: string
}[]
