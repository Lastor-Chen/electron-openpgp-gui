import type { EntityManager } from '@mikro-orm/sql'

/**
 * 識別用 sqlite application_id,
 * 它只接受 int32 4 bytes 的值
 * 數字不好辨識, 借用 FourCC 的概念, 將特定 4 char 轉為 int32 作為 id
 */
const SQLITE_MAGIC = 'EPGP' // means "electron pgp"

function fourCCToNum(str: string): number {
  if (str.length !== 4) throw new Error('Must be 4 chars')

  const buf = Buffer.from(str, 'ascii')

  return buf.readInt32BE() // sqlite 是走 Big-Endian
}

function numToFourCC(num: number): string {
  const buf = Buffer.alloc(4)
  buf.writeInt32BE(num)

  return buf.toString('ascii')
}

export function getAppId() {
  return fourCCToNum(SQLITE_MAGIC)
}

export function isAppId(id: number) {
  const magicCode = numToFourCC(id)

  return magicCode === SQLITE_MAGIC
}

export async function getDbAppId(em: EntityManager) {
  const [{ application_id }] =
    await em.execute<[{ application_id: number }]>('PRAGMA application_id;')

  return application_id
}
