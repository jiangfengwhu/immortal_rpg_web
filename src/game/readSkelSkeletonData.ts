import type { TextureAtlas } from '@pixi-spine/base'
import { AtlasAttachmentLoader, SkeletonBinary } from '@pixi-spine/runtime-3.8'

import {
  isSpine36BinaryVersion,
  readSpine36SkeletonData,
  readSpineBinaryVersion,
} from './spine36/skeletonBinary36'

export const SPINE_RUNTIME_VERSION = '3.8.99'

export function readSkelSkeletonData(textureAtlas: TextureAtlas, skeletonBinary: Uint8Array) {
  const attachmentLoader = new AtlasAttachmentLoader(textureAtlas)
  const version = readSpineBinaryVersion(skeletonBinary)

  const spineData = isSpine36BinaryVersion(version)
    ? readSpine36SkeletonData(attachmentLoader, skeletonBinary)
    : new SkeletonBinary(attachmentLoader).readSkeletonData(skeletonBinary)

  spineData.version = SPINE_RUNTIME_VERSION
  return spineData
}
