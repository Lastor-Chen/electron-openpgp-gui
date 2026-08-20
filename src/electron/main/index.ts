import path from 'node:path'

import { forkChild } from '@utility-bridger/electron/main'
import { app, Menu } from 'electron'

import { openMainWindow } from '@/main/browsers'

process.env.APP_ROOT = path.join(import.meta.dirname, '../../../')

if (!app.requestSingleInstanceLock()) {
  app.exit()
}

// mac 通常關視窗不等於關 app
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// mac Dock onClick app
app.on('activate', () => {
  openMainWindow()
})

app.whenReady().then(() => {
  // remove default menu on mac
  Menu.setApplicationMenu(Menu.buildFromTemplate([]))

  forkChild(
    'apiAgent',
    path.join(process.env.APP_ROOT, 'dist-electron/electron/child/apiAgent/index.js'),
  )

  openMainWindow()
})
