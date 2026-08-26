import fs from 'node:fs'
import path from 'node:path'

import type { ApiAgentApis } from '@shared/types/apiAgent'
import * as openpgp from 'openpgp'

export const pgpHandlers: ApiAgentApis = {
  async generateKey(opts) {
    const { outputDir, name, email, comment } = opts || {}
    const day = 365

    if (!fs.statSync(outputDir).isDirectory()) throw new Error('outputDir invalid')

    const keyPair = await openpgp.generateKey({
      type: 'ecc',
      curve: 'curve25519Legacy',
      userIDs: [{ name, email, comment }],
      format: 'armored',
      keyExpirationTime: day * (24 * 60 * 60), // in sec
    })

    const privKey = await openpgp.readPrivateKey({ armoredKey: keyPair.privateKey })
    const privKeyId = privKey.getKeyID().toHex()
    // const encKeyId = (await privKey.getEncryptionKey()).getKeyID().toHex()

    // 先存到外部
    const saveDir = path.join(outputDir, privKeyId)
    fs.mkdirSync(saveDir, { recursive: true })

    fs.writeFileSync(path.join(saveDir, 'private.asc'), keyPair.privateKey)
    fs.writeFileSync(path.join(saveDir, 'public.asc'), keyPair.publicKey)
    fs.writeFileSync(path.join(saveDir, 'revocation.asc'), keyPair.revocationCertificate)
  },
}
