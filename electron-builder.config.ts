import type { Configuration } from 'electron-builder'

/**
 * @see https://www.electron.build/configuration/configuration
 */
export default {
  productName: 'OpenPGP GUI',
  appId: 'com.demo.electron-openpgp-gui',
  asar: true,
  asarUnpack: [],
  directories: {
    buildResources: 'public',
    output: 'release/${version}',
  },
  files: ['dist-electron', 'dist'],
  compression: 'maximum',
  // mac icon 於 v26.15.2 ~ v26.15.4 有 bug
  // https://github.com/electron-userland/electron-builder/issues/9940
  icon: 'icon.svg',
  mac: {
    target: [
      {
        target: 'dmg',
        arch: ['arm64', 'x64'],
      },
    ],
    artifactName: '${productName}-v${version}-mac-${arch}.${ext}',
  },
  win: {
    target: [
      {
        target: 'portable',
        arch: ['x64'],
      },
    ],
    artifactName: '${productName}-v${version}-windows-${arch}.${ext}',
  },
  // v27-alpha 新功能, 等 rc
  // ignoredProductionDependencies: [
  //   'electron',
  //   'electron-builder',
  //   '@lucide/vue',
  //   '@vueuse/core',
  //   'class-variance-authority',
  //   'clsx',
  //   'pinia',
  //   'reka-ui',
  //   'tailwind-merge',
  //   'vue',
  //   'vue-router',
  // ],
} satisfies Configuration
