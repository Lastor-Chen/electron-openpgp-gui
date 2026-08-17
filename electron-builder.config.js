/**
 * @type {import('electron-builder').Configuration}
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
  mac: {
    icon: 'electron-vite.svg',
    target: [
      {
        target: 'dmg',
        arch: 'universal',
      },
    ],
    artifactName: '${productName}-mac-${version}.${ext}',
  },
  win: {
    icon: 'electron-vite.svg',
    target: [
      {
        target: 'portable',
        arch: ['x64'],
      },
    ],
    artifactName: '${productName}-windows-${version}.${ext}',
  },
}
