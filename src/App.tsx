import { JourneyQuestModal } from './components/JourneyQuestModal'
import { PlayerCommandHub } from './components/PlayerCommandHub'
import { WorldMapPanel } from './components/WorldMapPanel'
import { QuestJournalPanel } from './components/QuestJournalPanel'
import { WorldMapTravelModal } from './components/WorldMapTravelModal'
import { BattleStage } from './components/battle/BattleStage'
import { CharacterStatsPanel } from './components/CharacterStatsPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { PlayerBattleSync } from './components/PlayerBattleSync'
import { SessionGate } from './components/SessionGate'
import { NarrativeOverlay } from './components/NarrativeOverlay'
import { AdrenalineOverlay } from './components/AdrenalineOverlay'
import { GameTopBar } from './components/GameTopBar'
import { GameplayToast } from './components/GameplayToast'
import { OnboardingOverlay } from './components/OnboardingOverlay'
import { useJourneyQuest } from './game/quest/useJourneyQuest'
import './styles/index.css'

function AppContent() {
  const { pendingNarratives, dismissNarratives } = useJourneyQuest()

  return (
    <div className="game-shell">
      <GameTopBar />

      <aside className="game-shell__sidebar side-rail">
        <WorldMapPanel />
        <QuestJournalPanel />
      </aside>

      <main className="game-shell__main player-workspace">
        <PlayerBattleSync />
        <section className="scene-viewport" aria-label="演武场景">
          <BattleStage />
        </section>
        <section className="decision-dock" aria-label="仙途决策">
          <PlayerCommandHub />
        </section>
      </main>

      <aside className="game-shell__right">
        <CharacterStatsPanel />
      </aside>

      <SettingsPanel />
      <JourneyQuestModal />
      <WorldMapTravelModal />
      <AdrenalineOverlay />
      <OnboardingOverlay />
      <GameplayToast />

      {pendingNarratives.length > 0 && (
        <NarrativeOverlay beats={pendingNarratives} onComplete={dismissNarratives} />
      )}
    </div>
  )
}

function App() {
  return (
    <SessionGate>
      <AppContent />
    </SessionGate>
  )
}

export default App
