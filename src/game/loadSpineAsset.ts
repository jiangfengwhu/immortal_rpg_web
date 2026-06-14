import { Assets, Texture } from 'pixi.js'
import { TextureAtlas } from '@pixi-spine/base'

import { readSkelSkeletonData } from './readSkelSkeletonData'
import {
  dedupeSpineAssetLoad,
  getCachedSpineAsset,
  storeSpineAsset,
} from './spineAssetCache'

const SPINE_ASSET_SUFFIX = '::spine'

export function getSpineAssetKey(skeletonUrl: string) {
  return `${skeletonUrl}${SPINE_ASSET_SUFFIX}`
}

function getSpineBasePath(skeletonUrl: string) {
  return skeletonUrl.slice(0, skeletonUrl.lastIndexOf('/') + 1)
}

function getSpineFileName(skeletonUrl: string) {
  return skeletonUrl.split('/').pop()?.replace(/\.(skel|json)$/, '') ?? 'spine'
}

async function loadTextureAtlas(atlasText: string, basePath: string) {
  return new Promise<TextureAtlas>((resolve, reject) => {
    new TextureAtlas(
      atlasText,
      (line, callback) => {
        const texturePath = `${basePath}${line.trim()}`
        void Assets.load<Texture>(texturePath)
          .then((texture) => callback(texture.baseTexture))
          .catch(reject)
      },
      (atlas) => {
        if (!atlas) {
          reject(new Error('Spine atlas 加载失败'))
          return
        }

        resolve(atlas)
      },
    )
  })
}

async function loadSpineAssetInternal(skeletonUrl: string) {
  const assetKey = getSpineAssetKey(skeletonUrl)
  const cached = getCachedSpineAsset(assetKey)
  if (cached) {
    return cached
  }

  const basePath = getSpineBasePath(skeletonUrl)
  const fileName = getSpineFileName(skeletonUrl)
  const atlasPath = `${basePath}${fileName}.atlas`
  const atlasResponse = await fetch(atlasPath)

  if (!atlasResponse.ok) {
    await Assets.load(skeletonUrl)
    return Assets.get(skeletonUrl)
  }

  const atlasText = await atlasResponse.text()
  const textureAtlas = await loadTextureAtlas(atlasText, basePath)

  if (skeletonUrl.endsWith('.skel')) {
    const skeletonResponse = await fetch(skeletonUrl)
    if (!skeletonResponse.ok) {
      throw new Error(`Spine skeleton 加载失败: ${skeletonUrl}`)
    }

    const skeletonBinary = new Uint8Array(await skeletonResponse.arrayBuffer())
    const spineData = readSkelSkeletonData(textureAtlas, skeletonBinary)

    return storeSpineAsset(assetKey, {
      spineData,
      spineAtlas: textureAtlas,
    })
  }

  await Assets.load({
    alias: assetKey,
    src: skeletonUrl,
    data: { spineAtlas: textureAtlas },
  })

  return Assets.get(assetKey)
}

export async function loadSpineAsset(skeletonUrl: string) {
  const assetKey = getSpineAssetKey(skeletonUrl)
  return dedupeSpineAssetLoad(assetKey, () => loadSpineAssetInternal(skeletonUrl))
}
