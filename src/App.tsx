import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { GameShell } from './components/GameShell'
import { GrantScreen } from './components/GrantScreen'
import { LoginScreen } from './components/LoginScreen'
import { type HistoryKey, type Hold, type SaveData, emptySave, loadSave, persist } from './game/storage'

type Screen = 'login' | 'grant' | 'game'

export default function App() {
  const [save, setSave] = useState<SaveData>(loadSave)
  /** Mở web là vào menu game luôn; chỉ khi bấm Nạp điểm mới hỏi mật khẩu */
  const [screen, setScreen] = useState<Screen>('game')

  useEffect(() => persist(save), [save])

  const setBalance = useCallback((fn: (b: number) => number) => setSave((s) => ({ ...s, balance: Math.max(0, fn(s.balance)) })), [])
  const push = useCallback(
    <K extends HistoryKey>(key: K, r: SaveData[K][number]) => setSave((s) => ({ ...s, [key]: [r, ...s[key]].slice(0, 30) }) as SaveData),
    [],
  )

  /** Ghi / xoá tiền treo của 1 game (lưu cùng lúc với điểm nên tải lại trang không mất) */
  const hold = useCallback(
    (key: HistoryKey, h: Hold | null) =>
      setSave((s) => {
        const pending = { ...s.pending }
        if (h) pending[key] = h
        else delete pending[key]
        return { ...s, pending }
      }),
    [],
  )

  const enterGame = () => setScreen('game')

  return (
    <AnimatePresence mode="wait">
      {screen === 'login' && (
        <LoginScreen key="login" onSuccess={() => setScreen('grant')} onBack={enterGame} />
      )}
      {screen === 'grant' && (
        <GrantScreen
          key="grant"
          balance={save.balance}
          onGrant={(n) => {
            setBalance((b) => b + n)
            enterGame()
          }}
          onSkip={enterGame}
        />
      )}
      {screen === 'game' && (
        <GameShell
          key="game"
          save={save}
          setBalance={setBalance}
          push={push}
          hold={hold}
          onTopUp={() => setScreen('login')}
          onReset={() => setSave(emptySave())}
        />
      )}
    </AnimatePresence>
  )
}
