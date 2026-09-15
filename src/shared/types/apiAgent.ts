export type ApiAgentApis = {
  initDb(): Promise<string | undefined>
  resetDb(): Promise<void>
  generateKey(opts: { name?: string; email?: string }): Promise<void>
  getPgpKeys(): Promise<PgpKeysResponse>
  deleteKey(keyIds: string[]): Promise<void>
  exportKeys(keyIds: string[], outputPath: string): Promise<void>
  importKey(filePath: string): Promise<Pick<TPgpKey, 'key_id' | 'name' | 'email'>[]>
  encrypt(filePaths: string[], pubkeyIds: string[]): void
  decrypt(filePath: string): void
}

export type ApiAgentEvents = {
  progress(percent: number): void
}

export type TPgpKey = {
  key_id: string
  is_owner: boolean
  name?: string | null
  email?: string | null
  expires?: string | null
  fingerprint: string
}

export type PgpKeysResponse = TPgpKey[]
