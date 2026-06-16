import { AFK_FEATURE_LABELS } from '../quest/story.constants'

export const INTERACTION_ACTION_TEXT: Record<string, string> = {
  go_yard: '你推开木门，踏入小院。',
  talk_grandpa: '你走到爷爷身旁，听他咳嗽着说话。',
  go_herb_field: '你往村东药田走去。',
  go_bamboo: '你往后山竹林行去。',
  go_bamboo_deep: '你深入竹林，雾色渐浓。',
  go_stone_bridge: '你沿溪水前往村口石桥。',
  fight_boar: '变异野猪从雾中冲出，你握紧兵器。',
  prepare_departure: '你开始整理行装，准备离村。',
}

export function afkStatusText(feature: string): string {
  switch (feature) {
    case 'AFK_HERB_FIELD':
      return '正在药田采药…'
    case 'AFK_BAMBOO_HUNT':
      return '正在竹林历练…'
    default:
      return `正在${AFK_FEATURE_LABELS[feature] ?? '忙碌'}…`
  }
}

export const BATTLE_STATUS_TEXT = '正在与敌手交锋…'
export const BATTLE_WIN_TEXT = '敌手已退，你喘息着站稳身形。'
export const BATTLE_LOSE_TEXT = '你力竭倒地，须再整旗鼓。'
