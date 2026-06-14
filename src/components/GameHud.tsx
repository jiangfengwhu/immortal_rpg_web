import { usePlayerStore } from '../game/playerStore'

export function GameHud() {
  const isMoving = usePlayerStore((state) => state.isMoving)
  const availableAnimations = usePlayerStore((state) => state.availableAnimations)
  const currentAnimation = usePlayerStore((state) => state.currentAnimation)

  return (
    <div className="game-hud">
      <header className="game-hud__title">
        <p className="game-hud__eyebrow">开箱修仙 · MVP</p>
        <h1>云岚仙途</h1>
      </header>

      <footer className="game-hud__controls">
        <div className="game-hud__panel">
          <p className="game-hud__hint">W A S D 移动角色</p>
          <p className="game-hud__hint game-hud__hint--sub">
            移动时播放 idle（资源无 walk/run，脚不动属正常）
          </p>
          <p className="game-hud__hint game-hud__hint--sub">
            动作：1 idle · 2 skill1（火焰） · 3 death
          </p>
          {availableAnimations.length > 0 && (
            <p className="game-hud__hint game-hud__hint--sub">
              资源动作：{availableAnimations.join(' / ')}
            </p>
          )}
        </div>
        <p className="game-hud__status">
          {isMoving ? '御风而行' : '静修待机'} · {currentAnimation}
        </p>
      </footer>
    </div>
  )
}
