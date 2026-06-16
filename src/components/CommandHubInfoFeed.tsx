import { useLayoutEffect, useMemo, useRef, useState } from 'react'

import { buildInfoFeed } from '../game/infoFeed/buildInfoFeed'
import { findActiveHarvestEntry } from '../game/harvest/harvestSession'
import type { InfoFeedItem } from '../game/infoFeed/infoFeed.types'
import type { TimelineFeedEntry } from '../game/infoFeed/infoFeed.types'
import { PLAYER_COPY } from '../game/ui/playerCopy'

type CommandHubInfoFeedProps = {
  timeline: TimelineFeedEntry[]
  objectives: string[]
  onStopHarvest?: (sessionId: string) => void
}

function getItemCategory(kind: string): 'world' | 'self' | 'system' {
  switch (kind) {
    case 'action':
      return 'self'
    case 'narrative':
    case 'dialogue':
    case 'focus':
      return 'world'
    default:
      return 'system'
  }
}

function getBadgeMeta(kind: string): { label: string; tone: string } {
  switch (kind) {
    case 'dialogue':
      return { label: '对话', tone: 'dialogue' }
    case 'narrative':
      return { label: '叙事', tone: 'narrative' }
    case 'focus':
      return { label: '目标', tone: 'focus' }
    case 'action':
      return { label: '自己', tone: 'self' }
    case 'harvest':
      return { label: '挂机', tone: 'self' }
    default:
      return { label: '系统', tone: 'system' }
  }
}

function itemClassName(item: InfoFeedItem): string {
  return [
    'info-feed__item',
    `info-feed__item--${item.kind}`,
    item.tone === 'warn' ? 'info-feed__item--warn' : '',
    item.fresh ? 'info-feed__item--fresh' : '',
    item.active ? 'info-feed__item--active' : '',
    item.mood === 'danger' ? 'info-feed__item--danger' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

function FeedItemText({ item }: { item: InfoFeedItem }) {
  const suffix = item.repeatCount && item.repeatCount > 1 ? ` ×${item.repeatCount}` : ''
  if (item.kind === 'dialogue') {
    return (
      <>
        {item.speaker && <strong>{item.speaker}：</strong>}
        {item.text}
        {suffix}
      </>
    )
  }
  return (
    <>
      {item.text}
      {suffix}
    </>
  )
}

function HarvestFeedItem({
  item,
  onStopHarvest,
}: {
  item: InfoFeedItem
  onStopHarvest?: (sessionId: string) => void
}) {
  if (item.active) {
    return (
      <div className="info-feed__harvest-wrapper">
        <span className="info-feed__harvest-row">
          <span className="info-feed__pulse" aria-hidden />
          <span className="info-feed__harvest-label">采药中</span>
          <span className="info-feed__harvest-sep" aria-hidden>
            ·
          </span>
          <span className="info-feed__harvest-tip">{item.text}</span>
        </span>
        {onStopHarvest && (
          <button
            type="button"
            className="info-feed__harvest-stop"
            onClick={() => onStopHarvest(item.id)}
          >
            {PLAYER_COPY.harvestStop}
          </button>
        )}
      </div>
    )
  }

  return <FeedItemText item={item} />
}

function InfoFeedItemView({
  item,
  onStopHarvest,
}: {
  item: InfoFeedItem
  onStopHarvest?: (sessionId: string) => void
}) {
  const category = getItemCategory(item.kind)
  const badge = getBadgeMeta(item.kind)

  const badgeEl = (
    <span className={`info-feed__badge info-feed__badge--${badge.tone}`}>
      {badge.label}
    </span>
  )

  let contentEl: React.ReactNode

  if (item.kind === 'harvest') {
    contentEl = <HarvestFeedItem item={item} onStopHarvest={onStopHarvest} />
  } else if (item.kind === 'status' && item.active) {
    contentEl = (
      <div className="info-feed__status-row">
        <span className="info-feed__pulse" aria-hidden />
        <FeedItemText item={item} />
      </div>
    )
  } else {
    contentEl = <FeedItemText item={item} />
  }

  const rowKindClass =
    item.kind === 'focus'
      ? 'info-feed__row--focus'
      : item.kind === 'dialogue'
        ? 'info-feed__row--dialogue'
        : item.kind === 'narrative'
          ? 'info-feed__row--narrative'
          : ''

  const moodClass = item.mood ? `info-feed__row--mood-${item.mood}` : ''

  return (
    <div
      className={`info-feed__row info-feed__row--${category} ${rowKindClass} ${moodClass} ${item.tone === 'warn' ? 'info-feed__row--warn' : ''} ${item.mood === 'danger' ? 'info-feed__row--danger' : ''}`}
    >
      {badgeEl}
      <div className={`info-feed__row-content ${itemClassName(item)}`}>
        {contentEl}
      </div>
    </div>
  )
}

export function CommandHubInfoFeed(props: CommandHubInfoFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeHarvest = findActiveHarvestEntry(props.timeline)
  const [activeTab, setActiveTab] = useState<'all' | 'world' | 'self' | 'system'>('all')

  const items = useMemo(
    () =>
      buildInfoFeed({
        timeline: props.timeline,
        objectives: props.objectives,
      }),
    [props.timeline, props.objectives],
  )

  const filteredItems = useMemo(() => {
    if (activeTab === 'all') return items
    return items.filter((item) => getItemCategory(item.kind) === activeTab)
  }, [items, activeTab])

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [filteredItems.length, props.timeline.length, activeHarvest?.harvestTotals, activeHarvest?.active])

  const isEmpty = filteredItems.length === 0

  return (
    <div className="info-feed-container">
      <div className="info-feed__tabs" role="tablist" aria-label="信息流过滤">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'all'}
          className={`info-feed__tab ${activeTab === 'all' ? 'info-feed__tab--active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          全部
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'world'}
          className={`info-feed__tab ${activeTab === 'world' ? 'info-feed__tab--active' : ''}`}
          onClick={() => setActiveTab('world')}
        >
          世界
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'self'}
          className={`info-feed__tab ${activeTab === 'self' ? 'info-feed__tab--active' : ''}`}
          onClick={() => setActiveTab('self')}
        >
          自己
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'system'}
          className={`info-feed__tab ${activeTab === 'system' ? 'info-feed__tab--active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          系统
        </button>
      </div>

      <div
        ref={scrollRef}
        className={`info-feed${isEmpty ? ' info-feed--empty' : ''}`}
        aria-label={PLAYER_COPY.infoFeedLabel}
      >
        {isEmpty ? (
          <p className="info-feed__empty">{PLAYER_COPY.chronicleEmpty}</p>
        ) : (
          filteredItems.map((item) => (
            <InfoFeedItemView
              key={item.id}
              item={item}
              onStopHarvest={item.active ? props.onStopHarvest : undefined}
            />
          ))
        )}
      </div>
    </div>
  )
}
