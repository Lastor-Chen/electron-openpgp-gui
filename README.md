# Electron OpenPGP GUI

An electron + vite architecture POC for myself.

這是個人研究 electron + vite 前端基礎建設的 template，並以 OpenPGP.js 非對稱加解密為主題，實際做一個有功能的 App 來試驗此架構。

## Download and try the App

可前往 [Release](https://github.com/Lastor-Chen/electron-openpgp-gui/releases/latest) 頁面下載打包好的 Desktop App。

## App Features

- CRUD PGP keys
- Import / Export PGP keys
- 使用 PGP key 對檔案做基本加、解密
  - 不支援 sign file

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

## Keywords

- electron
- openpgp, zip
- vite8, tsdown, electron-builder
- typescript6
- vue3, shadcn-vue, tailwind, VueUse, pinia
- sqlite, mikroORM
- oxlint, oxfmt, oxc-node
- pnpm

## Architecture

- vite-plugin-tsdown
- 子程序通訊機制
- sqlite db runtime migration
- Promise 的 global modal?

## Technical Highlights??
