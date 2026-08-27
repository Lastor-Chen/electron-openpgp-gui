export type ApiAgentApis = {
  generateKey(opts: {
    outputDir: string
    name?: string
    email?: string
    comment?: string
  }): Promise<void>
  encrypt(filePaths: string[], pubkeyPaths: string[]): void
  decrypt(filePath: string, privKeyPath: string): void
}

export type ApiAgentEvents = {
  progress(percent: number): void
}
