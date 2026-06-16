import { useState } from 'react'

type CharacterPanelTab = 'combat' | 'talent' | 'resist'

type CharacterPanelTabsProps = {
  combat: React.ReactNode
  talent: React.ReactNode
  resist: React.ReactNode
}

const TAB_LABELS: Record<CharacterPanelTab, string> = {
  combat: '战体',
  talent: '天赋',
  resist: '法抗',
}

const TAB_ORDER: CharacterPanelTab[] = ['combat', 'talent', 'resist']

export function CharacterPanelTabs({ combat, talent, resist }: CharacterPanelTabsProps) {
  const [activeTab, setActiveTab] = useState<CharacterPanelTab>('combat')

  const panels: Record<CharacterPanelTab, React.ReactNode> = {
    combat,
    talent,
    resist,
  }

  return (
    <div className="character-panel__tabs">
      <div className="character-panel__tab-list" role="tablist" aria-label="角色信息">
        {TAB_ORDER.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={
              activeTab === tab
                ? 'character-panel__tab character-panel__tab--active'
                : 'character-panel__tab'
            }
            onClick={() => setActiveTab(tab)}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>
      <div className="character-panel__tab-panel" role="tabpanel">
        {panels[activeTab]}
      </div>
    </div>
  )
}
