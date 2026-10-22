# Electron OpenPGP GUI

An electron + vite boilerplate for myself.

這是個人研究 electron + vite 前端基礎建設的 boilerplate，並以 OpenPGP.js 非對稱加解密為主題，實際做一個有功能的 App 來試驗此架構。

## App Features

- CRUD PGP keys
- Import / Export PGP keys
- 使用 PGP key 對檔案做基本加、解密
  - 不支援 sign file

## Download Unsigned App

在 [Release](https://github.com/Lastor-Chen/electron-openpgp-gui/releases/latest) 頁面下載對應平台的 Desktop App。

| System      | File                                      |
| ----------- | ----------------------------------------- |
| Windows x64 | OpenPGP-GUI-{version}-windows-x64.exe.zip |
| MacOS arm64 | OpenPGP-GUI-{version}-mac-arm64.dmg       |
| MacOS x64   | OpenPGP-GUI-{version}-mac-x64.dmg         |

此 App 程式非正式產品，沒有做 code signing，從網路下載時會被 OS 標記為未信任來源並限制啟動。<br>
請參考下列方式去強制啟動 App，或是直接 git clone 此專案以 dev 執行。

### Windows

解壓縮後，是一個免安裝的 portable exe，直接 Double-click 啟動。

瀏覽器直接下載 unsigned 的 exe 會被鎖定，需手動選擇「保留」->「仍要保留」後才會實際寫入到下載位置。因此打包成 .zip 繞過瀏覽器的機制，解壓縮並執行未簽名 exe 時 Windows 會跳出警告，選擇「其他資訊」然後「仍要執行」。

### MacOS

Double-click dmg 開啟，滑鼠拖曳 App 圖標至 Applications 資料夾後，右鍵 -> 退出 dmg，於啟動台開啟 App。

開啟 unsigned app 時會報出「已損毀」錯誤。請輸入以下終端機指令來移除未信任標籤，再重新開啟 App。

```shell
xattr -dr com.apple.quarantine /path/to/app
```

可參考 electron-builder 官方文件 [macOS-Specific](https://www.electron.build/docs/troubleshooting/#macos-specific) 關於「**App is damaged and can't be opened**」的說明。

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

### Set env variables for mikro-orm cli (Optional)

建立 `.env` 檔案，設定 sqlite path 提供給 mikro-orm cli 使用。如果不使用 mikro-orm cli 可跳過。

```
# mac
DB_PATH="/Users/<user>/Library/Application Support/electron-openpgp-gui/pgp_data"

# windows
DB_PATH="C:/Users/<user>/AppDate/Roaming/electron-openpgp-gui/pgp_data"
```

## 完整移除 App

Electron App 會根據 OS 在特定的 user path 中儲存 Chromium 的本地資料，本 App 的 sqlite 也放在相同目錄，在意的話的需手動移除下列的 `electron-openpgp-gui` 資料夾。

```
# mac
/Users/<user>/Library/Application Support/electron-openpgp-gui/

# windows
C:/Users/<user>/AppDate/Roaming/electron-openpgp-gui/
```

## Project Structure

```
root/
  public/
  src/
    electron/
      child/
      main/
      preload/
    renderer/
    shared/
  vite-plugin-tsdown/
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

### UtilityProcess 子程序通訊

- 與主程序隔離，用於執行 Native API 或較重的運算，不阻塞 electron 主程序

定義子程序 API types

```ts
// src/shared/types/<child_name>.ts
export type ChildNameApis = {
  foo(txt: string): string
}

export type ChildNameEvents = {
  aaa(val: string): void
}
```

於 `src/electron/child/` 建立子程序 entry file

```ts
// src/electron/child/<name>/index.ts
import {
  handleUncaught,
  bridgeRpcHandler,
  addConsoleLogPrefix,
} from '@utility-bridger/electron/child'

// 將 uncaught error 傳給 renderer
handleUncaught()

// 設定 console.log 前綴, 方便識別
addConsoleLogPrefix('[ChildName]')

// 定義 API functions
bridgeRpcHandler({
  foo(txt: string) {
    return `Hello ${txt}`
  },
  // ...
})
```

於 electron main 建立子程序

```ts
// src/electron/main/index.ts
import { app } from 'electron'
import { forkChild } from '@utility-bridger/electron/main'

app.whenReady().then(() => {
  const child = forkChild('childName', 'path/to/child/entry.js')

  // invoke child's function
  const { result, error } = await child.invoke('foo', 'Child')
  console.log(result) // "Hello Child"

  //
})
```

### sqlite db runtime migration

### Promise 的 global modal?

## Keywords

- electron
- openpgp, zip
- vite8, tsdown, electron-builder
- typescript6
- vue3, shadcn-vue, tailwind, VueUse, pinia
- sqlite, mikroORM
- oxlint, oxfmt, oxc-node
- pnpm
