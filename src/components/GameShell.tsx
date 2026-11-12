import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { BcRecord } from '../game/baicao'
import type { RoundRecord } from '../game/logic'
import { sfx } from '../game/sound'
import type { HistoryKey, SaveData } from '../game/storage'
import type { TxRecord } from '../game/taixiu'
import { AnimatedNumber } from './AnimatedNumber'
import { Button } from './Button'
import { PasswordDialog } from './PasswordDialog'
import { GAME_NAMES, GameMenu, type GameId } from './GameMenu'
import { BaiCao } from './games/BaiCao'
import { BauCua } from './games/BauCua'
import { TaiXiu } from './games/TaiXiu'

const sumNet = (h: { net: number }[]) => h.reduce((s, r) => s + r.net, 0)

interface Props {
  save: SaveData
  setBalance: (fn: (b: number) => number) => void
  push: <K extends HistoryKey>(key: K, r: SaveData[K][number]) => void
  onTopUp: () => void
  onReset: () => void
}

export function GameShell({ save, setBalance, push, onTopUp, onReset }: Props) {
  /** null = đang ở menu chọn game */
  const [game, setGame] = useState<GameId | null>(null)
  const [active, setActive] = useState(false)
  const [muted, setMuted] = useState(false)
  const [askReset, setAskReset] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [noMoney, setNoMoney] = useState(0)
  /** hết điểm mà bấm vào game -> hiện bảng mời nạp */
  const [broke, setBroke] = useState(false)

  useEffect(() => sfx.setMuted(muted), [muted])

  const warnNoMoney = useCallback(() => {
    sfx.error()
    setNoMoney((n) => n + 1)
  }, [])

  const doReset = () => {
    setAskReset(false)
    onReset()
    setResetKey((k) => k + 1)
    sfx.lose()
  }

  const common = { balance: save.balance, setBalance, onActiveChange: setActive, onNoMoney: warnNoMoney }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-auto flex min-h-screen max-w-6xl flex-col gap-2 px-2 py-2 sm:gap-4 sm:px-4 sm:py-4">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-3">
          {game && (
            <Button variant="ghost" className="px-3 text-sm" disabled={active} onClick={() => setGame(null)}>
              ← Menu
            </Button>
          )}
          <h1 className="gold-text font-display text-2xl drop-shadow sm:text-4xl">{game ? GAME_NAMES[game] : 'Game Vui Vẻ'}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <motion.div
            key={noMoney}
            animate={noMoney ? { x: [0, -8, 8, -6, 6, 0], backgroundColor: ['#7f1d1d', '#dc2626', '#7f1d1d'] } : {}}
            transition={{ duration: 0.45 }}
            className="flex items-center gap-2 rounded-full border-2 border-amber-400/70 bg-red-950/70 px-4 py-1.5 shadow-inner"
          >
            <span className="gold-text min-w-20 text-right text-xl font-extrabold tabular-nums">
              <AnimatedNumber value={save.balance} />
            </span>
          </motion.div>
          {/* Loa / nạp / reset: chỉ hiện ở menu chính */}
          {game === null && (
            <>
              <Button variant="ghost" className="px-3" onClick={() => setMuted((m) => !m)} aria-label="Bật/tắt âm thanh">
                {muted ? '🔇' : '🔊'}
              </Button>
              <Button variant="gold" className="px-3 text-sm" disabled={active} onClick={onTopUp}>
                + Nạp điểm
              </Button>
              <Button variant="red" className="px-3 text-sm" disabled={active} onClick={() => setAskReset(true)}>
                ⟲ Reset điểm
              </Button>
            </>
          )}
        </div>
      </header>

      {active && <p className="-mt-1 text-center text-xs text-amber-200/60">Đang trong ván — chơi xong ván mới về menu được</p>}

      <AnimatePresence mode="wait">
        <motion.div
          key={`${game ?? 'menu'}-${resetKey}`}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.2 }}
        >
          {game === null && (
            <GameMenu
              onPick={(id) => {
                if (save.balance <= 0) {
                  sfx.error()
                  setBroke(true)
                  return
                }
                sfx.chip()
                setGame(id)
              }}
              played={{
                baucua: { rounds: save.history.length, net: sumNet(save.history) },
                taixiu: { rounds: save.txHistory.length, net: sumNet(save.txHistory) },
                baicao: { rounds: save.bcHistory.length, net: sumNet(save.bcHistory) },
              }}
            />
          )}
          {game === 'baucua' && <BauCua {...common} history={save.history} pushHistory={(r: RoundRecord) => push('history', r)} />}
          {game === 'taixiu' && <TaiXiu {...common} history={save.txHistory} pushHistory={(r: TxRecord) => push('txHistory', r)} />}
          {game === 'baicao' && <BaiCao {...common} history={save.bcHistory} pushHistory={(r: BcRecord) => push('bcHistory', r)} />}
        </motion.div>
      </AnimatePresence>

      {/* Reset điểm — cần mật khẩu */}
      <AnimatePresence>
        {askReset && (
          <PasswordDialog
            title="Reset điểm"
            message="Toàn bộ điểm và lịch sử của cả 3 game sẽ về 0. Nhập mật khẩu để xác nhận."
            confirmLabel="Reset về 0"
            onSuccess={doReset}
            onClose={() => setAskReset(false)}
          />
        )}
      </AnimatePresence>

      {/* Hết điểm */}
      <AnimatePresence>
        {broke && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 grid place-items-center bg-black/70 px-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="max-w-sm rounded-3xl border-2 border-amber-400/60 bg-red-950 p-6 text-center shadow-2xl">
              <h2 className="gold-text font-display text-3xl">Hết điểm rồi!</h2>
              <p className="mt-2 text-amber-100/80">Nhập mật khẩu để nạp thêm điểm và chơi tiếp.</p>
              <div className="mt-5 flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => setBroke(false)}>
                  Đóng
                </Button>
                <Button className="flex-1" onClick={onTopUp}>
                  + Nạp điểm
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
