import { useState } from 'react'

type CharacterPanelTab = 'bag' | 'combat' | 'talent' | 'resist' | 'pets' | 'spells'

type CharacterPanelTabsProps = {
  bag: React.ReactNode
  combat: React.ReactNode
  talent: React.ReactNode
  resist: React.ReactNode
  pets: React.ReactNode
  spells: React.ReactNode
}

const TAB_LABELS: Record<CharacterPanelTab, string> = {
  bag: '行囊',
  combat: '属性',
  talent: '加点',
  resist: '法抗',
  pets: '灵宠',
  spells: '绝学',
}

const TAB_ORDER: CharacterPanelTab[] = ['bag', 'combat', 'talent', 'resist', 'pets', 'spells']

export function CharacterPanelTabs({ bag, combat, talent, resist, pets, spells }: CharacterPanelTabsProps) {
  const [activeTab, setActiveTab] = useState<CharacterPanelTab>('bag')

  const panels: Record<CharacterPanelTab, React.ReactNode> = {
    bag,
    combat,
    talent,
    resist,
    pets,
    spells,
  }

  return (
    <div className="character-panel__tabs">
      <div
        className="character-panel__tab-list"
        role="tablist"
        aria-label="角色信息"
      >
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

