import {
  BOSS_ANIMATION_LABELS,
  BOSS_ANIMATION_ORDER,
} from '../game/boss.constants'
import { useBossStore } from '../game/bossStore'

export function BossPanel() {
  const availableAnimations = useBossStore((state) => state.availableAnimations)
  const currentAnimation = useBossStore((state) => state.currentAnimation)
  const playAnimation = useBossStore((state) => state.playAnimation)

  const animations = BOSS_ANIMATION_ORDER.filter((name) =>
    availableAnimations.length === 0 ? true : availableAnimations.includes(name),
  )

  return (
    <aside className="side-panel side-panel--left">
      <div className="side-panel__header">
        <p className="side-panel__eyebrow">试炼 · Boss</p>
        <h2>龙王</h2>
      </div>

      <p className="side-panel__desc">Boss_long 动作预览，点击切换动画。</p>

      <div className="side-panel__actions">
        {animations.map((animation) => (
          <button
            key={animation}
            type="button"
            className={
              currentAnimation === animation
                ? 'side-panel__action side-panel__action--active'
                : 'side-panel__action'
            }
            onClick={() => playAnimation(animation)}
          >
            {BOSS_ANIMATION_LABELS[animation] ?? animation}
          </button>
        ))}
      </div>

      {availableAnimations.length > 0 && (
        <p className="side-panel__meta">当前：{BOSS_ANIMATION_LABELS[currentAnimation] ?? currentAnimation}</p>
      )}
    </aside>
  )
}
