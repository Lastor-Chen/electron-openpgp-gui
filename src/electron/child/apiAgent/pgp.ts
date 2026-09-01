import fs from 'node:fs'
import path from 'node:path'
import stream from 'node:stream'

import type { ApiAgentApis, ApiAgentEvents } from '@shared/types/apiAgent'
import { createTrigger } from '@shared/utility-bridger/electron/child'
import { ZipArchive } from 'archiver'
import * as openpgp from 'openpgp'

import { initDb, migrateDb } from '@/child/apiAgent/sqlite'
import type { OrmClient } from '@/child/apiAgent/sqlite'
import { createProgressStream, renameIfExisted } from '@/child/apiAgent/utils'

const trigger = createTrigger<ApiAgentEvents>()

const dbDirArg = process.argv.find((val) => val.startsWith('--db-dir'))
const dbDir = dbDirArg?.split('=')[1]
const dbPath = dbDir ? path.join(dbDir, 'pgp_data') : undefined
let db: OrmClient | undefined

export const pgpHandlers: ApiAgentApis = {
  async initDb() {
    if (db) return dbPath // 確保只執行 1 次

    if (!dbPath) throw new Error('NO_DB_DIR')
    db = await initDb(dbPath)

    await migrateDb(db.orm)

    return dbPath
  },
  async resetDb() {
    if (!db || !dbPath) return

    await db.orm.close(true)
    fs.rmSync(dbPath, { force: true })

    db = await initDb(dbPath)
    await db.orm.migrator.up()
  },
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
  async encrypt(filePaths, pubkeyPaths) {
    // create pack files stream
    const archive = new ZipArchive({ zlib: { level: 0 } })

    let totalBytes = 0
    filePaths.forEach((file) => {
      const stat = fs.statSync(file)
      totalBytes += stat.size
      const name = path.basename(file)

      if (stat.isDirectory()) {
        archive.directory(file, name)
      } else {
        archive.file(file, { name })
      }
    })

    archive.finalize()

    // create encrypt stream
    const message = await openpgp.createMessage({ binary: stream.Readable.toWeb(archive) })

    const encryptionKeys = await Promise.all(
      pubkeyPaths.map((keyPath) => {
        const pubkey = fs.readFileSync(keyPath, 'utf8')
        return openpgp.readKey({ armoredKey: pubkey })
      }),
    )

    const encryptStream = await openpgp.encrypt({
      message,
      encryptionKeys,
      format: 'binary',
    })

    // 輸出到 input 相同資料夾
    let output = ''
    if (filePaths.length > 1) {
      const dir = path.dirname(filePaths[0]!)
      output = renameIfExisted(path.join(dir, 'Encrypted.zip.pgp'))
    } else {
      output = renameIfExisted(`${filePaths[0]}.zip.pgp`)
    }

    const writable = fs.createWriteStream(output)

    // progress bar
    const progressStream = createProgressStream(totalBytes, {
      onTransform(percent) {
        trigger('progress', percent)
      },
    })

    await stream.promises.pipeline(
      encryptStream,
      // node24 pipeline 可以混 stream, 但 @types/node 要 v26 才跟上
      stream.Transform.fromWeb(progressStream),
      writable,
    )
  },
  async decrypt(filePath: string, privKeyPath: string) {
    const totalBytes = fs.statSync(filePath).size

    // read file
    const readable = fs.createReadStream(filePath)
    const message = await openpgp.readMessage({ binaryMessage: stream.Readable.toWeb(readable) })

    // 找私鑰
    const armoredPrivKey = fs.readFileSync(privKeyPath, 'utf8')
    const privKey = await openpgp.readPrivateKey({ armoredKey: armoredPrivKey })

    // decrypt
    const { data: decryptStream } = await openpgp.decrypt({
      message,
      decryptionKeys: [privKey],
      format: 'binary',
      config: {
        allowUnauthenticatedStream: true,
      },
    })

    // handle output
    let output = path.basename(filePath, '.pgp')
    output = path.basename(output, '.gpg')
    output = path.join(path.dirname(filePath), output)
    output = renameIfExisted(output)

    const writable = fs.createWriteStream(output)

    // progress bar
    const progressStream = createProgressStream(totalBytes, {
      onTransform(percent) {
        trigger('progress', percent)
      },
    })

    await stream.promises.pipeline(
      decryptStream,
      stream.Transform.fromWeb(progressStream),
      writable,
    )
  },
}
