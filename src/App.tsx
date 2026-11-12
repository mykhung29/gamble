import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { GameShell } from './components/GameShell'
import { GrantScreen } from './components/GrantScreen'
import { LoginScreen } from './components/LoginScreen'
import { type HistoryKey, type SaveData, emptySave, loadSave, persist } from './game/storage'

type Screen = 'login' | 'grant' | 'game'

export default function App() {
  const [save, setSave] = useState<SaveData>(loadSave)
  const [screen, setScreen] = useState<Screen>('login')
  /** true = đã vào bàn trong phiên này (cho phép quay lại bàn từ màn mật khẩu) */
  const [inSession, setInSession] = useState(false)

  useEffect(() => persist(save), [save])

  const setBalance = useCallback((fn: (b: number) => number) => setSave((s) => ({ ...s, balance: Math.max(0, fn(s.balance)) })), [])
  const push = useCallback(
    <K extends HistoryKey>(key: K, r: SaveData[K][number]) => setSave((s) => ({ ...s, [key]: [r, ...s[key]].slice(0, 30) }) as SaveData),
    [],
  )

  const enterGame = () => {
    setInSession(true)
    setScreen('game')
  }

  return (
    <AnimatePresence mode="wait">
      {screen === 'login' && (
        <LoginScreen key="login" onSuccess={() => setScreen('grant')} onBack={inSession && save.balance > 0 ? () => setScreen('game') : undefined} />
      )}
      {screen === 'grant' && (
        <GrantScreen
          key="grant"
          balance={save.balance}
          onGrant={(n) => {
            setBalance((b) => b + n)
            enterGame()
          }}
          onSkip={save.balance > 0 ? enterGame : undefined}
        />
      )}
      {screen === 'game' && (
        <GameShell
          key="game"
          save={save}
          setBalance={setBalance}
          push={push}
          onTopUp={() => setScreen('login')}
          onLogout={() => {
            setInSession(false)
            setScreen('login')
          }}
          onReset={() => setSave(emptySave())}
        />
      )}
    </AnimatePresence>
  )
}
