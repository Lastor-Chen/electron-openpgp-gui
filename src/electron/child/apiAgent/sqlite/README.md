# DB migration 流程

mikro-orm cli 能夠自動根據 sqlite schema 變更的 diff 生成 migration SQL。但需注意 sqlite 本身有限制，少數情況生成的 SQL 可能不堪用。

1. 設定 DB_PATH 環境變數

cli 無法取得 electron user path，所以用環境變數來告訴它 db 位置。在根目錄建立 `.env` 檔案，設定 DB_PATH。

```
# windows
DB_PATH="C:/Users/<user>/AppData/Roaming/electron-openpgp-gui/pgp_data"

# mac
DB_PATH="/Users/<user>/Library/Application Support/electron-openpgp-gui/pgp_data"
```

2. 修改 `src/electron/child/apiAgent/sqlite/schemas` 定義

```ts
export const SomeSchema = defineEntity({
  // ...
  properties: {
    // add or modify
    some: p.text().nullable(),
  },
})
```

3. 執行 mikro-orm cli 生成 migration file

```
pnpm exec mikro-orm migration:create
```

4. 引用生成的 `src/electron/child/apiAgent/sqlite/migrations/MigrationXXXX.ts` 到 mikro-orm config

```ts
// src/electron/child/apiAgent/sqlite/config.ts
import { MigrationXXXX } from './migrations/MigrationXXXX.ts'

defineConfig({
  // ...
  migrations: {
    migrationsList: [
      // ...
      MigrationXXXX, // add it
    ],
  },
})
```

5. dev 啟動 app 確認 migration 是否成功，終端機會顯示相關 logs

```bash
[migrator] Processing 'MigrationXXXX'
[migrator] Applied 'MigrationXXXX'
```

6. 對新增的 migration file 做 oxfmt format，將其與 `.snapshot-{db_name}.json` 的變更一起 git commit

`.snapshot-{db_name}.json` 是 mikro-orm cli 判斷 schema 差異用的記錄檔，需要一起進 git 版控。打包後的 dist 不需要包含。

更多資訊: [MikroORM Snapshots](https://mikro-orm.io/docs/migrations#snapshots)
