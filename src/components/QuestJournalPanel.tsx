import { useGameSessionStore } from '../game/gameSessionStore'

export function QuestJournalPanel() {
  const playerState = useGameSessionStore((state) => state.playerState)
  const isSaving = useGameSessionStore((state) => state.isSaving)
  const refreshPlayerBounties = useGameSessionStore((state) => state.refreshPlayerBounties)
  const acceptPlayerBounty = useGameSessionStore((state) => state.acceptPlayerBounty)
  const claimPlayerBounty = useGameSessionStore((state) => state.claimPlayerBounty)

  if (!playerState) return null

  const { quest, storyState } = playerState
  const objectives = quest?.objectives ?? []
  const bounties = storyState?.bounties ?? []

  return (
    <div className="quest-journal side-panel scroll-panel">
      <span className="scroll-panel__corner scroll-panel__corner--tl" aria-hidden />
      <span className="scroll-panel__corner scroll-panel__corner--tr" aria-hidden />
      <span className="scroll-panel__corner scroll-panel__corner--bl" aria-hidden />
      <span className="scroll-panel__corner scroll-panel__corner--br" aria-hidden />
      {/* 主线任务 */}
      {quest && (
        <section className="quest-journal__section">
          <header className="quest-journal__section-header">
            <span className="quest-journal__badge quest-journal__badge--main">主线</span>
            <h3 className="quest-journal__title">{quest.title}</h3>
          </header>
          <div className="quest-journal__body">
            <p className="quest-journal__summary">{quest.summary}</p>
            <ul className="quest-journal__objectives">
              {objectives.map((obj, i) => (
                <li key={i} className="quest-journal__objective-item">
                  <span className="quest-journal__bullet">✦</span>
                  <span className="quest-journal__obj-text">{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 悬赏榜 */}
      <section className="quest-journal__section quest-journal__section--bounty">
        <header className="quest-journal__section-header">
          <span className="quest-journal__badge quest-journal__badge--bounty">悬赏</span>
          <h3 className="quest-journal__title">日常悬赏榜</h3>
          {bounties.length > 0 && (
            <button
              type="button"
              className="quest-journal__refresh-btn"
              disabled={isSaving}
              onClick={() => void refreshPlayerBounties()}
            >
              换一批
            </button>
          )}
        </header>

        <div className="quest-journal__body">
          {bounties.length === 0 ? (
            <div className="quest-journal__empty">
              <p>暂无悬赏任务，快揭榜刷新吧</p>
              <button
                type="button"
                className="quest-journal__action-btn"
                disabled={isSaving}
                onClick={() => void refreshPlayerBounties()}
              >
                揭榜刷新
              </button>
            </div>
          ) : (
            <ul className="quest-journal__bounty-list">
              {bounties.map((b) => (
                <li key={b.id} className={`quest-journal__bounty-card quest-journal__bounty-card--${b.status}`}>
                  <div className="quest-journal__bounty-header">
                    <span className="quest-journal__bounty-title">{b.title}</span>
                    <span className={`quest-journal__bounty-status quest-journal__bounty-status--${b.status}`}>
                      {b.status === 'available' && '待接取'}
                      {b.status === 'active' && `历练中 (${b.current}/${b.required})`}
                      {b.status === 'completed' && '已达成'}
                    </span>
                  </div>
                  <p className="quest-journal__bounty-desc">{b.description}</p>
                  <div className="quest-journal__bounty-footer">
                    <div className="quest-journal__bounty-rewards">
                      <span className="reward-item reward-item--exp">经验+{b.expReward}</span>
                      <span className="reward-item reward-item--gold">金币+{b.goldReward}</span>
                    </div>
                    {b.status === 'available' && (
                      <button
                        type="button"
                        className="quest-journal__card-action quest-journal__card-action--accept"
                        disabled={isSaving}
                        onClick={() => void acceptPlayerBounty(b.id)}
                      >
                        接取
                      </button>
                    )}
                    {b.status === 'completed' && (
                      <button
                        type="button"
                        className="quest-journal__card-action quest-journal__card-action--claim"
                        disabled={isSaving}
                        onClick={() => void claimPlayerBounty(b.id)}
                      >
                        交付
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
