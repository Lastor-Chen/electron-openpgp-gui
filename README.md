# Electron OpenPGP GUI

An electron + vite boilerplate for myself.

個人研究 electron + vite 專案基礎建設的 boilerplate，並以 OpenPGP.js 非對稱加解密為命題，實際做一個 App 來試驗此架構。

## App Features

- PGP Keys 頁
  - list keys table
  - 前端 keyword filter
  - create new key pair
  - 匯入 .asc key 文件、支援單檔內含多把 keys 的格式
  - 匯出 .asc key(s) 文件、可多選、可選擇是否一同匯出私鑰
  - 比照 os 邏輯，支援 table 點擊 shift or ctrl (cmd) 組合鍵 click 多選
  - 選取後可開啟右鍵選單，進行 export or delete
- Encrypt 頁
  - 點擊開啟 file explorer 選單，選取要加密的檔案，可多選、可拖曳
  - 選擇 recipients 的公鑰，可多選
  - 會先 zip pack 後再加密到與 input 同目錄下，副檔名為 `.zip.pgp`
- Decrypt 頁
  - 點擊開啟 file explorer 選單，選取要解密的檔案，可拖曳
  - 顯示 recipients info
  - 會解密到與 input 同目錄下，維持 `.zip` 不解壓

## Download Unsigned App

在 [Release](https://github.com/Lastor-Chen/electron-openpgp-gui/releases/latest) 頁面下載對應平台的 Desktop App。

| System      | File                                      |
| ----------- | ----------------------------------------- |
| Windows x64 | OpenPGP-GUI-{version}-windows-x64.exe.zip |
| MacOS arm64 | OpenPGP-GUI-{version}-mac-arm64.dmg       |
| MacOS x64   | OpenPGP-GUI-{version}-mac-x64.dmg         |

注意，此 App 為非正式產品，沒有做 code signing，從網路下載時會被 OS 標記為未信任來源並限制啟動。<br>
請參考下列方式去強制啟動 App，或是直接 git clone 此專案以 dev 執行。

### Windows

解壓縮後，是一個免安裝的 portable exe，直接 Double-click 啟動。

瀏覽器直接下載 unsigned 的 exe 會被鎖定，需手動選擇「保留」->「仍要保留」後才會實際寫入到下載位置，因此打包成 zip 繞過瀏覽器的機制。解壓縮並執行 unsigned exe 時 Windows 會跳出警告，選擇「其他資訊」->「仍要執行」。

### MacOS

Double-click dmg 開啟，滑鼠拖曳 App 圖標至 Applications 資料夾後，右鍵 -> 退出，於啟動台開啟 App。

開啟 unsigned app 時會報出「已損毀」錯誤。請在終端機輸入以下指令來移除 quarantine 標籤，再重新開啟 App。

```shell
xattr -dr com.apple.quarantine /path/to/app
```

可參考 electron-builder 官方文件 [macOS-Specific](https://www.electron.build/docs/troubleshooting/#macos-specific) 關於「**App is damaged and can't be opened**」的說明。

## Remove App

Windows 直接刪除 portable exe。MacOS 直接刪除 app。

然而 Electron 會在不同 OS 特定的 user path 中儲存 Chromium 的本地資料，此 App 的 sqlite 也放在此位置。需手動刪除下列位置的 `electron-openpgp-gui` 資料夾。

```
# windows
C:\Users\<user>\AppData\Roaming\electron-openpgp-gui\

# mac
/Users/<user>/Library/Application Support/electron-openpgp-gui/
```

## Quick Start

- Node.js >= v24
- pnpm >= v11

### Clone this repo

```
git clone https://github.com/Lastor-Chen/electron-openpgp-gui.git
cd electron-openpgp-gui
```

### Install dependencies

```
pnpm install
```

### Start development

```
pnpm dev
```

## Project Structure

```
root/
  src/
    electron/
      child/             # Electron child process (UtilityProcess)
        apiAgent/
          sqlite/        # Sqlite and MikroORM module
      main/              # Electron main process
      preload/           # Preload CommonJS scripts
    renderer/            # Renderer vue3 frontend app
      components/
        ui/              # shadcn-vue source components
    shared/
      types/             # 共用 types
      utility-bridger/   # 子程序通訊 module
  vite-plugin-tsdown/    # 自製 vite plugin 串接 tsdown, 編譯 electron typescript
```

## Boilerplate Features

- 使用 package.json 新的 `devEngines.packageManager` 實現 only allow pnpm
- 使用 TypeScript Project References 整合 node.js / browser tsconfig，一次性 type check
- 使用 Oxc 做 linter 與 auto formatter，降低大量 eslint / prettier plugins 設定造成的負擔
- 自製 `vite-plugin-tsdown` 將 electron ts 編譯納入 vite dev 一起 HOT Reload
- 支援 `.node-version` 自動切換 node.js 版本 (需 node.js 版本管理器有支援)
- Electron Main 與 Renderer type-safe IPC 通訊封裝
- Electron UtilityProcess 與 Renderer type-safe RPC 通訊架構，執行 Native API 或較重的 functions
- Electron UtilityProcess 通訊 devtools debug logger 機制
- MikroORM runtime migration 機制
- 使用 Vue3 + shadcn-vue + tailwind 搭建前端 Renderer UI

### vite-plugin-tsdown

- 使用 tsdown 編譯 electron typescript
- 將 tsdown build 併入 vite 生命週期，一起 dev watch re-build
- 提供封裝好的 `spawnElectron()` 做 electron 的 watch re-start
- 繼承 vite importMetaEnv

在 `vite.config.ts` 設定 plugins

```ts
// vite.config.ts
import type { InlineConfig } from 'tsdown'
import { defineConfig } from 'vite'
import { tsdownPlugin, spawnElectron } from './vite-plugin-tsdown/src/index.ts'

export default defineConfig(({ command }) => {
  const isDev = command === 'serve'

  return {
    plugins: [
      tsdownPlugin({
        // dev 監聽要由 tsdown 打包的 files
        viteWatch: ['src/electron/**', 'src/shared/**'],
        // 使用內部包好的 spawnElectron 在 tsdown build 後啟動 electron
        onAllSuccess: isDev ? () => spawnElectron() : undefined,
        builds: [
          {
            // same with tsdown config
          },
        ],
      }),
    ],
  }
})
```

在 electron 設定 BrowserWindow 連線 vite dev server

```ts
// electron
import { app, BrowserWindow } from 'electron'

app.whenReady().then(() => {
  const win = new BrowserWindow()

  // vite-plugin-tsdown 內部會繼承並處理 vite 環境變數
  if (import.meta.env.DEV) {
    // dev 時, 指向 vite dev server url
    win.loadURL('http://localhost:5173/')
  } else {
    // prod 時, 指向 dist/index.html
    win.loadFile('path/to/dist/index.html')
  }
})
```

#### Options

```ts
type TsdownPluginOptions = {
  /** 搭配 onAllSuccess 使用, 改用 vite watch 替代 tsdown watch */
  viteWatch?: string[]
  /** tsdown builds 全部完成後的 callback, 可在此啟動 electron 或其他 node.js app */
  onAllSuccess?: (signal: AbortSignal) => void
  /** 同 tsdown.build 的 InlineConfig, 接受 array 做 multiple build task */
  builds: InlineConfig[]
}
```

tsdown 自己有 `watch` 與 `onSuccess`，但他是 array 的每個 build task 各自獨立，沒有整體的 afterBuilds hook 可用，所以另外做了 `viteWatch` 與 `onAllSuccess` 來補強。

### UtilityProcess 子程序通訊機制

- 與主程序隔離，用於執行 Native API 或較重的運算，不阻塞 electron 主程序
- 支援 type-safe 智能推斷
- 可從 main / renderer 或不同 child 之間，呼叫 child API
- 可從 child 發送事件，於 main / renderer 或其他 child 接收、執行 callback
- 將 child 發送的事件值，於 renderer 包裝成 Vue ref，讓 child 能主動 trigger 前端 re-render
- Browser devtools debug logger

#### Child Process

擴充 `@utility-bridger` 內部 interface 來定義 child name，提供 type 智能提示。

```ts
// src/config-env.d.ts
declare module '@utility-bridger/types.ts' {
  interface ChildNames {
    myChild: unknown // add custom child process name
  }
}
```

於 `src/shared/types/<child_name>.ts` 定義 child 要提供的 API types。

```ts
// src/shared/types/myChild.ts
export type MyChildApis = {
  echo(txt: string): void
  // ...
}

export type MyChildEvents = {
  stateUpdated(state: number): void
  // ...
}
```

於 `src/electron/child/<name>/index.ts` 建立子程序 entry file。

```ts
// src/electron/child/myChild/index.ts
import type { MyChildApis, MyChildEvents } from '@shared/types/myChild'
import {
  handleUncaught,
  bridgeRpcHandler,
  addConsoleLogPrefix,
  createTrigger,
  createRpcChild,
} from '@utility-bridger/electron/child'

// 將 uncaught error 傳給 renderer
handleUncaught()

// 設定 node.js console.log 前綴, 方便 debug 辨識
addConsoleLogPrefix('[MyChild]')

// 用於傳遞事件的封裝
const trigger = createTrigger<MyChildEvents>()

// 實作子程序要提供的 API functions
bridgeRpcHandler({
  echo(txt) {
    // 發送事件給 main 與 renderer
    trigger('stateUpdated', 1)

    return `echo ${txt}`
  },
  // ...
} satisfies MyChildApis)

// 若有多個 child 也能互相溝通
const someChild = createRpcChild<SomeChildApis, SomeChildEvents>('someChild')
someChild.invoke('foo')
someChild.on('someEvent', () => {})
```

#### Main Process

於 `src/electron/main/index.ts` fork 出子程序，可呼叫 child API 或監聽 events。

```ts
// src/electron/main/index.ts
import type { MyChildApis, MyChildEvents } from '@shared/types/myChild'
import { app } from 'electron'
import { forkChild } from '@utility-bridger/electron/main'

app.whenReady().then(async () => {
  const myChild = forkChild<MyChildApis, MyChildEvents>('childName', 'path/to/dist/child/entry.js')

  // invoke child's function
  const { result, error } = await myChild.invoke('echo', 'Hello Child')
  console.log(result) // "Hello Child"

  // listen events from child
  const listener = (state: number) => console.log(state)
  myChild.on('stateUpdated', listener)
  myChild.removeListener('stateUpdated', listener)
  myChild.removeAllListeners('stateUpdated')
})
```

#### Renderer Process

在前端 `src/renderer/rpcChild.ts` 建立 child 的 API caller。

```ts
// src/renderer/rpcChild.ts
import type { MyChildApis, MyChildEvents } from '@shared/types/myChild'
import { wrapRpcChild } from '@utility-bridger/vue'

export const myChild = wrapRpcChild<MyChildApis, MyChildEvents>('myChild')
```

監聽 child 發送的 event，將接收到的值包裝成 Vue composables 做成響應式 ref。

```ts
// src/renderer/composables/useChildRef.ts
import type { MyChildApis, MyChildEvents } from '@shared/types/myChild'

export const myChildRef = createChildRef<MyChildApis, MyChildEvents>('myChild')
```

在 Vue 中呼叫 child API 以及使用 child event ref。

```vue
<!-- src/renderer/App.vue -->
<script setup lang="ts">
import { onMounted, onScopeDispose } from 'vue'

import { myChildRef } from '@/composables/useChildRef'
import { myChild } from '@/rpcChild'

// child 事件值的 vue ref 包裝, 當 child trigger 時自動響應
const state = myChildRef('stateUpdated', { initValue: 0 })

// 從 renderer 呼叫 child API
const onClick = async () => {
  const result = await myChild.echo('Hello Child')
}

// 監聽 child onCrash 事件, 讓 renderer 可以反應出來
onMounted(() => {
  const clearChildListener = myChild.onCrash((err) => window.alert(`MyChild crashed: ${err}`))
  onScopeDispose(() => clearChildListener())
})
</script>

<template>
  <button @click="onClick">Click {{ state }}</button>
</template>
```

`@/rpcChild` 內的 `wrapRpcChild` 包裝內含 debug logger，會在 devtools 顯示 I/O 資訊，可用 `window.allowDevLog` boolean 值手動開關，production 時為 `false`

```
[myChild] Call echo: ['Hello Child']
[myChild] Response echo: echo Hello Child
```

### Sqlite runtime migration

- Migration first，第一筆 schema 就建立 migration file
- 第一筆 migration 會建立 sqlite application_id，便於匯出、匯入識別用
- 透過 mikro-orm cli 自動根據 schema diff 產生純 SQL 的 migration file
- 在 app 啟動時，檢查 application_id 以及 migration history 判斷是否需要更新

#### Why MikroORM

因為它支援 node.js 原生 node:sqlite，以及 programmatic migration (內部用 Umzug)。

Desktop App 不同於一般 Web App，database 是存在每個 user 自己的電腦上。所以 db schema 變更時，必須要能在 App 啟動時，runtime 進行 migrate。

node-sqlite、better-sqlite3 或 libsql 等 driver 都是 native binary，搭配 electron 在 build app 時，容易出現各種 native 打包問題。使用 node.js v24 新的原生 node:sqlite 可避開煩人的 native 打包問題，因此選擇有支援 node:sqlite 的 ORM。

Driver memo:

- node-sqlite - 已不再維護
- better-sqlite3 - 使用 ABI 編譯，node.js 與 electron 不兼容，需要用 @electron/rebuild 重編
- libsql - 自動根據當前 cpu 架構下載 binary，難以 build mac universal，且 windows 會有關不乾淨 db 被 lock 的問題

ORM memo:

- Sequelize - 僅支援 node-sqlite
- Prisma - migration 一定要用 cli，且 package size 相當肥
- Drizzle - 較肥，更偏 Query Builder
- TypeORM - 用 stage2 Class 裝飾器，不考慮

#### Migrate by mikro-orm cli

mikro-orm cli 能夠根據 sqlite schema 變更的 diff 自動生成 migration SQL。但需注意 sqlite 本身有限制，少數情況生成的 SQL 可能不堪用。

1. 設定 DB_PATH 環境變數

cli 不是透過 electron 啟動，無法取得 electron user path，所以使用環境變數做設定。在根目錄建立 `.env` 檔案，設定 DB_PATH。

```
# mac
DB_PATH="/Users/<user>/Library/Application Support/electron-openpgp-gui/pgp_data"

# windows
DB_PATH="C:/Users/<user>/AppData/Roaming/electron-openpgp-gui/pgp_data"
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

4. 將 `src/electron/child/apiAgent/sqlite/migrations` 生成的 file 引入到 mikro-orm config

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

## Tech Keywords

- typescript6
- pnpm11
- electron45
- openpgp, zip archive
- sqlite, mikro-orm
- vue3, shadcn-vue, tailwind, VueUse, pinia
- vite8, tsdown, electron-builder
- oxlint, oxfmt, oxc-node
