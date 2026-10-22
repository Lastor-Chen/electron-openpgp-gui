# Electron OpenPGP GUI

An electron + vite boilerplate for myself.

這是個人研究 electron + vite 前端基礎建設的 boilerplate，並以 OpenPGP.js 非對稱加解密為主題，實際做一個有功能的 App 來試驗此架構。

## App Features

- CRUD PGP keys
- Import / Export PGP keys
- 使用 PGP key 對檔案做基本加、解密
  - 不支援 sign file

## Download and Preview the App

可前往 [Release](https://github.com/Lastor-Chen/electron-openpgp-gui/releases/latest) 頁面下載打包好的 Desktop App。

### OS 網路下載安全機制

我沒有做應用程式簽章 (要花錢)，所以從網路上下載時，OS 的安全機制會將其標記為未信任的來源，導致無法正常啟動。請參考下列方式去強制啟動 App。或是直接 clone 此專案以 dev 執行。

#### Windows

為免安裝的 portable exe。瀏覽器下載 exe 完成後，可能會鎖定並詢問是否信任，選擇「保留」->「仍要保留」。

執行 .exe 時，windows 可能會出現警告，選擇「其他資訊」然後「仍要執行」。

#### MacOS

執行 .app 時可能報出「已損毀」錯誤。輸入以下終端機指令來移除未信任標籤，然後再重新開啟 App。

```
$ xattr -dr com.apple.quarantine /path/to/app
```

可參考 electron-builder 官方文件 [macOS-Specific](https://www.electron.build/docs/troubleshooting/#macos-specific) 關於「**App is damaged and can't be opened**」的說明。

## Getting Started

Node.js 與 pnpm 的版本限制請參考 `packageJson.engines` 與 `packageJson.devEngines`。本專案另有設定 `.node-version`，如果您使用 `fnm` 之類支援此功能的 Node.js 版本管理器，在終端機切換進本專案資料夾時，將會自動切換至需求的版本。

Electron 各版本皆有明確對應的 Node.js 版本，開發環境只要 Node.js 大版號一致多半都能跑，但還是建議使用相同的版本。

1. git clone the repo
2. install dependencies

```
pnpm install
```

3. (可選) 建立 `.env` 設定給 mikroORM cli 使用的環境變數

```
// mac
DB_PATH="/Users/<user>/Library/Application Support/electron-openpgp-gui/pgp_data"

// windows
DB_PATH="..."
```

4. Start development

```
pnpm dev
```

### 乾淨移除

Electron App 無論是 development 還是打包後的 production，執行後都會在 User 目錄中留下 Chromium 所需的本地記錄資料，同時，本專案的 SQLite 資料庫也放在相同位置。您可以直接手動移除他。

macOS

```
path/to/
```

Windows

```
path/to/
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

### vite-plugin-tsdown

自製的 vite plugin，用 tsdown 編譯 electron 的 typescript，並一同納入前端 vite dev 的生命週期，支援熱更新。

`vite-plugin-electron` 使用 vite lib mode 去編譯 electron，除非是 vite8 使用 rolldown，否則編譯速度稍慢，且設定較受限。

`vite-electron-plugin` 同作者的另一個插件，改用其他高速 bundler 去編譯 electron，但已經不再積極維護，要在 ESM 環境使用需要 hack。

此 plugin 僅是將 tsdown 串接進 vite 生命週期，方便將 node.js 端的程式與前端共構，原理上並不限定 Electron。
沒有任何內建的 built-in 設定，可以完整、精確的操作 tsdown。
且 tsdown 原本就是比較針對 node.js app 的打包工具，相較於 vite lib mode 會更適合編譯 electron。

```ts
import type { InlineConfig } from 'tsdown'
import { defineConfig } from 'vite'
import { tsdownPlugin, spawnElectron } from './vite-plugin-tsdown/src/index.ts'

export default defineConfig(({ command }) => {
  const isDev = command === 'serve'

  return {
    plugins: [
      tsdownPlugin({
        viteWatch: ['src/electron/**', 'src/shared/**'],
        onAllSuccess: isDev ? () => spawnElectron() : undefined,
        builds: [
          // same with tsdown config
        ],
      }),
    ],
  }
})
```

### 子程序通訊機制

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
