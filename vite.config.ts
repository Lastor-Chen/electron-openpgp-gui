import fs from 'node:fs'
import path from 'node:path'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import pkg from './package.json' with { type: 'json' }
import { tsdownPlugin, spawnElectron } from './vite-plugin-tsdown/src/index.ts'

// VITE_ 開頭的會加到 import.meta.env
process.env.VITE_APP_VERSION = pkg.version

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const isDev = command === 'serve'

  return {
    clearScreen: false,
    plugins: [
      vue(),
      tsdownPlugin({
        viteWatch: ['src/electron/**', 'src/shared/**'],
        onAllSuccess: isDev ? () => spawnElectron() : undefined,
        builds: [
          {
            entry: [
              'src/shared/**/*.ts',
              // 'src/electron/child/*/index.ts',
              'src/electron/preload/index.ts',
              'src/electron/main/index.ts',
            ],
            outDir: 'dist-electron',
            target: 'node24',
            fixedExtension: false,
            unbundle: true,
            tsconfig: 'tsconfig.electron.json',
            deps: {
              neverBundle: ['electron'],
            },
            env: {
              NODE_ENV: process.env.NODE_ENV,
            },
            logLevel: isDev ? 'warn' : 'info',
            // TODO 注意 child-utility/vue 引用 dev 依賴, 不 bundle
            // skipNodeModulesBundle: true,
            format: {
              esm: {
                hooks: {
                  'build:done'(ctx) {
                    // remove esm's preload
                    fs.rmSync(path.resolve(ctx.options.outDir, './electron/preload/index.js'), {
                      force: true,
                    })
                  },
                },
              },
              cjs: {
                entry: {
                  index: 'src/electron/preload/index.ts',
                },
                outDir: 'dist-electron/electron/preload',
                unbundle: false,
                // noExternal: (id) => id.includes('@packages/child-utility'),
              },
            },
          },
        ],
      }),
    ],
    resolve: {
      alias: {
        '@': path.join(import.meta.dirname, './src/renderer'),
      },
    },
  }
})
