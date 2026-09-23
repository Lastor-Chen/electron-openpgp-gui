export type ApiAgentApis = {
  initDb(): Promise<string | undefined>
  resetDb(): Promise<void>
  generateKey(opts: { name?: string; email?: string }): Promise<void>
  getPgpKeys(): Promise<PgpKeysResponse>
  deleteKey(keyIds: string[]): Promise<void>
  exportKeys(keyIds: string[], outputPath: string, includePrivate?: boolean): Promise<void>
  importKey(filePath: string): Promise<{
    parsedCount: number
    imported: PgpKeyUser[]
    failed: (PgpKeyUser & { error?: string })[]
  }>
  encrypt(filePaths: string[], pubkeyIds: string[]): Promise<{ path: string; name: string }>
  abortEncrypt(): void
  decrypt(filePath: string): void
}

export type ApiAgentEvents = {
  progress(percent: number): void
}

export type TPgpKey = {
  key_id: string
  has_private: boolean
  name?: string | null
  email?: string | null
  expires?: string | null
  fingerprint: string
}

export type PgpKeysResponse = TPgpKey[]

export type PgpKeyUser = Pick<TPgpKey, 'key_id' | 'name' | 'email'>
