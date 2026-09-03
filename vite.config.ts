import path from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import type { InlineConfig } from 'tsdown'
import { defineConfig } from 'vite'

import pkg from './package.json' with { type: 'json' }
import { tsdownPlugin, spawnElectron } from './vite-plugin-tsdown/src/index.ts'

// VITE_ 開頭的會加到 import.meta.env
process.env.VITE_APP_VERSION = pkg.version

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const isDev = command === 'serve'

  const baseTsdownConfig: InlineConfig = {
    target: 'node24',
    tsconfig: 'tsconfig.electron.json',
    env: {
      NODE_ENV: process.env.NODE_ENV,
    },
    logLevel: isDev ? 'warn' : 'info',
  }

  return {
    clearScreen: false,
    plugins: [
      vue(),
      tailwindcss(),
      tsdownPlugin({
        viteWatch: ['src/electron/**', 'src/shared/**'],
        onAllSuccess: isDev ? () => spawnElectron() : undefined,
        builds: [
          {
            ...baseTsdownConfig,
            entry: [
              'src/electron/child/*/index.ts',
              'src/electron/child/apiAgent/sqlite/migrations/*.ts',
              'src/electron/main/index.ts',
            ],
            outDir: 'dist-electron',
            format: 'esm',
            deps: {
              neverBundle: ['electron', 'vue'],
            },
            fixedExtension: false,
            unbundle: true,
            root: 'src',
          },
          {
            ...baseTsdownConfig,
            entry: 'src/electron/preload/index.ts',
            outDir: 'dist-electron/electron/preload',
            format: 'cjs',
            deps: {
              neverBundle: ['electron'],
            },
          },
        ],
      }),
    ],
    resolve: {
      alias: {
        '@': path.join(import.meta.dirname, './src/renderer'),
        '@shared': path.join(import.meta.dirname, './src/shared'),
        '@utility-bridger': path.join(import.meta.dirname, './src/shared/utility-bridger'),
      },
    },
  }
})
