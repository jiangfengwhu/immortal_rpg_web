import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Plugin } from 'vite'

const webRoot = path.dirname(fileURLToPath(import.meta.url))
const mapsSourceDir = path.resolve(webRoot, 'public/game-ui/maps')
const spinesMapsDir = path.resolve(webRoot, '../spines/game-ui/maps')

function copyMaps(fromDir: string, toDir: string) {
  if (!fs.existsSync(fromDir)) return 0
  fs.mkdirSync(toDir, { recursive: true })
  let count = 0
  for (const name of fs.readdirSync(fromDir)) {
    if (name.startsWith('.')) continue
    const source = path.join(fromDir, name)
    if (!fs.statSync(source).isFile()) continue
    fs.copyFileSync(source, path.join(toDir, name))
    count += 1
  }
  return count
}

/** 将 web/public/game-ui/maps 同步到 spines（publicDir）与 dist */
export function mapAssetsPlugin(): Plugin {
  return {
    name: 'map-assets',
    buildStart() {
      copyMaps(mapsSourceDir, spinesMapsDir)
    },
    configureServer() {
      copyMaps(mapsSourceDir, spinesMapsDir)
    },
    closeBundle() {
      copyMaps(mapsSourceDir, path.resolve(webRoot, 'dist/game-ui/maps'))
      copyMaps(mapsSourceDir, spinesMapsDir)
    },
  }
}
