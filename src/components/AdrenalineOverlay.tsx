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

  // 品级色 · 水墨淡彩（实色 hex，用于 alpha 后缀拼接）
  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'mythic':
        return '#9c3a30' // 朱砂
      case 'legendary':
      case 'divine':
        return '#8a6a3a' // 赭金
      case 'epic':
      case 'mutated':
        return '#6a5a7a' // 淡墨紫
      case 'rare':
        return '#4a6874' // 花青
      default:
        return '#4a7a64' // 苍翠
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
        backgroundColor: 'rgba(54, 48, 42, 0.72)',
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
          background: `linear-gradient(to top, transparent, ${color}33, ${color}aa, ${color}33, transparent)`,
          pointerEvents: 'none',
          zIndex: 1,
          mixBlendMode: 'multiply',
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
          border: `2px dashed ${color}40`,
          background: `radial-gradient(circle, ${color}12 0%, transparent 70%)`,
          pointerEvents: 'none',
          zIndex: 0,
          animation: 'aura-spin 15s infinite linear',
        }}
      />

      {/*翻牌卡片 · 宣纸卷轴*/}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '380px',
          backgroundColor: 'var(--paper-white)',
          border: `2px solid ${color}`,
          borderRadius: '12px',
          padding: '28px',
          boxShadow: `0 20px 60px rgba(42, 38, 34, 0.25), 0 0 30px ${color}44, inset 0 0 20px ${color}14`,
          animation: 'card-reveal-flip 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
          textAlign: 'center',
          boxSizing: 'border-box',
          fontFamily: 'var(--font-serif)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/*卡片流光特效*/}
        <div
          style={{
            position: 'absolute',
            inset: '-2px',
            borderRadius: '12px',
            background: `linear-gradient(135deg, transparent, ${color}, transparent, ${color}, transparent)`,
            zIndex: -1,
            opacity: 0.3,
            pointerEvents: 'none',
          }}
        />

        {/*标题*/}
        <h2
          style={{
            margin: '0 0 6px 0',
            fontSize: '1.75rem',
            fontWeight: 800,
            letterSpacing: '2px',
            color: 'var(--ink-deep)',
            textShadow: `0 0 10px ${color}55`,
          }}
        >
          {event.title}
        </h2>
        <p
          style={{
            margin: '0 0 24px 0',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
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
            backgroundColor: 'rgba(54, 48, 42, 0.04)',
            border: '1px solid var(--ink-stroke)',
            borderRadius: '10px',
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
                  textShadow: `0 0 15px ${color}88`,
                  marginBottom: '8px',
                  animation: 'adventure-pulse 2s infinite alternate ease-in-out',
                }}
              >
                📜
              </span>
              <strong
                style={{
                  fontSize: '1.35rem',
                  color: 'var(--gold-600)',
                  textShadow: `0 0 8px ${color}66`,
                }}
              >
                《{event.name}》
              </strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
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
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
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
                        backgroundColor: 'rgba(54, 48, 42, 0.05)',
                        border: `1px solid ${color}55`,
                        borderRadius: '4px',
                        padding: '1px 6px',
                        color: 'var(--text-secondary)',
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
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
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

        {/*收下按钮 · 朱砂落墨*/}
        <button
          type="button"
          style={{
            width: '100%',
            padding: '12px',
            background: `linear-gradient(90deg, ${color}dd, ${color})`,
            color: 'var(--paper-white)',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1.05rem',
            fontWeight: 'bold',
            letterSpacing: '4px',
            cursor: 'pointer',
            boxShadow: `0 2px 10px ${color}55`,
            transition: 'transform 0.15s, box-shadow 0.15s',
            fontFamily: 'var(--font-serif)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.03)'
            e.currentTarget.style.boxShadow = `0 4px 16px ${color}`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = `0 2px 10px ${color}55`
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
