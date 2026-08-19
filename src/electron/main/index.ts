import path from 'node:path'

import { forkChild } from '@utility-bridger/electron/main'
import { app, BrowserWindow } from 'electron'

function createWindow() {
  const win = new BrowserWindow({
    webPreferences: {
      preload: path.join(import.meta.dirname, '../preload/index.cjs'),
    },
  })

  if (import.meta.env.DEV) {
    win.loadURL('http://localhost:5173/')
  } else {
    win.loadFile(path.join(import.meta.dirname, '../../../dist/index.html'))
  }
}

app.whenReady().then(() => {
  forkChild('apiAgent', path.join(import.meta.dirname, '../child/apiAgent/index.js'))

  createWindow()
})
