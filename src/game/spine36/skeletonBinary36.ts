import {
  Animation,
  AtlasAttachmentLoader,
  BoneData,
  EventData,
  IkConstraintData,
  PathConstraintData,
  SkeletonBinary,
  SkeletonData,
  Skin,
  SlotData,
  SpacingMode,
  TransformConstraintData,
} from '@pixi-spine/runtime-3.8'
import { BinaryInput, Color, PositionMode } from '@pixi-spine/base'

import { readAnimation36 } from './readAnimation36.ts'

type LinkedMeshEntry = {
  skin: string | null
  slotIndex: number
  parent: string
  mesh: {
    setParentMesh: (parent: unknown) => void
    updateUVs?: () => void
  }
}

type ParserInternals = {
  scale: number
  linkedMeshes: LinkedMeshEntry[]
  readAttachment: (
    input: BinaryInput,
    skeletonData: SkeletonData,
    skin: Skin,
    slotIndex: number,
    attachmentName: string,
    nonessential: boolean,
  ) => unknown
  readAnimation: (input: BinaryInput, name: string, skeletonData: SkeletonData) => Animation
}

function readStringField(input: BinaryInput) {
  return input.readString() ?? ''
}

function readSkinLegacy(
  parser: ParserInternals,
  input: BinaryInput,
  skeletonData: SkeletonData,
  skinName: string,
  nonessential: boolean,
) {
  const slotCount = input.readInt(true)
  if (slotCount === 0) {
    return null
  }

  const skin = new Skin(skinName)

  for (let slotIndex = 0; slotIndex < slotCount; slotIndex += 1) {
    const slotAttachmentIndex = input.readInt(true)
    const attachmentCount = input.readInt(true)

    for (let attachmentIndex = 0; attachmentIndex < attachmentCount; attachmentIndex += 1) {
      const name = readStringField(input)
      const attachment = parser.readAttachment(
        input,
        skeletonData,
        skin,
        slotAttachmentIndex,
        name,
        nonessential,
      )

      if (attachment != null) {
        skin.setAttachment(slotAttachmentIndex, name, attachment as never)
      }
    }
  }

  return skin
}

function readStringRefValue(input: BinaryInput) {
  const value = input.readString()
  if (!value || value.length === 0) {
    return null
  }

  return value
}

function patchBinaryInputForSpine36(input: BinaryInput) {
  input.readStringRef = () => readStringRefValue(input)
}

export function readSpine36SkeletonData(
  attachmentLoader: AtlasAttachmentLoader,
  binary: Uint8Array,
  scale = 1,
) {
  const parser = new SkeletonBinary(attachmentLoader) as unknown as ParserInternals
  parser.scale = scale

  const skeletonData = new SkeletonData()
  skeletonData.name = ''
  const input = new BinaryInput(binary)
  patchBinaryInputForSpine36(input)

  skeletonData.hash = readStringField(input)
  skeletonData.version = readStringField(input)
  skeletonData.width = input.readFloat()
  skeletonData.height = input.readFloat()

  const nonessential = input.readBoolean()
  if (nonessential) {
    skeletonData.fps = input.readFloat()
    skeletonData.imagesPath = readStringField(input)
  }

  const boneCount = input.readInt(true)
  for (let boneIndex = 0; boneIndex < boneCount; boneIndex += 1) {
    const name = readStringField(input)
    const parentIndex = boneIndex === 0 ? -1 : input.readInt(true)
    const parent = boneIndex === 0 ? null : skeletonData.bones[parentIndex]
    if (boneIndex > 0 && !parent) {
      throw new Error(`Invalid bone parent index: ${parentIndex}`)
    }
    const data = new BoneData(boneIndex, name, parent as BoneData)
    data.rotation = input.readFloat()
    data.x = input.readFloat() * scale
    data.y = input.readFloat() * scale
    data.scaleX = input.readFloat()
    data.scaleY = input.readFloat()
    data.shearX = input.readFloat()
    data.shearY = input.readFloat()
    data.length = input.readFloat() * scale
    data.transformMode = SkeletonBinary.TransformModeValues[input.readInt(true)]
    if (nonessential) {
      Color.rgba8888ToColor(data.color, input.readInt32())
    }
    skeletonData.bones.push(data)
  }

  const slotCount = input.readInt(true)
  for (let slotIndex = 0; slotIndex < slotCount; slotIndex += 1) {
    const slotName = readStringField(input)
    const boneData = skeletonData.bones[input.readInt(true)]
    const data = new SlotData(slotIndex, slotName, boneData)
    Color.rgba8888ToColor(data.color, input.readInt32())
    const darkColor = input.readInt32()
    if (darkColor !== -1) {
      Color.rgb888ToColor((data.darkColor = new Color()), darkColor)
    }
    data.attachmentName = readStringField(input)
    data.blendMode = SkeletonBinary.BlendModeValues[input.readInt(true)]
    skeletonData.slots.push(data)
  }

  let constraintCount = input.readInt(true)
  for (let index = 0; index < constraintCount; index += 1) {
    const data = new IkConstraintData(readStringField(input))
    data.order = input.readInt(true)
    const boneLength = input.readInt(true)
    for (let boneIndex = 0; boneIndex < boneLength; boneIndex += 1) {
      data.bones.push(skeletonData.bones[input.readInt(true)])
    }
    data.target = skeletonData.bones[input.readInt(true)]
    data.mix = input.readFloat()
    data.bendDirection = input.readByte()
    skeletonData.ikConstraints.push(data)
  }

  constraintCount = input.readInt(true)
  for (let index = 0; index < constraintCount; index += 1) {
    const data = new TransformConstraintData(readStringField(input))
    data.order = input.readInt(true)
    const boneLength = input.readInt(true)
    for (let boneIndex = 0; boneIndex < boneLength; boneIndex += 1) {
      data.bones.push(skeletonData.bones[input.readInt(true)])
    }
    data.target = skeletonData.bones[input.readInt(true)]
    data.local = input.readBoolean()
    data.relative = input.readBoolean()
    data.offsetRotation = input.readFloat()
    data.offsetX = input.readFloat() * scale
    data.offsetY = input.readFloat() * scale
    data.offsetScaleX = input.readFloat()
    data.offsetScaleY = input.readFloat()
    data.offsetShearY = input.readFloat()
    data.rotateMix = input.readFloat()
    data.translateMix = input.readFloat()
    data.scaleMix = input.readFloat()
    data.shearMix = input.readFloat()
    skeletonData.transformConstraints.push(data)
  }

  constraintCount = input.readInt(true)
  for (let index = 0; index < constraintCount; index += 1) {
    const data = new PathConstraintData(readStringField(input))
    data.order = input.readInt(true)
    const boneLength = input.readInt(true)
    for (let boneIndex = 0; boneIndex < boneLength; boneIndex += 1) {
      data.bones.push(skeletonData.bones[input.readInt(true)])
    }
    data.target = skeletonData.slots[input.readInt(true)]
    data.positionMode = SkeletonBinary.PositionModeValues[input.readInt(true)]
    data.spacingMode = SkeletonBinary.SpacingModeValues[input.readInt(true)]
    data.rotateMode = SkeletonBinary.RotateModeValues[input.readInt(true)]
    data.offsetRotation = input.readFloat()
    data.position = input.readFloat()
    if (data.positionMode === PositionMode.Fixed) {
      data.position *= scale
    }
    data.spacing = input.readFloat()
    if (data.spacingMode === SpacingMode.Length || data.spacingMode === SpacingMode.Fixed) {
      data.spacing *= scale
    }
    data.rotateMix = input.readFloat()
    data.translateMix = input.readFloat()
    skeletonData.pathConstraints.push(data)
  }

  const defaultSkin = readSkinLegacy(parser, input, skeletonData, 'default', nonessential)
  if (defaultSkin != null) {
    skeletonData.defaultSkin = defaultSkin
    skeletonData.skins.push(defaultSkin)
  }

  const extraSkinCount = input.readInt(true)
  for (let index = 0; index < extraSkinCount; index += 1) {
    const skin = readSkinLegacy(parser, input, skeletonData, readStringField(input), nonessential)
    if (skin != null) {
      skeletonData.skins.push(skin)
    }
  }

  for (let index = 0; index < parser.linkedMeshes.length; index += 1) {
    const linkedMesh = parser.linkedMeshes[index]
    const skin =
      linkedMesh.skin == null ? skeletonData.defaultSkin : skeletonData.findSkin(linkedMesh.skin)
    if (skin == null) {
      throw new Error(`Skin not found: ${linkedMesh.skin}`)
    }

    const parent = skin.getAttachment(linkedMesh.slotIndex, linkedMesh.parent)
    if (parent == null) {
      throw new Error(`Parent mesh not found: ${linkedMesh.parent}`)
    }

    linkedMesh.mesh.setParentMesh(parent)
    linkedMesh.mesh.updateUVs?.()
  }
  parser.linkedMeshes.length = 0

  const eventCount = input.readInt(true)
  for (let index = 0; index < eventCount; index += 1) {
    const data = new EventData(readStringField(input))
    data.intValue = input.readInt(false)
    data.floatValue = input.readFloat()
    data.stringValue = readStringField(input)
    skeletonData.events.push(data)
  }

  const animationCount = input.readInt(true)
  parser.readAnimation = (input, name, skeletonData) =>
    readAnimation36(parser, input, name, skeletonData)

  for (let index = 0; index < animationCount; index += 1) {
    skeletonData.animations.push(parser.readAnimation(input, readStringField(input), skeletonData))
  }

  return skeletonData
}

export function isSpine36BinaryVersion(version: string | null | undefined) {
  return version?.startsWith('3.6.') ?? false
}

export function readSpineBinaryVersion(binary: Uint8Array) {
  const input = new BinaryInput(binary)
  input.readString()
  return input.readString()
}
