import { useEffect, useState } from 'react'
import { useGameSessionStore } from '../game/gameSessionStore'

export function AdrenalineOverlay() {
  const event = useGameSessionStore((state) => state.adrenalineEvent)
  const clear = useGameSessionStore((state) => state.clearAdrenalineEvent)
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (event) {
      setActive(true)
    } else {
      setActive(false)
    }
  }, [event])

  if (!event || !active) return null

  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'mythic':
        return '#ff4d6a' // Red
      case 'legendary':
      case 'divine':
        return '#ff9a2e' // Gold/Amber
      case 'epic':
      case 'mutated':
        return '#b06aff' // Purple
      case 'rare':
        return '#5a9fff' // Blue/Cyan
      default:
        return '#34d399' // Emerald Green
    }
  }

  const color = getRarityColor(event.rarity)

  return (
    <div
      className="screen-shake"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        overflow: 'hidden',
      }}
      onClick={clear}
    >
      {/*通天流光柱*/}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 'calc(50% - 120px)',
          width: '240px',
          height: '100%',
          background: `linear-gradient(to top, transparent, ${color}33, ${color}cc, ${color}33, transparent)`,
          pointerEvents: 'none',
          zIndex: 1,
          mixBlendMode: 'screen',
          animation: 'light-beam-rise 2.5s infinite linear',
        }}
      />

      {/*慢旋转灵气光轮*/}
      <div
        style={{
          position: 'absolute',
          width: '560px',
          height: '560px',
          borderRadius: '50%',
          border: `2px dashed ${color}33`,
          background: `radial-gradient(circle, ${color}0c 0%, transparent 70%)`,
          pointerEvents: 'none',
          zIndex: 0,
          animation: 'aura-spin 15s infinite linear',
        }}
      />

      {/*翻牌卡片*/}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '380px',
          backgroundColor: '#0a0d14',
          border: `2px solid ${color}`,
          borderRadius: '16px',
          padding: '28px',
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px ${color}44, inset 0 0 20px ${color}1a`,
          animation: 'card-reveal-flip 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
          textAlign: 'center',
          boxSizing: 'border-box',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/*卡片流光特效*/}
        <div
          style={{
            position: 'absolute',
            inset: '-2px',
            borderRadius: '16px',
            background: `linear-gradient(135deg, transparent, ${color}, transparent, ${color}, transparent)`,
            zIndex: -1,
            opacity: 0.4,
            pointerEvents: 'none',
          }}
        />

        {/*标题*/}
        <h2
          className="glow-text--gold"
          style={{
            margin: '0 0 6px 0',
            fontSize: '1.75rem',
            fontWeight: 800,
            letterSpacing: '2px',
            color: '#fff',
            textShadow: `0 0 10px ${color}, 0 0 20px ${color}66`,
          }}
        >
          {event.title}
        </h2>
        <p
          style={{
            margin: '0 0 24px 0',
            fontSize: '0.875rem',
            color: '#94a3b8',
            letterSpacing: '1px',
          }}
        >
          {event.subtitle}
        </p>

        {/*核心展示图标/文字*/}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '140px',
            backgroundColor: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '12px',
            marginBottom: '20px',
            padding: '16px',
            position: 'relative',
            boxSizing: 'border-box',
          }}
        >
          {event.type === 'skill' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* 经卷秘籍图标 */}
              <span
                style={{
                  fontSize: '2.5rem',
                  textShadow: '0 0 15px #eab308',
                  marginBottom: '8px',
                  animation: 'adventure-pulse 2s infinite alternate ease-in-out',
                }}
              >
                📜
              </span>
              <strong
                style={{
                  fontSize: '1.35rem',
                  color: '#fbbf24',
                  textShadow: '0 0 8px rgba(251, 191, 36, 0.4)',
                }}
              >
                《{event.name}》
              </strong>
              <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                传世绝学 · 终生受用
              </span>
            </div>
          )}

          {event.type === 'loot' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '2.5rem',
                  textShadow: `0 0 15px ${color}`,
                  marginBottom: '8px',
                }}
              >
                ⚔️
              </span>
              <strong style={{ fontSize: '1.35rem', color: color }}>{event.name}</strong>
              <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                稀有神兵 · 战力暴涨
              </span>
            </div>
          )}

          {(event.type === 'pet' || event.type === 'mutate') && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '2.5rem',
                  textShadow: `0 0 15px ${color}`,
                  marginBottom: '6px',
                }}
              >
                🐾
              </span>
              <strong style={{ fontSize: '1.35rem', color: color }}>{event.name}</strong>
              {event.skills && event.skills.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {event.skills.map((s, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.72rem',
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        border: `1px solid ${color}44`,
                        borderRadius: '4px',
                        padding: '1px 6px',
                        color: '#cbd5e1',
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/*中二文案描述*/}
        <p
          style={{
            margin: '0 0 28px 0',
            fontSize: '0.925rem',
            color: '#cbd5e1',
            lineHeight: 1.6,
            fontStyle: 'italic',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 8px',
          }}
        >
          {event.narrative}
        </p>

        {/*收下按钮*/}
        <button
          type="button"
          style={{
            width: '100%',
            padding: '12px',
            background: `linear-gradient(90deg, ${color}cc, ${color})`,
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1.05rem',
            fontWeight: 'bold',
            letterSpacing: '4px',
            cursor: 'pointer',
            boxShadow: `0 0 15px ${color}55`,
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.03)'
            e.currentTarget.style.boxShadow = `0 0 25px ${color}`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = `0 0 15px ${color}55`
          }}
          onClick={(e) => {
            e.stopPropagation()
            clear()
          }}
        >
          收 下
        </button>
      </div>
    </div>
  )
}
