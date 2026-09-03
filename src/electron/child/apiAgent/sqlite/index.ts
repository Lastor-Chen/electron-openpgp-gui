import { MikroORM } from '@mikro-orm/sql'
import type { EntityManager, EntitySchema } from '@mikro-orm/sql'

import { getDbAppId, isAppId } from '@/child/apiAgent/sqlite/appIdUtils'
import { baseConfig, appMigrationCount } from '@/child/apiAgent/sqlite/config'
import { PgpKeySchema } from '@/child/apiAgent/sqlite/schemas/pgpKey'
import type { PgpKeyEntity } from '@/child/apiAgent/sqlite/schemas/pgpKey'

export type OrmClient = {
  orm: MikroORM
  em: EntityManager
  PgpKey: EntitySchema<PgpKeyEntity>
}

export async function initDb(dbPath: string): Promise<OrmClient> {
  const orm = await MikroORM.init(baseConfig(dbPath))

  return {
    orm,
    em: orm.em,
    PgpKey: PgpKeySchema,
  }
}

export async function migrateDb(orm: MikroORM) {
  // 檢查 app id
  const kysely = orm.em.getKysely()
  const tables = await kysely.introspection.getTables()
  const userTables = tables.filter((table) => table.name !== orm.config.get('migrations').tableName)
  const hasTable = userTables.length
  const appId = await getDbAppId(orm.em)
  if (hasTable && !isAppId(appId)) throw new Error('INVALID_DB')

  // 檢查舊 app 開到新 db
  const executed = await orm.migrator.getExecuted()
  if (executed.length > appMigrationCount) throw new Error('DB_TOO_NEW')

  // migrate to latest
  await orm.migrator.up()
}

/** 驗證給予的 file 是否為此 app 所生成的 sqlite */
export async function validateDbFile(dbPath: string) {
  await using dispose = {
    orm: await MikroORM.init(baseConfig(dbPath)),
    async [Symbol.asyncDispose]() {
      await this.orm.close(true) // 可能未必需要等
    },
  }
  const { orm } = dispose

  // 檢查 app id
  const appId = await getDbAppId(orm.em)
  if (!isAppId(appId)) throw new Error('INVALID_ID')

  // 檢查舊 app 開到新 db
  const executed = await orm.migrator.getExecuted()
  if (executed.length > appMigrationCount) throw new Error('DB_TOO_NEW')

  try {
    await orm.migrator.up()
  } catch (err) {
    throw new Error(`MIGRATION_FAILED\n${String(err)}`, { cause: err })
  }
}
