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
  txParity,
} from '../../game/taixiu'
import { BetDialog } from '../BetDialog'
import { Bowl, type Phase } from '../Bowl'
import { Button } from '../Button'
import { RoundTimer } from '../RoundTimer'
import { StatusBanner } from '../StatusBanner'
import { type GameProps, useAutoRounds, useReportActive } from './shared'

const STATUS: Record<Phase, string> = {
  idle: '',
  shaking: '',
  betting: '',
  revealed: '',
}

const SIDES: Record<TxSide, { title: string; sub: string; odds: string; color: string }> = {
  tai: { title: 'TÀI', sub: 'Tổng 11 – 17', odds: '1:1', color: '#d0473f' },
  xiu: { title: 'XỈU', sub: 'Tổng 4 – 10', odds: '1:1', color: '#2f3640' },
  chan: { title: 'CHẴN', sub: 'Tổng chẵn', odds: '1:1', color: '#3fb27f' },
  le: { title: 'LẺ', sub: 'Tổng lẻ', odds: '1:1', color: '#5b7fd6' },
  bao: { title: 'BÃO', sub: '3 mặt giống nhau', odds: `1:${TX_BAO_PAYOUT}`, color: '#c8a24c' },
}

/** Vị trí chấm (cột, hàng) trên lưới 3x3: 0 = trái/trên, 1 = giữa, 2 = phải/dưới */
const PIPS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[2, 0], [0, 2]],
  3: [[2, 0], [1, 1], [0, 2]],
  4: [[0, 0], [2, 0], [0, 2], [2, 2]],
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
  6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
}

/** Mặt xúc xắc chấm, vẽ theo % nên to nhỏ nào cũng cân và đúng tâm */
export function PipFace({ value }: { value: number }) {
  const red = value === 1 || value === 4
  const d = value === 1 ? 30 : 19 // đường kính chấm, % cạnh mặt
  return (
    <div className="relative size-full">
      {PIPS[value].map(([c, r], i) => (
        <span
          key={i}
          className={`absolute rounded-full ${red ? 'bg-red-600' : 'bg-zinc-900'}`}
          style={{ width: `${d}%`, height: `${d}%`, left: `${24 + c * 26}%`, top: `${24 + r * 26}%`, transform: 'translate(-50%, -50%)' }}
        />
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
    <button
      onClick={onClick}
      className={`relative flex overflow-hidden rounded-sm border bg-panel-2 text-center transition-[border-color,opacity,filter] ${
        compact ? 'h-20 flex-col items-center justify-center gap-0.5 px-4' : 'h-32 flex-col items-center justify-center gap-1 px-4 sm:h-40'
      } ${won ? 'border-gold ring-1 ring-gold' : amount > 0 ? 'border-line-strong' : 'border-line'} ${lost ? 'opacity-40 grayscale' : ''} ${
        locked ? 'cursor-default' : 'cursor-pointer hover:border-gold/70'
      }`}
    >
      <div className="flex flex-col items-center">
        <div className={`font-bold tracking-wider ${compact ? 'text-base' : 'text-3xl sm:text-4xl'}`} style={{ color: s.color }}>
          {s.title}
        </div>
        <div className="truncate text-xs text-mute">
          {s.odds}
        </div>
      </div>
      <div className={`flex items-center justify-center gap-2 ${compact ? '' : 'mt-1'}`}>
        <motion.span key={amount} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className={`text-sm font-semibold tabular-nums ${amount ? 'text-gold' : 'text-dim'}`}>
          {amount ? fmt(amount) : '—'}
        </motion.span>
      </div>
      <AnimatePresence>
        {won && payout > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: [0, 1, 1, 0], y: -18 }}
            transition={{ duration: 1.6, delay: 0.4 }}
            className="pointer-events-none absolute inset-x-0 top-1/3 text-center text-xl font-bold text-gold-hi"
          >
            +{fmt(payout)}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  )
}

export function TaiXiu({ balance, setBalance, history, pushHistory, hold, onActiveChange, onNoMoney }: GameProps<TxRecord>) {
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
    hold(totalBet + delta > 0 ? { refund: totalBet + delta } : null)
    setBets({ ...bets, [editing]: amount })
    setEditing(null)
    if (amount > 0) sfx.chip()
    else sfx.remove()
  }

  const clearBets = () => {
    if (!betting || !totalBet) return
    setBalance((b) => b + totalBet)
    hold(null)
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
    hold(null)
    pushHistory({ dice: d, bet: r.totalBet, net: r.net, at: Date.now() })
    sfx.open()
    window.setTimeout(() => (r.net > 0 ? sfx.win(r.win.bao || r.net >= r.totalBet * 2) : r.net < 0 ? sfx.lose() : undefined), 500)
  }

  const left = useAutoRounds(phase, roll, reveal)

  const shown: TxDice = dice ?? [1, 1, 1]
  const outcome = dice ? txOutcome(dice) : null
  const parity = dice ? txParity(dice) : null
  const outcomeLabel = dice ? `${SIDES[txOutcome(dice)].title}${parity ? ` ${SIDES[parity].title}` : ''} ${diceSum(dice)}` : undefined
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
    <div className="flex flex-col gap-2">
      <div className="grid min-w-0 grid-cols-1 items-start gap-2 lg:grid-cols-[30rem_1fr]">
        {/* Bát */}
        <section className="flex flex-col items-center gap-2 rounded-md border border-line bg-panel p-3">
          <RoundTimer phase={phase} left={left} />
          <div className="relative w-full py-1">
            <Bowl
              phase={phase}
              roundKey={roundId}
              faces={shown.map((v, i) => <PipFace key={i} value={v} />) as [React.ReactNode, React.ReactNode, React.ReactNode]}
            />
            <AnimatePresence>
              {revealed && dice && outcome && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.8, duration: 0.2 }}
                  className="absolute top-1 right-0 z-30 sm:-right-3 flex min-w-14 flex-col items-center rounded-sm border border-line bg-panel px-3 py-1.5 shadow-lg"
                >
                  <span className="text-2xl leading-none font-bold tabular-nums">{diceSum(dice)}</span>
                  <span className="mt-1 text-[10px] font-semibold tracking-wider" style={{ color: SIDES[outcome].color }}>
                    {SIDES[outcome].title}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <StatusBanner result={revealed && result ? { net: result.net, label: outcomeLabel, noBet: !result.totalBet } : null} text={STATUS[phase]} />
        </section>

        {/* Bàn cược */}
        <section className="flex flex-col rounded-md border border-line bg-panel">
          <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
            <span className="label shrink-0">Bàn cược</span>
          </div>
          <div className="flex flex-col gap-1.5 p-2">
            <div className="grid grid-cols-2 gap-1.5">
              {tile('tai')}
              {tile('xiu')}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {tile('chan', true)}
              {tile('le', true)}
            </div>
            {tile('bao', true)}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-line px-3 py-2">
            <div className="flex items-baseline gap-2">
              <span className="label">Tổng cược</span>
              <span className="text-base font-semibold text-gold tabular-nums">{fmt(totalBet)}</span>
            </div>
            <Button variant="ghost" className="h-8 px-3 text-xs" disabled={!betting || !totalBet} onClick={clearBets}>
              Huỷ tất cả cược
            </Button>
          </div>
        </section>
      </div>

      {/* Cầu */}
      <section className="rounded-md border border-line bg-panel">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
          <span className="label">Cầu</span>
          {history.length > 0 && (
            <span className="text-xs text-mute tabular-nums">
              Tài {history.filter((h) => txOutcome(h.dice) === 'tai').length} · Xỉu {history.filter((h) => txOutcome(h.dice) === 'xiu').length} · Bão{' '}
              {history.filter((h) => txOutcome(h.dice) === 'bao').length} · Chẵn {history.filter((h) => txParity(h.dice) === 'chan').length} · Lẻ{' '}
              {history.filter((h) => txParity(h.dice) === 'le').length}
            </span>
          )}
        </div>
        {history.length === 0 ? (
          <p className="px-3 py-3 text-sm text-dim">Chưa có ván nào.</p>
        ) : (
          <div className="flex flex-wrap gap-1 p-2">
            {road.map((h) => {
              const o = txOutcome(h.dice)
              return (
                <div
                  key={h.at}
                  title={`${h.dice.join('-')} = ${diceSum(h.dice)} (${h.net > 0 ? '+' : ''}${fmt(h.net)})`}
                  className={`grid size-7 place-items-center rounded-xs text-[11px] font-semibold tabular-nums ${
                    o === 'tai' ? 'bg-[#d0473f] text-white' : o === 'xiu' ? 'bg-[#2f3640] text-white' : 'bg-gold text-white'
                  } ${h.net > 0 ? 'outline outline-offset-1 outline-up' : ''}`}
                >
                  {diceSum(h.dice)}
                </div>
              )
            })}
          </div>
        )}
      </section>

      <AnimatePresence>
        {editing && (
          <BetDialog
            key={editing}
            title={`${SIDES[editing].title} · ${SIDES[editing].odds}`}
            current={bets[editing]}
            available={balance + bets[editing]}
            onConfirm={confirmBet}
            onClose={() => setEditing(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
