export type ApiAgentApis = {
  generateKey(opts: {
    outputDir: string
    name?: string
    email?: string
    comment?: string
  }): Promise<void>
}

export type ApiAgentEvents = {}
