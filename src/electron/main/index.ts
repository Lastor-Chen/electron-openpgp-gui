import path from 'node:path'

import type { ApiAgentApis, ApiAgentEvents } from '@shared/types/apiAgent'
import { forkChild } from '@utility-bridger/electron/main'
import { app, Menu } from 'electron'

import { openMainWindow } from '@/main/browsers'
import { setupIpcMain } from '@/main/ipc'

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

app.whenReady().then(async () => {
  // reset mac app menu to remove viewMenu
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      { role: 'appMenu' },
      { role: 'fileMenu' },
      { role: 'editMenu' },
      { role: 'windowMenu' },
    ]),
  )

  const child = forkChild<ApiAgentApis, ApiAgentEvents>(
    'apiAgent',
    path.join(process.env.APP_ROOT, 'dist-electron/electron/child/apiAgent/index.js'),
    [`--db-dir=${app.getPath('userData')}`],
  )

  child.on('aaa', (val) => {
    console.log('接收', val)
  })

  setupIpcMain()

  openMainWindow()
})
