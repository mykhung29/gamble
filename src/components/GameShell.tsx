import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { BcRecord } from '../game/baicao'
import type { RoundRecord } from '../game/logic'
import { sfx } from '../game/sound'
import type { HistoryKey, Hold, SaveData } from '../game/storage'
import type { TxRecord } from '../game/taixiu'
import type { XsRecord } from '../game/xoso'
import type { PkRecord } from '../game/penalty'
import type { CupRecord } from '../game/cups'
import type { HrRecord } from '../game/horses'
import { AnimatedNumber } from './AnimatedNumber'
import { Button } from './Button'
import { Modal } from './Modal'
import { PasswordDialog } from './PasswordDialog'
import { GAME_NAMES, GameMenu, type GameId } from './GameMenu'
import { BaiCao } from './games/BaiCao'
import { BauCua } from './games/BauCua'
import { TaiXiu } from './games/TaiXiu'
import { XoSo } from './games/XoSo'
import { Penalty } from './games/Penalty'
import { DoanLy } from './games/DoanLy'
import { DuaNgua } from './games/DuaNgua'

const sumNet = (h: { net: number }[]) => h.reduce((s, r) => s + r.net, 0)

/** game chơi màn hình ngang */
const LANDSCAPE: GameId[] = ['duangua']

type LockableOrientation = ScreenOrientation & { lock?: (o: string) => Promise<void>; unlock?: () => void }

/**
 * Điện thoại: xin toàn màn hình rồi khoá xoay ngang (Android Chrome làm được).
 * Máy không cho khoá (iPhone) thì CSS .force-landscape tự xoay giao diện 90°.
 * Phải gọi ngay trong sự kiện bấm, trình duyệt mới cho phép.
 */
function lockLandscape() {
  if (!window.matchMedia('(pointer: coarse)').matches) return
  document.documentElement
    .requestFullscreen?.()
    .then(() => (screen.orientation as LockableOrientation).lock?.('landscape'))
    .catch(() => {})
}

function unlockLandscape() {
  try {
    ;(screen.orientation as LockableOrientation).unlock?.()
  } catch {
    /* ignore */
  }
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
}

interface Props {
  save: SaveData
  setBalance: (fn: (b: number) => number) => void
  push: <K extends HistoryKey>(key: K, r: SaveData[K][number]) => void
  hold: (key: HistoryKey, h: Hold | null) => void
  onTopUp: () => void
  onReset: () => void
}

export function GameShell({ save, setBalance, push, hold, onTopUp, onReset }: Props) {
  /** null = đang ở menu chọn game */
  const [game, setGame] = useState<GameId | null>(null)
  const [active, setActive] = useState(false)
  const [askReset, setAskReset] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [noMoney, setNoMoney] = useState(0)
  /** hết điểm mà bấm vào game -> hiện bảng mời nạp */
  const [broke, setBroke] = useState(false)

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`flex min-h-screen flex-col ${game && LANDSCAPE.includes(game) ? 'force-landscape' : ''}`}>
      {/* Thanh trên cùng */}
      <header className="app-header sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-2 px-2 sm:h-14 sm:px-4 short:h-10">
          <div className="flex min-w-0 items-center gap-3">
            {game ? (
              <button
                disabled={active}
                onClick={() => {
                  unlockLandscape()
                  setGame(null)
                }}
                className="flex h-8 items-center gap-1.5 rounded-sm border border-line px-2.5 text-xs font-medium text-mute transition-colors hover:border-line-strong hover:text-ink disabled:opacity-40"
              >
                <span aria-hidden>‹</span> Sảnh
              </button>
            ) : (
              <span className="grid size-7 shrink-0 place-items-center rounded-sm bg-gold text-sm font-bold text-white">G</span>
            )}
            <div className="flex min-w-0 items-baseline gap-2">
              <h1 className={`truncate text-sm font-semibold tracking-wide uppercase sm:block sm:text-base ${game ? '' : 'hidden'}`}>{game ? GAME_NAMES[game] : 'Game Vui Vẻ'}</h1>
              {!game && <span className="hidden text-xs text-dim sm:inline">Sảnh trò chơi</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.div
              key={noMoney}
              animate={noMoney ? { x: [0, -6, 6, -4, 4, 0] } : {}}
              transition={{ duration: 0.4 }}
              className={`flex h-9 items-center gap-3 rounded-sm border px-2.5 sm:px-3 ${noMoney ? 'border-down/60' : 'border-line'} bg-panel`}
            >
              <span className="label hidden sm:inline">Số dư</span>
              <span className="text-right text-base font-semibold text-gold tabular-nums sm:min-w-16">
                <AnimatedNumber value={save.balance} />
              </span>
            </motion.div>
            {/* Nạp / reset: chỉ hiện ở sảnh */}
            {game === null && (
              <>
                <Button variant="gold" className="max-[359px]:px-2 max-[359px]:text-xs" disabled={active} onClick={onTopUp}>
                  Nạp điểm
                </Button>
                <Button variant="ghost" className="max-[359px]:px-2 max-[359px]:text-xs" disabled={active} onClick={() => setAskReset(true)}>
                  Đổi điểm
                </Button>
              </>
            )}
          </div>
        </div>
        {active && <div className="border-t border-line bg-panel py-1 text-center text-xs text-mute short:hidden">Đang trong ván — kết thúc ván để quay lại sảnh</div>}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 p-2 sm:p-4 short:p-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${game ?? 'menu'}-${resetKey}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
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
                  if (LANDSCAPE.includes(id)) lockLandscape()
                  setGame(id)
                }}
                played={{
                  baucua: { rounds: save.history.length, net: sumNet(save.history) },
                  taixiu: { rounds: save.txHistory.length, net: sumNet(save.txHistory) },
                  baicao: { rounds: save.bcHistory.length, net: sumNet(save.bcHistory) },
                  xoso: { rounds: save.xsHistory.length, net: sumNet(save.xsHistory) },
                  penalty: { rounds: save.pkHistory.length, net: sumNet(save.pkHistory) },
                  doanly: { rounds: save.cupHistory.length, net: sumNet(save.cupHistory) },
                  duangua: { rounds: save.hrHistory.length, net: sumNet(save.hrHistory) },
                }}
              />
            )}
            {game === 'baucua' && <BauCua {...common} history={save.history} pushHistory={(r: RoundRecord) => push('history', r)} hold={(h) => hold('history', h)} />}
            {game === 'taixiu' && <TaiXiu {...common} history={save.txHistory} pushHistory={(r: TxRecord) => push('txHistory', r)} hold={(h) => hold('txHistory', h)} />}
            {game === 'baicao' && <BaiCao {...common} history={save.bcHistory} pushHistory={(r: BcRecord) => push('bcHistory', r)} hold={(h) => hold('bcHistory', h)} />}
            {game === 'doanly' && <DoanLy {...common} history={save.cupHistory} pushHistory={(r: CupRecord) => push('cupHistory', r)} hold={(h) => hold('cupHistory', h)} />}
            {game === 'penalty' && <Penalty {...common} history={save.pkHistory} pushHistory={(r: PkRecord) => push('pkHistory', r)} hold={(h) => hold('pkHistory', h)} />}
            {game === 'duangua' && <DuaNgua {...common} history={save.hrHistory} pushHistory={(r: HrRecord) => push('hrHistory', r)} hold={(h) => hold('hrHistory', h)} />}
            {game === 'xoso' && <XoSo {...common} history={save.xsHistory} pushHistory={(r: XsRecord) => push('xsHistory', r)} hold={(h) => hold('xsHistory', h)} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Reset điểm — cần mật khẩu */}
      <AnimatePresence>
        {askReset && (
          <PasswordDialog
            title="Reset điểm"
            message="Toàn bộ điểm và lịch sử của tất cả game sẽ về 0. Nhập mật khẩu để xác nhận."
            confirmLabel="Reset về 0"
            onSuccess={doReset}
            onClose={() => setAskReset(false)}
          />
        )}
      </AnimatePresence>

      {/* Hết điểm */}
      <AnimatePresence>
        {broke && (
          <Modal onClose={() => setBroke(false)} title="Số dư bằng 0">
            <p className="text-sm text-mute">Nạp thêm điểm để tiếp tục chơi.</p>
            <div className="mt-5 flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setBroke(false)}>
                Đóng
              </Button>
              <Button className="flex-1" onClick={onTopUp}>
                Nạp điểm
              </Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

