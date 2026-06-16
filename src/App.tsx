import { JourneyQuestModal } from './components/JourneyQuestModal'
import { OnboardingOverlay } from './components/OnboardingOverlay'
import { PlayerCommandHub } from './components/PlayerCommandHub'
import { WorldMapPanel } from './components/WorldMapPanel'
import { WorldMapTravelModal } from './components/WorldMapTravelModal'
import { BattleStage } from './components/battle/BattleStage'
import { CharacterStatsPanel } from './components/CharacterStatsPanel'
import { InventoryPanel } from './components/InventoryPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { PlayerBattleSync } from './components/PlayerBattleSync'
import { SessionGate } from './components/SessionGate'
import './styles/global.css'

function App() {
  return (
    <SessionGate>
      <div className="game-shell">
        <aside className="game-shell__sidebar side-rail">
          <WorldMapPanel />
          <CharacterStatsPanel />
        </aside>
        <main className="game-shell__main player-workspace">
          <PlayerBattleSync />
          <BattleStage />
          <PlayerCommandHub />
        </main>
        <InventoryPanel />
        <SettingsPanel />
        <JourneyQuestModal />
        <WorldMapTravelModal />
        <OnboardingOverlay />
      </div>
    </SessionGate>
  )
}

export default App
