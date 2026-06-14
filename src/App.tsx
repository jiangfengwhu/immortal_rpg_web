import { BattleHud } from './components/battle/BattleHud'
import { BattleScene } from './components/battle/BattleScene'
import './styles/global.css'

function App() {
  return (
    <div className="game-shell">
      <BattleScene />
      <BattleHud />
    </div>
  )
}

export default App
