import { wuxiaQPlayerAsset } from './wuxiaQ.constants'

export const PLAYER_MOVE_SPEED = 2.8

export const SPINE_ASSET = {
  skeleton: wuxiaQPlayerAsset('azhu', 'azhu.skel'),
  scale: 0.55,
} as const

export const PLAYER_ANIMATION = {
  idle: 'idle',
  skill1: 'skill1',
  death: 'death',
} as const

export const WORLD_PADDING = 48
