import { Spine } from 'pixi-spine'

export type SpineFootBounds = {
  width: number
  height: number
  footCenterX: number
  footCenterY: number
  headY: number
}

const MAX_BOUNDS_SCALE = 2.8

/** 测量前先切到 idle，避免 setup pose 边界为 0 导致缩放/站位错乱 */
export function applySpineIdlePose(spine: Spine, idleAnimation?: string) {
  if (idleAnimation && spine.spineData.findAnimation(idleAnimation)) {
    spine.state.setAnimation(0, idleAnimation, true)
  }
  spine.update(0)
}

function resolveSkeletonDesignSize(spine: Spine) {
  const data = spine.spineData
  return {
    width: Math.max(data.width || 240, 1),
    height: Math.max(data.height || 480, 1),
  }
}

/** 用局部包围盒；特效把 bounds 撑爆时回退到骨骼设计尺寸 */
export function measureSpineFootBounds(spine: Spine): SpineFootBounds {
  spine.update(0)
  const bounds = spine.getLocalBounds()
  const design = resolveSkeletonDesignSize(spine)

  const boundsUnreliable =
    bounds.width < 2 ||
    bounds.height < 2 ||
    bounds.width > design.width * MAX_BOUNDS_SCALE ||
    bounds.height > design.height * MAX_BOUNDS_SCALE

  if (boundsUnreliable) {
    return {
      width: design.width,
      height: design.height,
      footCenterX: design.width / 2,
      footCenterY: design.height,
      headY: 0,
    }
  }

  const width = Math.max(bounds.width, 1)
  const height = Math.max(bounds.height, 1)

  return {
    width,
    height,
    footCenterX: bounds.x + width / 2,
    footCenterY: bounds.y + height,
    headY: bounds.y,
  }
}

export function computeSpineFitScale(
  bounds: SpineFootBounds,
  worldHeight: number,
  fitHeightWeight: number,
  unitScale: number,
) {
  const maxDimension = Math.max(bounds.width, bounds.height, 1)
  return ((worldHeight * fitHeightWeight) / maxDimension) * unitScale
}

/** 将角色脚底中心对齐到场景坐标 (footX, footY) */
export function placeSpineAtFoot(
  spine: Spine,
  footX: number,
  footY: number,
  scaleX: number,
  scaleY: number,
) {
  spine.scale.set(scaleX, scaleY)
  spine.update(0)

  const bounds = measureSpineFootBounds(spine)
  spine.x = footX - bounds.footCenterX * scaleX
  spine.y = footY - bounds.footCenterY * scaleY
}

/** 血条/名牌锚点：由 spine 变换 + 局部包围盒推算，不用 getBounds()（会被特效撑满屏） */
export function readSpineMarkerAnchor(spine: Spine) {
  spine.update(0)
  const local = measureSpineFootBounds(spine)
  const scaleX = spine.scale.x
  const scaleY = spine.scale.y

  return {
    centerX: spine.x + local.footCenterX * scaleX,
    footY: spine.y + local.footCenterY * scaleY,
    headY: spine.y + local.headY * scaleY,
  }
}
