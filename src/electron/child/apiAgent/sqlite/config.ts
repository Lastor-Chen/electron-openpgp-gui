import fs from 'node:fs'
import path from 'node:path'

import { Migrator } from '@mikro-orm/migrations'
import { defineConfig, SqliteDriver, NodeSqliteDialect } from '@mikro-orm/sql'

import { Migration20260902070724 } from './migrations/Migration20260902070724'
import { PgpKey } from './schemas/pgpKey'

const migrationFiles = fs.globSync('migrations/*.{js,ts}', { cwd: import.meta.dirname })
export const appMigrationCount = migrationFiles.length

// mikro-orm 用 migrations.path 會嘗試找 tinyglobby 沒有就用 fs.glob
// tinyglobby 在 win32 + asar 於不同路徑用 command 開啟會不 work
// fs.glob 在 electron v42 較舊版 asar 的 Dirent 實作有問題會報錯
// https://github.com/electron/electron/issues/51838
export function baseConfig(dbPath: string) {
  return defineConfig({
    driver: SqliteDriver,
    driverOptions: new NodeSqliteDialect(dbPath),
    dbName: dbPath,
    entities: [PgpKey],
    extensions: [Migrator],
    migrations: {
      tableName: 'schema_migrations',
      path: path.join(import.meta.dirname, './migrations'),
      migrationsList: [
        Migration20260902070724,
        // oxlint-disable-next-line unicorn/no-array-sort
      ].sort((a, b) => a.name.localeCompare(b.name)),
    },
  })
}
