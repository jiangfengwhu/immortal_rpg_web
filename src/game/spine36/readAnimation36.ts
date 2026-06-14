import {
  Animation,
  AttachmentTimeline,
  ColorTimeline,
  CurveTimeline,
  DeformTimeline,
  DrawOrderTimeline,
  EventTimeline,
  IkConstraintTimeline,
  PathConstraintMixTimeline,
  PathConstraintPositionTimeline,
  PathConstraintSpacingTimeline,
  RotateTimeline,
  ScaleTimeline,
  ShearTimeline,
  SkeletonBinary,
  TransformConstraintTimeline,
  TranslateTimeline,
  TwoColorTimeline,
  Event,
  SpacingMode,
} from '@pixi-spine/runtime-3.8'
import type { SkeletonData, Timeline } from '@pixi-spine/runtime-3.8'
import { BinaryInput, Color, PositionMode, Utils } from '@pixi-spine/base'

const SB = SkeletonBinary as unknown as {
  SLOT_ATTACHMENT: number
  SLOT_COLOR: number
  SLOT_TWO_COLOR: number
  BONE_ROTATE: number
  BONE_TRANSLATE: number
  BONE_SCALE: number
  BONE_SHEAR: number
  PATH_POSITION: number
  PATH_SPACING: number
  PATH_MIX: number
  CURVE_STEPPED: number
  CURVE_BEZIER: number
}

type AnimationParser = {
  scale: number
  readCurve: (input: BinaryInput, frameIndex: number, timeline: CurveTimeline) => void
}

function skipCurve(input: BinaryInput) {
  switch (input.readByte()) {
    case SB.CURVE_STEPPED:
      return
    case SB.CURVE_BEZIER:
      input.readFloat()
      input.readFloat()
      input.readFloat()
      input.readFloat()
      return
    default:
      return
  }
}

function skipPathTimeline(input: BinaryInput, timelineType: number, frameCount: number) {
  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    if (timelineType === SB.PATH_MIX) {
      input.readFloat()
      input.readFloat()
      input.readFloat()
    } else {
      input.readFloat()
      input.readFloat()
    }

    if (frameIndex < frameCount - 1) {
      skipCurve(input)
    }
  }
}

function skipDeformTimeline(input: BinaryInput, frameCount: number, scale: number) {
  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    input.readFloat()
    const end = input.readInt(true)
    if (end !== 0) {
      const start = input.readInt(true)
      const endIndex = end + start
      if (scale === 1) {
        for (let v = start; v < endIndex; v += 1) {
          input.readFloat()
        }
      } else {
        for (let v = start; v < endIndex; v += 1) {
          input.readFloat()
        }
      }
    }

    if (frameIndex < frameCount - 1) {
      skipCurve(input)
    }
  }
}

function readAttachmentName(input: BinaryInput) {
  return input.readString() ?? ''
}

function readCurve(input: BinaryInput, frameIndex: number, timeline: CurveTimeline) {
  switch (input.readByte()) {
    case SB.CURVE_STEPPED:
      timeline.setStepped(frameIndex)
      break
    case SB.CURVE_BEZIER:
      timeline.setCurve(
        frameIndex,
        input.readFloat(),
        input.readFloat(),
        input.readFloat(),
        input.readFloat(),
      )
      break
  }
}

export function readAnimation36(
  parser: AnimationParser,
  input: BinaryInput,
  name: string,
  skeletonData: SkeletonData,
) {
  const timelines: Timeline[] = []
  const scale = parser.scale
  let duration = 0
  const tempColor1 = new Color()
  const tempColor2 = new Color()

  for (let i = 0, n = input.readInt(true); i < n; i += 1) {
    const slotIndex = input.readInt(true)
    for (let ii = 0, nn = input.readInt(true); ii < nn; ii += 1) {
      const timelineType = input.readByte()
      const frameCount = input.readInt(true)
      if (frameCount <= 0) {
        continue
      }

      switch (timelineType) {
        case SB.SLOT_ATTACHMENT: {
          const timeline = new AttachmentTimeline(frameCount)
          timeline.slotIndex = slotIndex
          for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
            timeline.setFrame(frameIndex, input.readFloat(), readAttachmentName(input))
          }
          timelines.push(timeline)
          duration = Math.max(duration, timeline.frames[frameCount - 1])
          break
        }
        case SB.SLOT_COLOR: {
          const timeline = new ColorTimeline(frameCount)
          timeline.slotIndex = slotIndex
          for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
            const time = input.readFloat()
            Color.rgba8888ToColor(tempColor1, input.readInt32())
            timeline.setFrame(frameIndex, time, tempColor1.r, tempColor1.g, tempColor1.b, tempColor1.a)
            if (frameIndex < frameCount - 1) {
              readCurve(input, frameIndex, timeline)
            }
          }
          timelines.push(timeline)
          duration = Math.max(duration, timeline.frames[(frameCount - 1) * ColorTimeline.ENTRIES])
          break
        }
        case SB.SLOT_TWO_COLOR: {
          const timeline = new TwoColorTimeline(frameCount)
          timeline.slotIndex = slotIndex
          for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
            const time = input.readFloat()
            Color.rgba8888ToColor(tempColor1, input.readInt32())
            Color.rgb888ToColor(tempColor2, input.readInt32())
            timeline.setFrame(
              frameIndex,
              time,
              tempColor1.r,
              tempColor1.g,
              tempColor1.b,
              tempColor1.a,
              tempColor2.r,
              tempColor2.g,
              tempColor2.b,
            )
            if (frameIndex < frameCount - 1) {
              readCurve(input, frameIndex, timeline)
            }
          }
          timelines.push(timeline)
          duration = Math.max(duration, timeline.frames[(frameCount - 1) * TwoColorTimeline.ENTRIES])
          break
        }
      }
    }
  }

  for (let i = 0, n = input.readInt(true); i < n; i += 1) {
    const boneIndex = input.readInt(true)
    for (let ii = 0, nn = input.readInt(true); ii < nn; ii += 1) {
      const timelineType = input.readByte()
      const frameCount = input.readInt(true)
      if (frameCount <= 0) {
        continue
      }

      switch (timelineType) {
        case SB.BONE_ROTATE: {
          const timeline = new RotateTimeline(frameCount)
          timeline.boneIndex = boneIndex
          for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
            timeline.setFrame(frameIndex, input.readFloat(), input.readFloat())
            if (frameIndex < frameCount - 1) {
              readCurve(input, frameIndex, timeline)
            }
          }
          timelines.push(timeline)
          duration = Math.max(duration, timeline.frames[(frameCount - 1) * RotateTimeline.ENTRIES])
          break
        }
        case SB.BONE_TRANSLATE:
        case SB.BONE_SCALE:
        case SB.BONE_SHEAR: {
          let timeline: ScaleTimeline | ShearTimeline | TranslateTimeline
          let timelineScale = 1
          if (timelineType === SB.BONE_SCALE) {
            timeline = new ScaleTimeline(frameCount)
          } else if (timelineType === SB.BONE_SHEAR) {
            timeline = new ShearTimeline(frameCount)
          } else {
            timeline = new TranslateTimeline(frameCount)
            timelineScale = scale
          }
          timeline.boneIndex = boneIndex
          for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
            timeline.setFrame(
              frameIndex,
              input.readFloat(),
              input.readFloat() * timelineScale,
              input.readFloat() * timelineScale,
            )
            if (frameIndex < frameCount - 1) {
              readCurve(input, frameIndex, timeline)
            }
          }
          timelines.push(timeline)
          duration = Math.max(duration, timeline.frames[(frameCount - 1) * TranslateTimeline.ENTRIES])
          break
        }
      }
    }
  }

  // Spine 3.6 IK keyframes: time, mix, bendDirection (+ curve)
  for (let i = 0, n = input.readInt(true); i < n; i += 1) {
    const index = input.readInt(true)
    const frameCount = input.readInt(true)
    if (frameCount <= 0) {
      continue
    }

    const timeline = new IkConstraintTimeline(frameCount)
    timeline.ikConstraintIndex = index
    for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
      timeline.setFrame(
        frameIndex,
        input.readFloat(),
        input.readFloat(),
        0,
        input.readByte(),
        false,
        false,
      )
      if (frameIndex < frameCount - 1) {
        readCurve(input, frameIndex, timeline)
      }
    }
    timelines.push(timeline)
    duration = Math.max(duration, timeline.frames[(frameCount - 1) * IkConstraintTimeline.ENTRIES])
  }

  // Spine 3.6 transform keyframes: time + 4 mix values + curve
  for (let i = 0, n = input.readInt(true); i < n; i += 1) {
    const index = input.readInt(true)
    const frameCount = input.readInt(true)
    if (frameCount <= 0) {
      continue
    }

    const timeline = new TransformConstraintTimeline(frameCount)
    timeline.transformConstraintIndex = index
    for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
      timeline.setFrame(
        frameIndex,
        input.readFloat(),
        input.readFloat(),
        input.readFloat(),
        input.readFloat(),
        input.readFloat(),
      )
      if (frameIndex < frameCount - 1) {
        readCurve(input, frameIndex, timeline)
      }
    }
    timelines.push(timeline)
    duration = Math.max(
      duration,
      timeline.frames[(frameCount - 1) * TransformConstraintTimeline.ENTRIES],
    )
  }

  for (let i = 0, n = input.readInt(true); i < n; i += 1) {
    const index = input.readInt(true)
    const data = skeletonData.pathConstraints[index]
    for (let ii = 0, nn = input.readInt(true); ii < nn; ii += 1) {
      const timelineType = input.readByte()
      const frameCount = input.readInt(true)
      if (frameCount <= 0) {
        continue
      }

      if (!data) {
        skipPathTimeline(input, timelineType, frameCount)
        continue
      }

      switch (timelineType) {
        case SB.PATH_POSITION:
        case SB.PATH_SPACING: {
          let timeline: PathConstraintPositionTimeline | PathConstraintSpacingTimeline
          let timelineScale = 1
          if (timelineType === SB.PATH_SPACING) {
            timeline = new PathConstraintSpacingTimeline(frameCount)
            if (data.spacingMode === SpacingMode.Length || data.spacingMode === SpacingMode.Fixed) {
              timelineScale = scale
            }
          } else {
            timeline = new PathConstraintPositionTimeline(frameCount)
            if (data.positionMode === PositionMode.Fixed) {
              timelineScale = scale
            }
          }
          timeline.pathConstraintIndex = index
          for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
            timeline.setFrame(frameIndex, input.readFloat(), input.readFloat() * timelineScale)
            if (frameIndex < frameCount - 1) {
              readCurve(input, frameIndex, timeline)
            }
          }
          timelines.push(timeline)
          duration = Math.max(
            duration,
            timeline.frames[(frameCount - 1) * PathConstraintPositionTimeline.ENTRIES],
          )
          break
        }
        case SB.PATH_MIX: {
          const timeline = new PathConstraintMixTimeline(frameCount)
          timeline.pathConstraintIndex = index
          for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
            timeline.setFrame(frameIndex, input.readFloat(), input.readFloat(), input.readFloat())
            if (frameIndex < frameCount - 1) {
              readCurve(input, frameIndex, timeline)
            }
          }
          timelines.push(timeline)
          duration = Math.max(
            duration,
            timeline.frames[(frameCount - 1) * PathConstraintMixTimeline.ENTRIES],
          )
          break
        }
      }
    }
  }

  for (let i = 0, n = input.readInt(true); i < n; i += 1) {
    const skin = skeletonData.skins[input.readInt(true)]
    for (let ii = 0, nn = input.readInt(true); ii < nn; ii += 1) {
      const slotIndex = input.readInt(true)
      for (let iii = 0, nnn = input.readInt(true); iii < nnn; iii += 1) {
        const attachmentName = readAttachmentName(input)
        const frameCount = input.readInt(true)
        if (frameCount <= 0) {
          continue
        }

        const attachment = skin?.getAttachment(slotIndex, attachmentName)
        if (!attachment) {
          skipDeformTimeline(input, frameCount, scale)
          continue
        }

        const weighted = attachment.bones != null
        const vertices = attachment.vertices
        const deformLength = weighted ? (vertices.length / 3) * 2 : vertices.length
        const timeline = new DeformTimeline(frameCount)
        timeline.slotIndex = slotIndex
        timeline.attachment = attachment
        for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
          const time = input.readFloat()
          let deform: number[]
          const end = input.readInt(true)
          if (end === 0) {
            deform = weighted ? Utils.newFloatArray(deformLength) : vertices
          } else {
            deform = Utils.newFloatArray(deformLength)
            const start = input.readInt(true)
            const endIndex = end + start
            if (scale === 1) {
              for (let v = start; v < endIndex; v += 1) {
                deform[v] = input.readFloat()
              }
            } else {
              for (let v = start; v < endIndex; v += 1) {
                deform[v] = input.readFloat() * scale
              }
            }
            if (!weighted) {
              for (let v = 0, vn = deform.length; v < vn; v += 1) {
                deform[v] += vertices[v]
              }
            }
          }
          timeline.setFrame(frameIndex, time, deform)
          if (frameIndex < frameCount - 1) {
            readCurve(input, frameIndex, timeline)
          }
        }
        timelines.push(timeline)
        duration = Math.max(duration, timeline.frames[frameCount - 1])
      }
    }
  }

  const drawOrderCount = input.readInt(true)
  if (drawOrderCount > 0) {
    const timeline = new DrawOrderTimeline(drawOrderCount)
    const slotCount = skeletonData.slots.length
    for (let i = 0; i < drawOrderCount; i += 1) {
      const time = input.readFloat()
      const offsetCount = input.readInt(true)
      const drawOrder = Utils.newArray<number>(slotCount, 0)
      for (let ii = slotCount - 1; ii >= 0; ii -= 1) {
        drawOrder[ii] = -1
      }
      const unchanged = Utils.newArray<number>(slotCount - offsetCount, 0)
      let originalIndex = 0
      let unchangedIndex = 0
      for (let ii = 0; ii < offsetCount; ii += 1) {
        const slotIndex = input.readInt(true)
        while (originalIndex !== slotIndex) {
          unchanged[unchangedIndex++] = originalIndex++
        }
        drawOrder[originalIndex + input.readInt(true)] = originalIndex++
      }
      while (originalIndex < slotCount) {
        unchanged[unchangedIndex++] = originalIndex++
      }
      for (let ii = slotCount - 1; ii >= 0; ii -= 1) {
        if (drawOrder[ii] === -1) {
          drawOrder[ii] = unchanged[--unchangedIndex]
        }
      }
      timeline.setFrame(i, time, drawOrder)
    }
    timelines.push(timeline)
    duration = Math.max(duration, timeline.frames[drawOrderCount - 1])
  }

  const eventCount = input.readInt(true)
  if (eventCount > 0) {
    const timeline = new EventTimeline(eventCount)
    for (let i = 0; i < eventCount; i += 1) {
      const time = input.readFloat()
      const eventData = skeletonData.events[input.readInt(true)]
      const event = new Event(time, eventData)
      event.intValue = input.readInt(false)
      event.floatValue = input.readFloat()
      event.stringValue = input.readBoolean() ? input.readString() : eventData.stringValue
      timeline.setFrame(i, event)
    }
    timelines.push(timeline)
    duration = Math.max(duration, timeline.frames[eventCount - 1])
  }

  return new Animation(name, timelines, duration)
}

export function installSpine36ReadAnimation(parser: AnimationParser) {
  parser.readAnimation = (input, name, skeletonData) =>
    readAnimation36(parser, input, name, skeletonData)
}
