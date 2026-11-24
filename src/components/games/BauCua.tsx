import { useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { SHAKE_MS } from '../../config'
import { fmt } from '../../format'
import { type Bets, type Dice, type RoundRecord, type SettleResult, type SymbolId, emptyBets, rollDice, settle, sumBets } from '../../game/logic'
import { sfx } from '../../game/sound'
import { SYMBOLS, SYMBOL_MAP, SymbolIcon } from '../../game/symbols'
import { BetDialog } from '../BetDialog'
import { BetTile } from '../BetTile'
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

export function BauCua({ balance, setBalance, history, pushHistory, hold, onActiveChange, onNoMoney }: GameProps<RoundRecord>) {
  const [bets, setBets] = useState<Bets>(emptyBets)
  const [phase, setPhase] = useState<Phase>('idle')
  const [dice, setDice] = useState<Dice | null>(null)
  const [roundId, setRoundId] = useState(0)
  const [result, setResult] = useState<SettleResult | null>(null)
  const [editing, setEditing] = useState<SymbolId | null>(null)
  const revealing = useRef(false)

  const totalBet = sumBets(bets)
  const betting = phase === 'betting'
  useReportActive(betting && totalBet > 0, onActiveChange)
  /** Lắc xong -> mở cược. Đặt trong effect để StrictMode/unmount không làm kẹt ở 'shaking' */
  useEffect(() => {
    if (phase !== 'shaking') return
    const t = window.setTimeout(() => setPhase('betting'), SHAKE_MS)
    return () => window.clearTimeout(t)
  }, [phase])

  /** 1. Lắc (chỉ là hiệu ứng — kết quả CHƯA được gieo) */
  const roll = () => {
    if (phase !== 'idle' && phase !== 'revealed') return
    setBets(emptyBets())
    setResult(null)
    setDice(null)
    setRoundId((r) => r + 1)
    setPhase('shaking')
    sfx.shake(SHAKE_MS)
  }

  /** 2. Đặt cược */
  const openBet = (id: SymbolId) => {
    if (!betting) return
    sfx.chip()
    setEditing(id)
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
    setBets(emptyBets())
    sfx.remove()
  }

  /** 3. Khui (tự động khi hết giờ) — lúc này mới gieo xúc xắc */
  const reveal = () => {
    if (!betting || revealing.current) return
    revealing.current = true
    const d = rollDice()
    const r = settle(bets, d)
    setEditing(null)
    setDice(d)
    setResult(r)
    setPhase('revealed')
    if (r.payout) setBalance((b) => b + r.payout)
    hold(null)
    pushHistory({ dice: d, bet: r.totalBet, net: r.net, at: Date.now() })
    sfx.open()
    window.setTimeout(() => (r.net > 0 ? sfx.win(r.net >= r.totalBet * 2) : r.net < 0 ? sfx.lose() : undefined), 500)
  }
  useEffect(() => {
    if (phase !== 'revealed') revealing.current = false
  }, [phase])

  const left = useAutoRounds(phase, roll, reveal)

  const shown: Dice = dice ?? ['nai', 'nai', 'nai']

  return (
    <div className="flex flex-col gap-2">
      <div className="grid min-w-0 grid-cols-1 items-start gap-2 lg:grid-cols-[30rem_1fr]">
        {/* Bát */}
        <section className="flex flex-col items-center gap-2 rounded-md border border-line bg-panel p-3">
          <RoundTimer phase={phase} left={left} />
          <div className="w-full py-1">
            <Bowl
              phase={phase}
              roundKey={roundId}
              faces={shown.map((d) => <img key={d} src={SYMBOL_MAP[d].img} alt={SYMBOL_MAP[d].name} draggable={false} className="size-full object-cover" />) as [React.ReactNode, React.ReactNode, React.ReactNode]}
              borders={shown.map((d) => SYMBOL_MAP[d].ring) as [string, string, string]}
            />
          </div>
          <StatusBanner
            result={
              phase === 'revealed' && result
                ? { net: result.net, noBet: !result.totalBet, label: dice?.map((d) => SYMBOL_MAP[d].name).join(' · ') }
                : null
            }
            text={STATUS[phase]}
          />
        </section>

        {/* Bàn cược */}
        <section className="flex flex-col rounded-md border border-line bg-panel">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="label shrink-0">Bàn cược</span>
          </div>
          <div className={`grid grid-cols-3 gap-1.5 p-2 transition-opacity ${betting ? '' : 'opacity-90'}`}>
            {SYMBOLS.map((s) => (
              <BetTile
                key={s.id}
                sym={s}
                amount={bets[s.id]}
                hits={result?.counts[s.id] ?? 0}
                payout={result?.perSymbol[s.id] ?? 0}
                revealed={phase === 'revealed'}
                locked={!betting}
                onAdd={() => openBet(s.id)}
                onRemove={() => openBet(s.id)}
              />
            ))}
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

      {/* Lịch sử */}
      <section className="rounded-md border border-line bg-panel">
        <div className="flex items-center justify-between border-b border-line px-3 py-2">
          <span className="label">Lịch sử</span>
        </div>
        {history.length === 0 ? (
          <p className="px-3 py-3 text-sm text-dim">Chưa có ván nào.</p>
        ) : (
          <div className="max-h-72 divide-y divide-line overflow-y-auto">
            {history.map((h) => (
              <div key={h.at} className="flex items-center gap-3 px-3 py-1.5">
                <span className="w-11 shrink-0 text-xs text-dim tabular-nums">
                  {new Date(h.at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className="flex shrink-0 gap-1">
                  {h.dice.map((d, i) => (
                    <SymbolIcon key={i} id={d} size={24} className="!rounded-xs" />
                  ))}
                </div>
                <span className="min-w-0 flex-1 truncate text-xs text-mute">{h.dice.map((d) => SYMBOL_MAP[d].name).join(' · ')}</span>
                <span className="w-16 shrink-0 text-right text-xs text-dim tabular-nums">{h.bet ? fmt(h.bet) : ''}</span>
                <span className={`w-20 shrink-0 text-right text-sm font-semibold tabular-nums ${!h.bet ? 'text-dim' : h.net > 0 ? 'text-up' : h.net < 0 ? 'text-down' : 'text-mute'}`}>
                  {!h.bet ? '—' : `${h.net > 0 ? '+' : ''}${fmt(h.net)}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <AnimatePresence>
        {editing && (
          <BetDialog
            key={editing}
            title={SYMBOL_MAP[editing].name}
            icon={<SymbolIcon id={editing} size={32} className="!rounded-xs" />}
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
