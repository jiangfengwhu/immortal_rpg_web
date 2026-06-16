import { useCallback, useMemo, useState, useRef, useEffect, type MouseEvent } from 'react'
import type { MagicSchool, PrimaryAttributes } from '../game/character/character.types'
import {
  DERIVED_STAT_LABELS,
  MAGIC_SCHOOL_LABELS,
  PLAYER_CLASS_LABELS,
  PRIMARY_ATTR_LABELS,
  REALM_LABELS,
} from '../game/character/character.constants'
import { useGameSessionStore } from '../game/gameSessionStore'
import { PLAYER_COPY } from '../game/ui/playerCopy'
import { isSectRecruitmentUnlocked } from '../game/world/worldMap.progression'
import { useJourneyQuest } from '../game/quest/useJourneyQuest'
import { STORY_FEATURE_KEYS } from '../game/quest/story.constants'
import { CharacterPanelTabs } from './CharacterPanelTabs'
import { InventoryBagGrid } from './InventoryBagGrid'
import { InventoryItemDetail } from './InventoryItemDetail'
import { EquipVisual } from './inventoryBag.shared'
import { findEquipmentItem } from '../game/inventory/findEquipmentItem'
import {
  anchorBelowBagColumn,
  anchorBelowSlot,
  clampDetailAnchorX,
  type InventoryDetailAnchor,
} from '../game/inventory/inventoryDetailAnchor'
import { shouldKeepInventoryDetailOpen } from '../game/inventory/inventoryHover'
import { canEquipItem } from '../game/equipment/computeEquipmentBonuses'
import { SLOT_GLYPH, EQUIPMENT_SLOT_LABELS } from '../game/equipment/equipment.constants'
import type { EquipmentSlot, Equipment } from '../game/equipment/equipment.types'

const PRIMARY_KEYS = Object.keys(PRIMARY_ATTR_LABELS) as (keyof PrimaryAttributes)[]
const DERIVED_KEYS = ['maxHp', 'stamina', 'mp', 'attack', 'defense', 'spiritPower', 'speed'] as const
const MAGIC_KEYS = Object.keys(MAGIC_SCHOOL_LABELS) as MagicSchool[]

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

const SPELL_DESCRIPTIONS: Record<string, string> = {
  九天御雷真诀: '“九天玄刹，化为神雷！”引万千狂雷劈向对手，顺便给自己的手机充满电。',
  大日如来神掌: '从天而降的掌法！金光爆裂，能把敌手一巴掌拍进地底，抠都抠不出来。',
  太乙分光剑影: '分化出上千道虚空剑影，看起来极其拉风逼格拉满，其实只有一柄是真的。',
  摸鱼无极大法: '无上混子心法。在对手眼皮底下疯狂摸鱼而不会被识破，达到无招胜有招的至高境界。',
  '葵花宝典(九成新)': '绝世武林秘籍。第一页写着“欲练此功，必先…”，往后翻一页：“不练其实也行”。',
  '辟邪剑法(高仿版)': '动作极度鬼畜。以肉眼无法察觉的速度在对手面前跳起广播体操，造成严重精神污染。',
  咸鱼翻身剑法: '“咸鱼翻身，还是咸鱼！”但在翻身的瞬间会爆发出难以置信的逆袭反扑伤害。',
  狂风落叶扫堂腿: '以狂风之势横扫。不仅能扫倒对手，还能顺便把演武场的卫生打扫得一干二净。',
  排山倒海碰瓷功: '当场朝地上一躺，大喊“打人啦！”，以强大的道德谴责对敌手灵魂进行降维打击。',
  '凌波微步(包邮)': '身法飘逸，规避一切攻击。相传是由某丰速运的资深快递小哥为赶工而创立。',
  '太极拳(广场舞版)': '“一个大西瓜，送给王小二”。以极其柔缓的动作磨灭敌手的耐心，自带魔性背景音乐。',
  广播体操第七套: '“伸展运动，一二三四…”做完后神清气爽，敌手在一旁看得目瞪口呆当场石化。',
}

function getSpellRarity(name: string): 'legendary' | 'epic' | 'rare' {
  if (['九天御雷真诀', '大日如来神掌', '太乙分光剑影', '摸鱼无极大法'].includes(name)) return 'legendary'
  if (['葵花宝典(九成新)', '辟邪剑法(高仿版)', '咸鱼翻身剑法'].includes(name)) return 'epic'
  return 'rare'
}

type EquipSlotCompactProps = {
  slot: EquipmentSlot
  item?: Equipment
  onHover: (itemId: string | null, event?: MouseEvent<HTMLElement>) => void
  onHoverClear: (event: MouseEvent<HTMLElement>) => void
  onQuickEquip: (item: Equipment, event: MouseEvent<HTMLElement>) => void
}

function EquipSlotCompact({ slot, item, onHover, onHoverClear, onQuickEquip }: EquipSlotCompactProps) {
  const rarityKey = item?.rarity ?? 'common'

  if (!item) {
    return (
      <div className="equip-slot equip-slot--empty" title={EQUIPMENT_SLOT_LABELS[slot]}>
        {SLOT_GLYPH[slot]}
      </div>
    )
  }

  return (
    <button
      type="button"
      data-inventory-item
      data-item-id={item.id}
      className={`equip-slot equip-slot--filled equip-slot--${rarityKey}`}
      onMouseEnter={(event) => onHover(item.id, event)}
      onMouseLeave={onHoverClear}
      onFocus={(event) => onHover(item.id, event)}
      onClick={(event) => onHover(item.id, event)}
      onContextMenu={(event) => onQuickEquip(item, event)}
    >
      <EquipVisual item={item} size="sm" />
    </button>
  )
}

const ALL_COMPACT_SLOTS: EquipmentSlot[] = [
  'hat', 'necklace', 'weapon',
  'top', 'belt', 'bracer',
  'bottom', 'ring', 'shoes'
]

export function CharacterStatsPanel() {
  const playerState = useGameSessionStore((state) => state.playerState)
  const isSaving = useGameSessionStore((state) => state.isSaving)
  const allocatePoint = useGameSessionStore((state) => state.allocatePoint)
  const autoAllocate = useGameSessionStore((state) => state.autoAllocate)
  const equipItemById = useGameSessionStore((state) => state.equipItemById)
  const identifyItemById = useGameSessionStore((state) => state.identifyItemById)
  const hatchPlayerPet = useGameSessionStore((state) => state.hatchPlayerPet)
  const mutatePlayerPet = useGameSessionStore((state) => state.mutatePlayerPet)
  const activatePlayerPet = useGameSessionStore((state) => state.activatePlayerPet)

  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null)
  const [detailAnchor, setDetailAnchor] = useState<InventoryDetailAnchor | null>(null)
  const [bagCategory, setBagCategory] = useState<'all' | 'equip' | 'material'>('all')

  const { storyState } = useJourneyQuest()

  const updateDetailAnchor = useCallback((slotElement: HTMLElement) => {
    const container = containerRef.current
    if (!container) return

    const containerRect = container.getBoundingClientRect()
    // Align tooltip to the right of the panel to avoid overlapping the tabs
    const raw = anchorBelowSlot(slotElement, containerRect)
    setDetailAnchor(clampDetailAnchorX(raw, containerRect.width))
  }, [])

  const handleHoverItem = useCallback((itemId: string | null, event?: MouseEvent<HTMLElement>) => {
    setHoveredItemId(itemId)
    if (!itemId || !event) {
      if (!itemId) setDetailAnchor(null)
      return
    }
    updateDetailAnchor(event.currentTarget)
  }, [updateDetailAnchor])

  const handleHoverClear = useCallback((event: MouseEvent<HTMLElement>) => {
    if (shouldKeepInventoryDetailOpen(event.relatedTarget)) return
    setHoveredItemId(null)
    setDetailAnchor(null)
  }, [])

  const clearDetailHover = useCallback(() => {
    setHoveredItemId(null)
    setDetailAnchor(null)
  }, [])

  const handleQuickEquip = useCallback((item: Equipment, event: MouseEvent<HTMLElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (isSaving || !canEquipItem(item)) return
    void equipItemById(item.id).then(() => clearDetailHover())
  }, [clearDetailHover, equipItemById, isSaving])

  const syncInventoryItems = useCallback((items: Equipment[]) => {
    useGameSessionStore.getState().syncInventoryItems(items)
  }, [])

  if (!playerState) return null

  const { player, inventory, equipped } = playerState
  const expThreshold = player.level * 30
  const hasPotential = player.potentialPoints > 0
  const expRatio = Math.min(100, Math.round((player.exp / expThreshold) * 100))
  const soloMode = !isSectRecruitmentUnlocked(player.realm, player.stageIndex)
  const hasNoviceTitle = storyState?.unlockedFeatures?.includes(STORY_FEATURE_KEYS.titleNovice)

  const hoveredItem = hoveredItemId
    ? findEquipmentItem(inventory, equipped, hoveredItemId) ?? null
    : null

  // 1. Pack Category items
  const filteredBagItems = inventory.filter((item) => {
    if (bagCategory === 'all') return true
    if (bagCategory === 'equip') return item.slot !== 'material'
    if (bagCategory === 'material') return item.slot === 'material'
    return true
  })

  // 2. Active pet & Pet List
  const pets = player.pets ?? []
  const activePet = pets.find((p) => p.isActive)

  return (
    <aside ref={containerRef} className="character-panel side-panel scroll-panel">
      <span className="scroll-panel__corner scroll-panel__corner--tl" aria-hidden />
      <span className="scroll-panel__corner scroll-panel__corner--tr" aria-hidden />
      <span className="scroll-panel__corner scroll-panel__corner--bl" aria-hidden />
      <span className="scroll-panel__corner scroll-panel__corner--br" aria-hidden />

      <header className="character-panel__header">
        <div className="character-panel__header-row">
          <div className="character-panel__identity">
            <p className="side-panel__eyebrow">
              {soloMode ? PLAYER_COPY.soloTravelBadge : PLAYER_COPY.sectRecruitUnlocked}
            </p>
            <h2 className="character-panel__name glow-text--gold">{player.name}</h2>
            {hasNoviceTitle && (
              <p className="character-panel__title-badge">{PLAYER_COPY.titleNovice}</p>
            )}
            <p className="character-panel__realm">
              {PLAYER_CLASS_LABELS[player.class]} · Lv.{player.level}
            </p>
            <span className="character-panel__realm-value">境界：{REALM_LABELS[player.realm] ?? player.realm}</span>
          </div>

          <div className="character-panel__equip-grid">
            {ALL_COMPACT_SLOTS.map((slot) => (
              <EquipSlotCompact
                key={slot}
                slot={slot}
                item={equipped[slot]}
                onHover={handleHoverItem}
                onHoverClear={handleHoverClear}
                onQuickEquip={handleQuickEquip}
              />
            ))}
          </div>
        </div>

        {/* 境界修为条与金币 */}
        <div className="character-panel__exp">
          <div className="character-panel__exp-track">
            <div className="character-panel__exp-fill" style={{ width: `${expRatio}%` }} />
          </div>
          <div className="character-panel__exp-meta">
            <span>修为 {player.exp}/{expThreshold}</span>
            <span>金币 {player.gold}</span>
          </div>
        </div>
      </header>

      <div className="character-panel__body">
        <CharacterPanelTabs
          /* TAB 1: 行囊 */
          bag={
            <div className="character-panel__bag">
              <div className="character-panel__bag-filter">
                {(['all', 'equip', 'material'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={
                      bagCategory === cat
                        ? 'character-panel__bag-filter-btn character-panel__bag-filter-btn--active'
                        : 'character-panel__bag-filter-btn'
                    }
                    onClick={() => setBagCategory(cat)}
                  >
                    {cat === 'all' && '全部'}
                    {cat === 'equip' && '装备'}
                    {cat === 'material' && '材料'}
                  </button>
                ))}
              </div>

              <div className="character-panel__bag-grid-wrap">
                <InventoryBagGrid
                  playerId={player.id}
                  items={filteredBagItems}
                  open={true}
                  hoveredItemId={hoveredItemId}
                  onHoverItem={handleHoverItem}
                  onHoverClear={handleHoverClear}
                  onQuickEquip={handleQuickEquip}
                  onItemsChange={syncInventoryItems}
                />
              </div>
            </div>
          }
          /* TAB 2: 属性与加点 */
          combat={
            <div className="character-panel__tab-scroll">
              <h4 className="character-panel__section-title">战体属性</h4>
              <ul className="character-panel__stat-list">
                {DERIVED_KEYS.map((key) => (
                  <li key={key} className="character-panel__stat-row">
                    <span>{DERIVED_STAT_LABELS[key]}</span>
                    <strong>{player.stats[key]}</strong>
                  </li>
                ))}
                <li className="character-panel__stat-row">
                  <span>{DERIVED_STAT_LABELS.sealRate}</span>
                  <strong>{formatPercent(player.stats.sealRate)}</strong>
                </li>
                <li className="character-panel__stat-row">
                  <span>{DERIVED_STAT_LABELS.sealResist}</span>
                  <strong>{formatPercent(player.stats.sealResist)}</strong>
                </li>
              </ul>
            </div>
          }
          /* TAB 3: 加点 */
          talent={
            <div style={{ overflowY: 'auto', maxHeight: '420px', paddingRight: '4px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ margin: 0, color: '#fbbf24', fontSize: '0.85rem' }}>天赋修行</h4>
                {hasPotential && (
                  <span className="character-panel__badge" style={{ fontSize: '0.75rem', backgroundColor: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.3)', color: '#fbbf24' }}>
                    潜力点 {player.potentialPoints}
                  </span>
                )}
              </div>
              <ul className="character-panel__stat-list" style={{ padding: 0, margin: '0 0 12px 0' }}>
                {PRIMARY_KEYS.map((key) => (
                  <li key={key} className="character-panel__stat-row character-panel__stat-row--talent" style={{ padding: '3px 0' }}>
                    <span className="character-panel__stat-label">{PRIMARY_ATTR_LABELS[key]}</span>
                    <strong>{player.primary[key]}</strong>
                    {hasPotential && (
                      <button
                        type="button"
                        className="character-panel__plus"
                        disabled={isSaving}
                        onClick={() => void allocatePoint(key)}
                        aria-label={`${PRIMARY_ATTR_LABELS[key]} +1`}
                      >
                        +
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              {hasPotential && (
                <button
                  type="button"
                  className="character-panel__auto-btn"
                  style={{ width: '100%', padding: '6px', fontSize: '0.8rem' }}
                  disabled={isSaving}
                  onClick={() => void autoAllocate()}
                >
                  {isSaving ? '铭刻中…' : '按流派推荐一键分配'}
                </button>
              )}
            </div>
          }
          /* TAB 4: 法抗 */
          resist={
            <div style={{ overflowY: 'auto', maxHeight: '420px', paddingRight: '4px', fontSize: '0.82rem' }}>
              <h4 style={{ margin: '0 0 6px 0', color: '#fbbf24', fontSize: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2px' }}>五行抗性</h4>
              <ul className="character-panel__stat-list" style={{ padding: 0, margin: 0 }}>
                {MAGIC_KEYS.map((key) => (
                  <li key={key} className="character-panel__stat-row" style={{ padding: '4px 0' }}>
                    <span>{MAGIC_SCHOOL_LABELS[key]}</span>
                    <strong>{player.magicResist[key].toFixed(1)}</strong>
                  </li>
                ))}
              </ul>
            </div>
          }
          /* TAB 5: 灵宠 */
          pets={
            <div style={{ overflowY: 'auto', maxHeight: '420px', paddingRight: '4px', fontSize: '0.82rem' }}>
              {/* 出战宠 */}
              <div
                style={{
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                  padding: '10px',
                  marginBottom: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>当前出战灵宠</span>
                  {activePet && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: activePet.rarity === 'divine' ? '#ff9a2e' : activePet.rarity === 'mutated' ? '#b06aff' : activePet.rarity === 'rare' ? '#5a9fff' : '#34d399',
                        fontWeight: 'bold',
                      }}
                    >
                      {activePet.rarity === 'divine' && '【神宠】'}
                      {activePet.rarity === 'mutated' && '【变异】'}
                      {activePet.rarity === 'rare' && '【珍兽】'}
                      {activePet.rarity === 'strange' && '【奇兽】'}
                    </span>
                  )}
                </div>
                {activePet ? (
                  <div>
                    <h4 style={{ margin: '0 0 6px 0', color: '#fff', fontSize: '1.05rem' }}>
                      {activePet.name} <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Lv.{activePet.level}</span>
                    </h4>
                    {activePet.skills && activePet.skills.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                        {activePet.skills.map((s, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '0.72rem',
                              backgroundColor: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              color: '#cbd5e1',
                            }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ margin: 0, color: '#64748b', fontStyle: 'italic', fontSize: '0.8rem' }}>当前尚无出战灵宠，可从下方列表召出</p>
                )}
              </div>

              {/* 孵化/变异按钮 */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button
                  type="button"
                  className="character-panel__auto-btn"
                  style={{ flex: 1, padding: '6px', fontSize: '0.78rem', margin: 0 }}
                  disabled={isSaving || player.gold < 100}
                  onClick={() => void hatchPlayerPet()}
                >
                  孵化灵宠 (100金)
                </button>
                <button
                  type="button"
                  className="character-panel__auto-btn"
                  style={{
                    flex: 1,
                    padding: '6px',
                    fontSize: '0.78rem',
                    margin: 0,
                    borderColor: 'rgba(176,106,255,0.4)',
                    color: player.gold >= 200 && activePet ? '#c99bff' : '#64748b',
                  }}
                  disabled={isSaving || !activePet || player.gold < 200}
                  onClick={() => activePet && void mutatePlayerPet(activePet.id)}
                >
                  变异进化 (200金)
                </button>
              </div>

              {/* 灵宠仓库列表 */}
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#fbbf24', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2px' }}>灵宠名录 ({pets.length})</h4>
              {pets.length === 0 ? (
                <p style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.78rem' }}>尚无豢养任何灵宠，快点击上方孵化召唤吧</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {pets.map((pet) => (
                    <li
                      key={pet.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255,255,255,0.01)',
                        border: pet.isActive ? '1px solid rgba(201,164,92,0.3)' : '1px solid rgba(255,255,255,0.03)',
                        borderRadius: '6px',
                        padding: '6px 8px',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: pet.isActive ? 'bold' : 'normal', color: pet.isActive ? '#fbbf24' : '#cbd5e1' }}>{pet.name}</span>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginLeft: '6px' }}>Lv.{pet.level}</span>
                      </div>
                      {pet.isActive ? (
                        <span style={{ fontSize: '0.72rem', color: '#fbbf24', padding: '2px 8px', backgroundColor: 'rgba(201,164,92,0.1)', borderRadius: '4px' }}>出战中</span>
                      ) : (
                        <button
                          type="button"
                          disabled={isSaving}
                          style={{
                            fontSize: '0.72rem',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '4px',
                            color: '#cbd5e1',
                            padding: '2px 8px',
                            cursor: 'pointer',
                          }}
                          onClick={() => void activatePlayerPet(pet.id)}
                        >
                          召出
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          }
          /* TAB 6: 绝学 */
          spells={
            <div style={{ overflowY: 'auto', maxHeight: '420px', paddingRight: '4px', fontSize: '0.82rem' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#fbbf24', fontSize: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2px' }}>习得绝学</h4>
              {!player.spells || player.spells.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b' }}>
                  <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>🔮</span>
                  <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.78rem' }}>暂未参透任何大神通绝学。</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.72rem', color: '#475569' }}>在野外与妖兽切磋或主线晋升时有機缘顿悟。</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {player.spells.map((s, idx) => {
                    const r = getSpellRarity(s)
                    const color = r === 'legendary' ? '#ff9a2e' : r === 'epic' ? '#b06aff' : '#5a9fff'
                    return (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.02)',
                          borderLeft: `3px solid ${color}`,
                          borderRight: '1px solid rgba(255,255,255,0.03)',
                          borderTop: '1px solid rgba(255,255,255,0.03)',
                          borderBottom: '1px solid rgba(255,255,255,0.03)',
                          borderRadius: '4px',
                          padding: '8px 10px',
                          boxShadow: `0 2px 4px rgba(0,0,0,0.15), 0 0 4px ${color}11`,
                        }}
                        title={s}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <strong style={{ color: color, fontSize: '0.9rem' }}>《{s}》</strong>
                          <span style={{ fontSize: '0.72rem', color: color, opacity: 0.8 }}>
                            {r === 'legendary' ? '传世绝学' : r === 'epic' ? '盖世神功' : '上乘功法'}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.4, fontStyle: 'italic' }}>
                          {SPELL_DESCRIPTIONS[s] || '大神通绝学，威力横扫八荒。'}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          }
        />
      </div>

      <footer className="character-panel__footer">
        {isSaving && <p className="character-panel__saving">天机运转盘印中…</p>}
      </footer>

      {/* 悬浮装备详情 */}
      {hoveredItem && detailAnchor && (
        <InventoryItemDetail
          item={hoveredItem}
          anchor={detailAnchor}
          isSaving={isSaving}
          onIdentify={(itemId) => void identifyItemById(itemId)}
          onMouseLeave={handleHoverClear}
        />
      )}
    </aside>
  )
}
