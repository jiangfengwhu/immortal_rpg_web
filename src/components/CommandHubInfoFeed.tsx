import { useLayoutEffect, useMemo, useRef } from 'react'

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
      <p className={itemClassName(item)}>
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
      </p>
    )
  }

  return (
    <p className={itemClassName(item)}>
      <FeedItemText item={item} />
    </p>
  )
}

function InfoFeedItemView({
  item,
  onStopHarvest,
}: {
  item: InfoFeedItem
  onStopHarvest?: (sessionId: string) => void
}) {
  if (item.kind === 'harvest') {
    return <HarvestFeedItem item={item} onStopHarvest={onStopHarvest} />
  }

  if (item.kind === 'status' && item.active) {
    return (
      <p className={itemClassName(item)}>
        <span className="info-feed__pulse" aria-hidden />
        <FeedItemText item={item} />
      </p>
    )
  }

  return (
    <p className={itemClassName(item)}>
      <FeedItemText item={item} />
    </p>
  )
}

export function CommandHubInfoFeed(props: CommandHubInfoFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeHarvest = findActiveHarvestEntry(props.timeline)

  const items = useMemo(
    () =>
      buildInfoFeed({
        timeline: props.timeline,
        objectives: props.objectives,
      }),
    [props.timeline, props.objectives],
  )

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [items.length, props.timeline.length, activeHarvest?.harvestTotals, activeHarvest?.active])

  const isEmpty = items.length === 0

  return (
    <div
      ref={scrollRef}
      className={`info-feed${isEmpty ? ' info-feed--empty' : ''}`}
      aria-label={PLAYER_COPY.infoFeedLabel}
    >
      {isEmpty ? (
        <p className="info-feed__empty">{PLAYER_COPY.chronicleEmpty}</p>
      ) : (
        items.map((item) => (
          <InfoFeedItemView
            key={item.id}
            item={item}
            onStopHarvest={item.active ? props.onStopHarvest : undefined}
          />
        ))
      )}
    </div>
  )
}
