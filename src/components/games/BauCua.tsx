import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { SHAKE_MS } from '../../config'
import { fmt } from '../../format'
import { type Bets, type Dice, type RoundRecord, type SettleResult, type SymbolId, emptyBets, rollDice, settle, sumBets } from '../../game/logic'
import { sfx } from '../../game/sound'
import { SYMBOLS, SYMBOL_MAP, SymbolIcon } from '../../game/symbols'
import { BetDialog } from '../BetDialog'
import { BetTile } from '../BetTile'
import { Bowl, DieShell, type Phase } from '../Bowl'
import { Button } from '../Button'
import { CoinRain } from '../CoinRain'
import { RoundTimer } from '../RoundTimer'
import { StatusBanner } from '../StatusBanner'
import { type GameProps, useAutoRounds, useReportActive } from './shared'

const STATUS: Record<Phase, string> = {
  idle: 'Chuẩn bị lắc...',
  shaking: 'Đang lắc...',
  betting: 'Bấm vào con vật để đặt cược — hết giờ sẽ tự khui',
  revealed: '',
}

export function BauCua({ balance, setBalance, history, pushHistory, onActiveChange, onNoMoney }: GameProps<RoundRecord>) {
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
    setBets({ ...bets, [editing]: amount })
    setEditing(null)
    if (amount > 0) sfx.chip()
    else sfx.remove()
  }

  const clearBets = () => {
    if (!betting || !totalBet) return
    setBalance((b) => b + totalBet)
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
    <div className="flex flex-col gap-2 sm:gap-4">
      <div className="grid items-start gap-2 sm:gap-4 lg:gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <section className="flex flex-col items-center gap-2 rounded-2xl border border-amber-400/20 bg-black/20 p-2 sm:gap-4 sm:rounded-3xl sm:p-5">
          <div className="pt-5 pb-2 sm:pt-6 sm:pb-3">
            <Bowl
              phase={phase}
              overlay={<RoundTimer phase={phase} left={left} />}
              hint={betting ? 'Đã lắc xong — mời đặt cược' : undefined}
              dice={[0, 1, 2].map((i) => (
                <DieShell key={`${roundId}-${i}`} index={i} revealed border={SYMBOL_MAP[shown[i]].ring}>
                  <img src={SYMBOL_MAP[shown[i]].img} alt={SYMBOL_MAP[shown[i]].name} draggable={false} className="size-full object-cover" />
                </DieShell>
              )) as [React.ReactNode, React.ReactNode, React.ReactNode]}
            />
          </div>
          <StatusBanner
            result={phase === 'revealed' && result ? (result.totalBet ? result : { net: 0, noBet: true, label: dice?.map((d) => SYMBOL_MAP[d].name).join(' · ') }) : null}
            text={STATUS[phase]}
          />
        </section>

        <section className="flex flex-col gap-2 sm:gap-4">
          <div
            className={`pattern grid grid-cols-3 gap-1.5 rounded-2xl border-2 bg-red-900/60 p-1.5 shadow-2xl transition-colors sm:gap-4 sm:rounded-3xl sm:border-4 sm:p-4 ${
              betting ? 'border-yellow-300 shadow-[0_0_40px_rgba(250,204,21,.35)]' : 'border-amber-500/60'
            }`}
          >
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

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-black/25 px-2 py-2 sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3">
            <div className="text-sm">
              Tổng cược: <span className="text-lg font-extrabold text-amber-300">{fmt(totalBet)}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" className="text-sm" disabled={!betting || !totalBet} onClick={clearBets}>
                ✖ Xoá cược
              </Button>
            </div>
          </div>
          <p className="text-center text-xs text-amber-100/50">Bấm vào con vật đã cược để sửa số tiền hoặc bỏ cược</p>
        </section>
      </div>

      <section className="rounded-xl bg-black/25 p-2 sm:rounded-2xl sm:p-3">
        <div className="mb-2 text-xs font-semibold tracking-wider text-amber-200/70 uppercase">Lịch sử ({history.length} ván gần nhất)</div>
        {history.length === 0 ? (
          <p className="text-sm text-amber-100/40">Chưa có ván nào.</p>
        ) : (
          <div className="flex flex-col gap-1">
            <AnimatePresence initial={false}>
              {history.map((h) => (
                <motion.div
                  key={h.at}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center gap-2 rounded-lg border px-2 py-1 ${
                    !h.bet ? 'border-white/10' : h.net > 0 ? 'border-yellow-400/70 bg-yellow-400/10' : h.net < 0 ? 'border-zinc-500/40 bg-zinc-900/40' : 'border-sky-400/50'
                  }`}
                >
                  <span className="w-10 shrink-0 text-xs tabular-nums text-amber-100/50">
                    {new Date(h.at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="flex shrink-0 gap-1">
                    {h.dice.map((d, i) => (
                      <SymbolIcon key={i} id={d} size={28} />
                    ))}
                  </div>
                  <span className="min-w-0 flex-1 truncate text-xs text-amber-100/70">{h.dice.map((d) => SYMBOL_MAP[d].name).join(' · ')}</span>
                  <span className={`shrink-0 text-sm font-bold tabular-nums ${!h.bet ? 'text-amber-100/40' : h.net > 0 ? 'text-yellow-300' : h.net < 0 ? 'text-zinc-400' : 'text-sky-300'}`}>
                    {!h.bet ? 'không cược' : `${h.net > 0 ? '+' : ''}${fmt(h.net)}`}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      <AnimatePresence>
        {editing && (
          <BetDialog
            key={editing}
            title={SYMBOL_MAP[editing].name}
            icon={<SymbolIcon id={editing} size={52} />}
            headerClass={SYMBOL_MAP[editing].tile}
            current={bets[editing]}
            available={balance + bets[editing]}
            onConfirm={confirmBet}
            onClose={() => setEditing(null)}
          />
        )}
      </AnimatePresence>

      {phase === 'revealed' && result && result.net > 0 && (
        <CoinRain key={roundId} count={Math.min(60, 15 + Math.floor((result.net / result.totalBet) * 10))} />
      )}
    </div>
  )
}
