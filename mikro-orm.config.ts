// 給 mikro-orm cli 自動比對 schema diff 產生 migration
import { defineConfig } from '@mikro-orm/sql'

// mikro-orm 會自動找 ts runtime, 也可在 package.json 指定
// https://mikro-orm.io/docs/typescript-loaders#selecting-a-loader
// oxc-node 可以自動吃到 tsconfig 的 path alias
// tsx 要單獨指定 tsconfig 才能吃到 path alias
// jiti 實際跑 migration:up 會有問題
import { baseConfig } from '@/child/apiAgent/sqlite/config'

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
