// 給 mikro-orm cli 自動比對 schema diff 產生 migration
import { defineConfig } from '@mikro-orm/sql'

// 不使用 path alias, 在 tsconfig 複雜環境 path alias 不好處理
// mikro-orm 會找有無安裝 oxc, tsx, jiti... 來跑 ts
// jiti 實際跑 migration:up 會有問題
import { baseConfig } from './src/electron/child/apiAgent/sqlite/config.ts'

// 非 electron 環境拿不到 app userPath, 用環境變數設定
process.loadEnvFile()
const dbPath = process.env.DB_PATH
if (!dbPath) throw new Error('Please set DB_PATH in .env')

const base = baseConfig(dbPath)

// 生成 migration file:
// - mikro-orm migration:create [--initial]
export default defineConfig({
  ...base,
  migrations: {
    ...base.migrations,
    pathTs: './src/electron/child/apiAgent/sqlite/migrations',
  },
  debug: true,
})
