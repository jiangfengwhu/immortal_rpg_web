export type WorldMapChapter = {
  id: string
  name: string
  phase: number
  phaseName: string
  palette: string
  imageAsset?: string
  keywords: string[]
  globalStageFrom: number
  globalStageTo: number
}

/** 与 server/internal/game/world_maps.go 章节顺序一致 */
export const WORLD_MAP_CATALOG: WorldMapChapter[] = [
  { id: 'map_qingshi_village', name: '青石村', phase: 1, phaseName: '凡尘俗世', palette: '土黄、青灰、竹绿', imageAsset: '青石村.jpg', keywords: ['竹林', '溪流', '农田', '药田', '木屋', '石桥', '古树', '晨雾'], globalStageFrom: 0, globalStageTo: 3 },
  { id: 'map_luoxia_mountain', name: '落霞山', phase: 1, phaseName: '凡尘俗世', palette: '土黄、青灰、竹绿', imageAsset: '落霞山.jpg', keywords: ['山道', '密林', '瀑布', '野兽巢穴', '采药点'], globalStageFrom: 4, globalStageTo: 7 },
  { id: 'map_pingan_town', name: '平安镇', phase: 1, phaseName: '凡尘俗世', palette: '土黄、青灰、竹绿', imageAsset: '平安镇.jpg', keywords: ['酒馆', '镖局', '铁匠铺', '客栈', '码头', '集市'], globalStageFrom: 8, globalStageTo: 11 },
  { id: 'map_qingyun_sect', name: '青云剑派', phase: 2, phaseName: '武林江湖', palette: '深绿、暗红、青黑', imageAsset: '青云剑派.jpg', keywords: ['山门', '演武场', '藏经阁', '剑冢', '古松', '石阶'], globalStageFrom: 12, globalStageTo: 15 },
  { id: 'map_heifeng_fort', name: '黑风寨', phase: 2, phaseName: '武林江湖', palette: '深绿、暗红、青黑', imageAsset: '黑风寨.jpg', keywords: ['山寨', '木栅栏', '瞭望塔', '密道', '悬崖'], globalStageFrom: 16, globalStageTo: 18 },
  { id: 'map_ancient_battlefield', name: '古战场遗迹', phase: 2, phaseName: '武林江湖', palette: '深绿、暗红、青黑', imageAsset: '古战场遗迹.jpg', keywords: ['断剑', '残旗', '废墟', '骸骨', '古城墙'], globalStageFrom: 19, globalStageTo: 21 },
  { id: 'map_qinglan_range', name: '青岚山脉', phase: 3, phaseName: '炼气筑基', palette: '青蓝、白色、金色', imageAsset: '青岚山脉.jpg', keywords: ['云海', '灵泉', '灵兽', '灵脉', '悬崖'], globalStageFrom: 22, globalStageTo: 24 },
  { id: 'map_mist_valley', name: '灵雾谷', phase: 3, phaseName: '炼气筑基', palette: '青蓝、白色、金色', imageAsset: '灵雾谷.jpg', keywords: ['迷雾', '灵植', '石碑', '阵法', '峡谷'], globalStageFrom: 25, globalStageTo: 27 },
  { id: 'map_hidden_immortal_cave', name: '隐仙洞', phase: 3, phaseName: '炼气筑基', palette: '青蓝、白色、金色', imageAsset: '隐仙洞.jpg', keywords: ['洞府', '灵泉', '符文', '石室', '机关'], globalStageFrom: 28, globalStageTo: 30 },
  { id: 'map_tianji_city', name: '天机城', phase: 4, phaseName: '金丹元婴', palette: '金白、深蓝、赤金', imageAsset: '天机城.jpg', keywords: ['坊市', '拍卖行', '飞舟', '护城阵法', '炼器坊'], globalStageFrom: 31, globalStageTo: 33 },
  { id: 'map_taixu_sect', name: '太虚仙宗', phase: 4, phaseName: '金丹元婴', palette: '金白、深蓝、赤金', imageAsset: '太虚仙宗.jpg', keywords: ['浮空岛', '飞瀑', '云海', '仙鹤', '护山大阵'], globalStageFrom: 34, globalStageTo: 36 },
  { id: 'map_mystic_crystal_mine', name: '玄晶矿脉', phase: 4, phaseName: '金丹元婴', palette: '金白、深蓝、赤金', keywords: ['灵矿', '水晶', '矿洞', '封印', '地下河'], globalStageFrom: 37, globalStageTo: 39 },
  { id: 'map_primordial_temple', name: '太初神殿', phase: 5, phaseName: '化神悟道', palette: '紫金、银白、深紫', keywords: ['神殿', '符文', '雕像', '石柱', '封印'], globalStageFrom: 40, globalStageTo: 42 },
  { id: 'map_nether_abyss', name: '幽冥深渊', phase: 5, phaseName: '化神悟道', palette: '紫金、银白、深紫', keywords: ['血月', '鬼火', '魔气', '裂谷', '枯木'], globalStageFrom: 43, globalStageTo: 45 },
  { id: 'map_glazed_paradise', name: '琉璃仙境', phase: 5, phaseName: '化神悟道', palette: '紫金、银白、深紫', keywords: ['灵泉', '仙桃树', '浮空石', '水晶', '灵蝶'], globalStageFrom: 46, globalStageTo: 48 },
  { id: 'map_tribulation_platform', name: '渡劫台', phase: 6, phaseName: '渡劫飞升', palette: '白金、雷紫、天青', keywords: ['雷云', '阵法', '石柱', '锁链', '天雷'], globalStageFrom: 49, globalStageTo: 51 },
  { id: 'map_ascension_gate', name: '飞升之门', phase: 6, phaseName: '渡劫飞升', palette: '白金、雷紫、天青', keywords: ['天门', '金色阶梯', '云海', '仙光', '空间裂缝'], globalStageFrom: 52, globalStageTo: 54 },
  { id: 'map_lingxiao_capital', name: '凌霄仙都', phase: 7, phaseName: '上界仙域', palette: '纯白、淡金、青玉', keywords: ['浮空仙岛', '天河', '仙舟', '白玉宫殿', '祥云'], globalStageFrom: 55, globalStageTo: 57 },
  { id: 'map_starsea_secret', name: '星海秘境', phase: 7, phaseName: '上界仙域', palette: '纯白、淡金、青玉', keywords: ['星海', '银河', '星辰碎片', '虚空', '时空裂缝'], globalStageFrom: 58, globalStageTo: 60 },
  { id: 'map_heavenly_dao_domain', name: '天道圣域', phase: 7, phaseName: '上界仙域', palette: '纯白、淡金、青玉', keywords: ['太极阵', '法则符文', '光河', '天道', '混沌'], globalStageFrom: 61, globalStageTo: 63 },
]

export const MAP_ASSET_BASE = '/game-ui/maps'

export const MAP_STYLE_SUFFIX =
  '东方玄幻，武侠修仙，新国风水墨，工笔重彩，古代山海经风格，卷轴质感，俯视角地图，等距视角，手绘地图，色块化地形，低饱和配色，水墨晕染，留白构图，符号化植被，游戏地图概念设计，高细节，统一世界观，无现代元素'
