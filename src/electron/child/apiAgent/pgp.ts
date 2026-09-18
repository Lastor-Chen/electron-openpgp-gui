import fs from 'node:fs'
import path from 'node:path'
import stream from 'node:stream'

import { serialize } from '@mikro-orm/core'
import type { ApiAgentApis, ApiAgentEvents, PgpKeyUser } from '@shared/types/apiAgent'
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
    if (!db) throw new Error('DB_NOT_READY')

    const userId: openpgp.UserID = {
      name: opts.name?.trim() || undefined,
      email: opts.email?.trim() || undefined,
    }
    const day = 365

    const keyPair = await openpgp.generateKey({
      type: 'ecc',
      curve: 'curve25519Legacy',
      userIDs: [userId],
      format: 'armored',
      keyExpirationTime: day * (24 * 60 * 60), // in sec
    })

    const privKey = await openpgp.readPrivateKey({ armoredKey: keyPair.privateKey })
    const keyId = privKey.getKeyID().toHex()

    const encKey = await privKey.getEncryptionKey()
    const encKeyId = encKey.getKeyID().toHex()

    // Returns Infinity if the key doesn't expire, or null if the key is revoked or invalid
    // https://docs.openpgpjs.org/Key.html#getExpirationTime
    const expirationTime = (await privKey.getExpirationTime()) as Date

    const em = db.em.fork()
    em.create(db.PgpKey, {
      key_id: keyId,
      is_owner: true,
      name: userId.name,
      email: userId.email,
      encryption_key_id: encKeyId,
      fingerprint: privKey.getFingerprint(),
      created: privKey.getCreationTime().toISOString(),
      expires: expirationTime.toISOString(),
      public_key: keyPair.publicKey,
      private_key: keyPair.privateKey,
      revocation_cert: keyPair.revocationCertificate,
    })

    await em.flush()
  },
  async getPgpKeys() {
    if (!db) throw new Error('DB_NOT_READY')

    const em = db.em.fork()
    const pgpKeyEntities = await em.findAll(db.PgpKey, {
      fields: ['key_id', 'is_owner', 'name', 'email', 'expires', 'fingerprint'],
    })

    return serialize(pgpKeyEntities)
  },
  async deleteKey(keyIds) {
    if (!db) throw new Error('DB_NOT_READY')
    if (!keyIds?.length) return

    const em = db.em.fork()
    await em.nativeDelete(db.PgpKey, { key_id: keyIds })
  },
  async exportKeys(keyIds, outputPath) {
    if (!db) throw new Error('DB_NOT_READY')

    const em = db.em.fork()
    const pgpKeyEntities = await em.find(db.PgpKey, { key_id: keyIds })
    if (!pgpKeyEntities.length) return

    const keyRows = serialize(pgpKeyEntities)

    // 合併成一個 armored block string
    // https://github.com/openpgpjs/openpgpjs/issues/466
    const packetList = new openpgp.PacketList()
    const pgpKeys = await Promise.all(
      keyRows.map((row) => {
        return openpgp.readKey({ armoredKey: row.public_key })
      }),
    )

    for (const key of pgpKeys) {
      key.toPacketList().forEach((packet) => packetList.push(packet))
    }

    const armored = openpgp.armor(openpgp.enums.armor.publicKey, packetList.write())
    fs.writeFileSync(outputPath, armored, 'utf8')
  },
  async importKey(filePath: string) {
    if (!db) throw new Error('DB_NOT_READY')

    const rawStr = fs.readFileSync(filePath, 'utf8')

    // parse key file
    // 兩種情況:
    // 單一 armored block 內含多把 keys
    // 多個 armored block
    const splitArmoredKeys =
      rawStr.match(
        /-----BEGIN PGP (PUBLIC|PRIVATE) KEY BLOCK-----[\s\S]+?-----END PGP \1 KEY BLOCK-----/g,
      ) || []

    let keys: openpgp.Key[] = []
    if (splitArmoredKeys.length > 1) {
      const keysArr = await Promise.all(
        splitArmoredKeys.map((armored) => openpgp.readKeys({ armoredKeys: armored })),
      )
      keys = keysArr.flat()
    } else {
      keys = await openpgp.readKeys({ armoredKeys: rawStr })
    }

    const keyInfos = await Promise.all(
      keys.map(async (key) => {
        const [primaryUser, encryptionKey, expirationTime] = await Promise.all([
          key.getPrimaryUser(),
          key.getEncryptionKey(),
          key.getExpirationTime(),
        ])

        return {
          key_id: key.getKeyID().toHex(),
          is_owner: false,
          name: primaryUser.user.userID?.name,
          email: primaryUser.user.userID?.email,
          encryption_key_id: encryptionKey.getKeyID().toHex(),
          fingerprint: key.getFingerprint(),
          created: key.getCreationTime().toISOString(),
          expires: expirationTime instanceof Date ? expirationTime.toISOString() : null,
          public_key: key.toPublic().armor(),
          private_key: key.isPrivate() ? key.armor() : null,
          // 只能從已被 revoked 的私鑰取得, 邏輯上匯入時不需要
          revocation_cert: null,
        }
      }),
    )

    // write to db
    const results = await Promise.all<PgpKeyUser & { error?: string }>(
      keyInfos.map(async (keyInfo) => {
        try {
          const em = db!.em.fork()
          em.create(db!.PgpKey, keyInfo)
          await em.flush()

          return {
            key_id: keyInfo.key_id,
            name: keyInfo.name,
            email: keyInfo.email,
          }
        } catch (err) {
          const error = err as Error
          const errorNameMap: Record<string, string> = {
            UniqueConstraintViolationException: 'KEY_EXISTS',
          }

          return {
            error: errorNameMap[error.name] || error.name,
            key_id: keyInfo.key_id,
            name: keyInfo.name,
            email: keyInfo.email,
          }
        }
      }),
    )

    const grouped = Object.groupBy(results, (item) => (item.error ? 'failed' : 'success'))

    return {
      parsedCount: keyInfos.length,
      imported: grouped.success || [],
      failed: grouped.failed || [],
    }
  },
  async encrypt(filePaths, pubkeyIds: string[]) {
    if (!db) throw new Error('DB_NOT_READY')

    // query public keys
    const em = db.em.fork()
    const pgpKeyEntities = await em.find(db.PgpKey, pubkeyIds, { fields: ['public_key'] })
    const pgpKeyDtos = serialize(pgpKeyEntities)

    // create pack files stream
    const archive = new ZipArchive({ zlib: { level: 0 } })

    let totalBytes = 0
    filePaths.forEach((file) => {
      const stat = fs.statSync(file)
      const name = path.basename(file)

      if (stat.isFile()) {
        totalBytes += stat.size

        archive.file(file, { name })
      } else if (stat.isDirectory()) {
        const dirFiles = fs.readdirSync(file, { recursive: true, encoding: 'utf8' })
        dirFiles.forEach((dirFile) => {
          const subStat = fs.statSync(path.join(file, dirFile))
          if (subStat.isFile()) totalBytes += subStat.size
        })

        archive.directory(file, name)
      } else {
        throw new Error(`Unsupported: ${file}`)
      }
    })

    void archive.finalize()

    // create encrypt stream
    const message = await openpgp.createMessage({ binary: stream.Readable.toWeb(archive) })

    const encryptionKeys = await Promise.all(
      pgpKeyDtos.map((row) => openpgp.readKey({ armoredKey: row.public_key })),
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
  async decrypt(filePath: string) {
    if (!db) throw new Error('DB_NOT_READY')

    const totalBytes = fs.statSync(filePath).size

    // read file
    const readable = fs.createReadStream(filePath)
    const message = await openpgp.readMessage({ binaryMessage: stream.Readable.toWeb(readable) })

    // 找私鑰
    const encKeyIds = message.getEncryptionKeyIDs().map((keyId) => keyId.toHex())
    const em = db.em.fork()
    const privKeyEntities = await em.find(
      db.PgpKey,
      { encryption_key_id: { $in: encKeyIds } },
      { fields: ['private_key'] },
    )
    const privKeyDtos = serialize(privKeyEntities)

    const privKeys = await Promise.all(
      privKeyDtos.flatMap((row) => {
        if (!row.private_key) return []

        return openpgp.readPrivateKey({ armoredKey: row.private_key })
      }),
    )

    // decrypt
    const { data: decryptStream } = await openpgp.decrypt({
      message,
      decryptionKeys: privKeys,
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
