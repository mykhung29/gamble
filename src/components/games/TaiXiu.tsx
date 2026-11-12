import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { SHAKE_MS, TX_BAO_PAYOUT } from '../../config'
import { fmt } from '../../format'
import { sfx } from '../../game/sound'
import {
  type TxBets,
  type TxDice,
  type TxRecord,
  type TxResult,
  type TxSide,
  diceSum,
  emptyTxBets,
  rollTx,
  settleTx,
  sumTx,
  txOutcome,
} from '../../game/taixiu'
import { BetDialog } from '../BetDialog'
import { Bowl, DieShell, type Phase } from '../Bowl'
import { Button } from '../Button'
import { CoinRain } from '../CoinRain'
import { RoundTimer } from '../RoundTimer'
import { StatusBanner } from '../StatusBanner'
import { type GameProps, useAutoRounds, useReportActive } from './shared'

const STATUS: Record<Phase, string> = {
  idle: 'Chuẩn bị lắc...',
  shaking: 'Đang lắc...',
  betting: 'Chọn Tài / Xỉu / Bão để đặt cược — hết giờ sẽ tự khui',
  revealed: '',
}

const SIDES: Record<TxSide, { title: string; sub: string; tile: string; text: string }> = {
  tai: { title: 'TÀI', sub: 'Tổng 11 – 17 · 1 ăn 1', tile: 'from-red-500 to-red-900', text: 'text-amber-50' },
  xiu: { title: 'XỈU', sub: 'Tổng 4 – 10 · 1 ăn 1', tile: 'from-slate-100 to-slate-400', text: 'text-slate-900' },
  bao: { title: 'BÃO', sub: `3 con giống nhau · 1 ăn ${TX_BAO_PAYOUT}`, tile: 'from-amber-400 to-orange-700', text: 'text-red-950' },
}

/** Vị trí chấm trên lưới 3x3 */
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [2, 6],
  3: [2, 4, 6],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

export function PipFace({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' }) {
  const red = value === 1 || value === 4
  const dot = size === 'sm' ? 'size-1' : value === 1 ? 'size-5' : 'size-3'
  return (
    <div className={`grid size-full grid-cols-3 grid-rows-3 ${size === 'sm' ? 'p-0.5' : 'p-2'}`}>
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className={`m-auto rounded-full ${dot} ${PIPS[value].includes(i) ? (red ? 'bg-red-600' : 'bg-zinc-900') : ''}`} />
      ))}
    </div>
  )
}

function SideTile({
  side,
  amount,
  won,
  lost,
  payout,
  locked,
  compact,
  onClick,
}: {
  side: TxSide
  amount: number
  won: boolean
  lost: boolean
  payout: number
  locked: boolean
  compact?: boolean
  onClick: () => void
}) {
  const s = SIDES[side]
  return (
    <motion.button
      onClick={onClick}
      whileHover={locked ? undefined : { y: -4 }}
      whileTap={locked ? undefined : { scale: 0.97 }}
      animate={won ? { scale: [1, 1.06, 1] } : { scale: 1 }}
      transition={won ? { duration: 0.5, repeat: 2 } : undefined}
      className={`relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border-4 bg-gradient-to-br shadow-xl transition-[filter,opacity] ${s.tile} ${
        compact ? 'py-3' : 'aspect-[4/3]'
      } ${won ? 'z-10 border-yellow-300 shadow-[0_0_35px_rgba(250,204,21,.75)]' : 'border-amber-200/30'} ${lost ? 'opacity-45 grayscale-[.7]' : ''} ${
        locked ? 'cursor-default' : 'cursor-pointer'
      }`}
    >
      <div className="pattern absolute inset-0 opacity-50" />
      <span className={`relative font-display drop-shadow ${compact ? 'text-3xl' : 'text-5xl sm:text-6xl'} ${s.text}`}>{s.title}</span>
      <span className={`relative text-xs font-semibold opacity-80 sm:text-sm ${s.text}`}>{s.sub}</span>

      <AnimatePresence>
        {amount > 0 && (
          <motion.div
            key={amount}
            initial={{ scale: 1.5, y: -6 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full border-2 border-amber-200 bg-zinc-900/85 py-0.5 pr-2.5 pl-1 text-sm font-extrabold text-amber-300 shadow-lg"
          >
            <span className="size-4 rounded-full border-2 border-dashed border-amber-300 bg-red-600" />
            {fmt(amount)}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {won && payout > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: [0, 1, 1, 0], y: -40 }}
            transition={{ duration: 1.8, delay: 0.5 }}
            className="pointer-events-none absolute inset-x-0 top-1/3 text-center text-2xl font-extrabold text-yellow-200 drop-shadow-[0_2px_2px_rgba(0,0,0,.8)]"
          >
            +{fmt(payout)}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

export function TaiXiu({ balance, setBalance, history, pushHistory, onActiveChange, onNoMoney }: GameProps<TxRecord>) {
  const [bets, setBets] = useState<TxBets>(emptyTxBets)
  const [phase, setPhase] = useState<Phase>('idle')
  const [dice, setDice] = useState<TxDice | null>(null)
  const [roundId, setRoundId] = useState(0)
  const [result, setResult] = useState<TxResult | null>(null)
  const [editing, setEditing] = useState<TxSide | null>(null)
  const revealing = useRef(false)

  const totalBet = sumTx(bets)
  const betting = phase === 'betting'
  const revealed = phase === 'revealed'
  useReportActive(betting && totalBet > 0, onActiveChange)
  /** Lắc xong -> mở cược. Đặt trong effect để StrictMode/unmount không làm kẹt ở 'shaking' */
  useEffect(() => {
    if (phase !== 'shaking') return
    const t = window.setTimeout(() => setPhase('betting'), SHAKE_MS)
    return () => window.clearTimeout(t)
  }, [phase])
  useEffect(() => {
    if (!revealed) revealing.current = false
  }, [revealed])

  const roll = () => {
    if (phase !== 'idle' && !revealed) return
    setBets(emptyTxBets())
    setResult(null)
    setDice(null)
    setRoundId((r) => r + 1)
    setPhase('shaking')
    sfx.shake(SHAKE_MS)
  }

  const openBet = (side: TxSide) => {
    if (!betting) return
    sfx.chip()
    setEditing(side)
  }

  const confirmBet = (amount: number) => {
    if (!editing) return
    const delta = amount - bets[editing]
    if (delta > balance) return onNoMoney()
    setBalance((b) => b - delta)
    setBets({ ...bets, [editing]: amount })
    setEditing(null)
    if (amount > 0) sfx.chip()
    else sfx.remove()
  }

  const clearBets = () => {
    if (!betting || !totalBet) return
    setBalance((b) => b + totalBet)
    setBets(emptyTxBets())
    sfx.remove()
  }

  /** Khui (tự động khi hết giờ) — lúc này mới gieo xúc xắc */
  const reveal = () => {
    if (!betting || revealing.current) return
    revealing.current = true
    const d = rollTx()
    const r = settleTx(bets, d)
    setEditing(null)
    setDice(d)
    setResult(r)
    setPhase('revealed')
    if (r.payout) setBalance((b) => b + r.payout)
    pushHistory({ dice: d, bet: r.totalBet, net: r.net, at: Date.now() })
    sfx.open()
    window.setTimeout(() => (r.net > 0 ? sfx.win(r.win.bao || r.net >= r.totalBet * 2) : r.net < 0 ? sfx.lose() : undefined), 500)
  }

  const left = useAutoRounds(phase, roll, reveal)

  const shown: TxDice = dice ?? [1, 1, 1]
  const outcome = dice ? txOutcome(dice) : null
  const outcomeLabel = dice ? `${SIDES[txOutcome(dice)].title} ${diceSum(dice)}` : undefined
  const tile = (side: TxSide, compact?: boolean) => (
    <SideTile
      side={side}
      compact={compact}
      amount={bets[side]}
      won={revealed && !!result?.win[side]}
      lost={revealed && bets[side] > 0 && !result?.win[side]}
      payout={result?.perSide[side] ?? 0}
      locked={!betting}
      onClick={() => openBet(side)}
    />
  )

  // Cầu: cũ bên trái, mới bên phải
  const road = [...history].reverse().slice(-30)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <section className="flex flex-col items-center gap-4 rounded-3xl border border-amber-400/20 bg-black/20 p-5">
          <div className="relative pt-6 pb-3">
            <Bowl
              phase={phase}
              overlay={<RoundTimer phase={phase} left={left} />}
              hint={betting ? 'Đã lắc xong — mời đặt cược' : undefined}
              dice={[0, 1, 2].map((i) => (
                <DieShell key={`${roundId}-${i}`} index={i} revealed>
                  <PipFace value={shown[i]} />
                </DieShell>
              )) as [React.ReactNode, React.ReactNode, React.ReactNode]}
            />
            <AnimatePresence>
              {revealed && dice && (
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: -6 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', delay: 0.8 }}
                  className={`absolute -top-1 -right-2 grid size-20 place-items-center rounded-full border-4 border-yellow-300 font-display text-3xl shadow-xl ${
                    outcome === 'tai' ? 'bg-red-600 text-white' : outcome === 'xiu' ? 'bg-slate-100 text-slate-900' : 'bg-amber-400 text-red-950'
                  }`}
                >
                  {diceSum(dice)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <StatusBanner result={revealed && result ? { net: result.net, label: outcomeLabel, noBet: !result.totalBet } : null} text={STATUS[phase]} />
        </section>

        <section className="flex flex-col gap-4">
          <div
            className={`pattern flex flex-col gap-3 rounded-3xl border-4 bg-red-900/60 p-3 shadow-2xl transition-colors sm:gap-4 sm:p-4 ${
              betting ? 'border-yellow-300 shadow-[0_0_40px_rgba(250,204,21,.35)]' : 'border-amber-500/60'
            }`}
          >
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {tile('tai')}
              {tile('xiu')}
            </div>
            {tile('bao', true)}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-black/25 px-4 py-3">
            <div className="text-sm">
              Tổng cược: <span className="text-lg font-extrabold text-amber-300">{fmt(totalBet)}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" className="text-sm" disabled={!betting || !totalBet} onClick={clearBets}>
                ✖ Xoá cược
              </Button>
            </div>
          </div>
          <p className="text-center text-xs text-amber-100/50">Ra bão thì cả Tài lẫn Xỉu đều thua</p>
        </section>
      </div>

      {/* Cầu */}
      <section className="rounded-2xl bg-black/25 p-3">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold tracking-wider text-amber-200/70 uppercase">
          <span>Cầu ({history.length} ván gần nhất)</span>
          {history.length > 0 && (
            <span className="normal-case">
              Tài {history.filter((h) => txOutcome(h.dice) === 'tai').length} · Xỉu {history.filter((h) => txOutcome(h.dice) === 'xiu').length} · Bão{' '}
              {history.filter((h) => txOutcome(h.dice) === 'bao').length}
            </span>
          )}
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-amber-100/40">Chưa có ván nào.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {road.map((h) => {
              const o = txOutcome(h.dice)
              return (
                <motion.div
                  key={h.at}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  title={`${h.dice.join('-')} = ${diceSum(h.dice)} (${h.net > 0 ? '+' : ''}${fmt(h.net)})`}
                  className={`grid size-8 place-items-center rounded-full border-2 text-xs font-extrabold ${
                    o === 'tai' ? 'border-red-300 bg-red-600 text-white' : o === 'xiu' ? 'border-slate-400 bg-slate-100 text-slate-900' : 'border-yellow-200 bg-amber-400 text-red-950'
                  } ${h.net > 0 ? 'ring-2 ring-yellow-300' : ''}`}
                >
                  {diceSum(h.dice)}
                </motion.div>
              )
            })}
          </div>
        )}
      </section>

      <AnimatePresence>
        {editing && (
          <BetDialog
            key={editing}
            title={SIDES[editing].title}
            icon={<span className="text-4xl">{editing === 'bao' ? '🌪️' : '🎲'}</span>}
            headerClass={editing === 'xiu' ? 'from-slate-500 to-slate-800' : SIDES[editing].tile}
            current={bets[editing]}
            available={balance + bets[editing]}
            onConfirm={confirmBet}
            onClose={() => setEditing(null)}
          />
        )}
      </AnimatePresence>

      {revealed && result && result.net > 0 && <CoinRain key={roundId} count={Math.min(60, 15 + Math.floor((result.net / result.totalBet) * 10))} />}
    </div>
  )
}
