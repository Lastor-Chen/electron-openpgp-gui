import fs from 'node:fs'
import path from 'node:path'
import webStream from 'node:stream/web'

/**
 * If file is existed, add serial number to the file name.
 */
export function renameIfExisted(filePath: string) {
  const { base: basename, dir } = path.parse(filePath)

  const splitted = basename.split('.')
  const filename = splitted[0]
  const extChain = '.' + splitted.slice(1).join('.')

  let newFileName = basename
  let count = 1
  while (fs.existsSync(path.join(dir, newFileName))) {
    newFileName = `${filename}(${count})${extChain}`
    count++
  }

  return path.join(dir, newFileName)
}

export function createProgressStream(
  totalBytes: number,
  options?: {
    onTransform?(percent: number, chunk: Uint8Array): void
    onFlush?(): void
  },
) {
  let countBytes = 0
  let prevPercent: number

  return new webStream.TransformStream<Uint8Array>({
    transform(chunk, controller) {
      countBytes += chunk.byteLength
      const percent = Math.floor((countBytes / totalBytes) * 100)
      if (percent !== prevPercent) {
        options?.onTransform?.(percent, chunk)
        prevPercent = percent
      }

      controller.enqueue(chunk)
    },
    flush() {
      options?.onFlush?.()
    },
  })
}
