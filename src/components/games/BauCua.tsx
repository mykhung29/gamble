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
  const [lastBets, setLastBets] = useState<Bets | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [dice, setDice] = useState<Dice | null>(null)
  const [roundId, setRoundId] = useState(0)
  const [result, setResult] = useState<SettleResult | null>(null)
  const [editing, setEditing] = useState<SymbolId | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const revealing = useRef(false)

  const totalBet = sumBets(bets)
  const betting = phase === 'betting'
  useReportActive(betting && totalBet > 0, onActiveChange)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  /** 1. Lắc (chỉ là hiệu ứng — kết quả CHƯA được gieo) */
  const roll = () => {
    if (phase !== 'idle' && phase !== 'revealed') return
    setBets(emptyBets())
    setResult(null)
    setDice(null)
    setRoundId((r) => r + 1)
    setPhase('shaking')
    sfx.shake(SHAKE_MS)
    timer.current = window.setTimeout(() => setPhase('betting'), SHAKE_MS)
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

  const repeatBets = () => {
    if (!betting || !lastBets || totalBet > 0) return
    const need = sumBets(lastBets)
    if (need > balance) return onNoMoney()
    setBalance((b) => b - need)
    setBets({ ...lastBets })
    sfx.chip()
  }

  const doubleBets = () => {
    if (!betting || !totalBet) return
    if (totalBet > balance) return onNoMoney()
    setBalance((b) => b - totalBet)
    setBets(Object.fromEntries(Object.entries(bets).map(([k, v]) => [k, v * 2])) as Bets)
    sfx.chip()
  }

  /** 3. Khui (tự động khi hết giờ) — lúc này mới gieo xúc xắc */
  const reveal = () => {
    if (!betting || revealing.current) return
    revealing.current = true
    const d = rollDice()
    const r = settle(bets, d)
    setEditing(null)
    setDice(d)
    if (r.totalBet) setLastBets(bets)
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
    <div className="flex flex-col gap-4">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <section className="flex flex-col items-center gap-4 rounded-3xl border border-amber-400/20 bg-black/20 p-5">
          <div className="py-3">
            <Bowl
              phase={phase}
              hint={betting ? 'Đã lắc xong — mời đặt cược' : undefined}
              dice={[0, 1, 2].map((i) => (
                <DieShell key={`${roundId}-${i}`} index={i} revealed border={SYMBOL_MAP[shown[i]].ring}>
                  <SymbolIcon id={shown[i]} size={50} />
                </DieShell>
              )) as [React.ReactNode, React.ReactNode, React.ReactNode]}
            />
          </div>
          <StatusBanner
            result={phase === 'revealed' && result ? (result.totalBet ? result : { net: 0, noBet: true, label: dice?.map((d) => SYMBOL_MAP[d].name).join(' · ') }) : null}
            text={STATUS[phase]}
          />
          <RoundTimer phase={phase} left={left} />
        </section>

        <section className="flex flex-col gap-4">
          <div
            className={`pattern grid grid-cols-3 gap-3 rounded-3xl border-4 bg-red-900/60 p-3 shadow-2xl transition-colors sm:gap-4 sm:p-4 ${
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

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-black/25 px-4 py-3">
            <div className="text-sm">
              Tổng cược: <span className="text-lg font-extrabold text-amber-300">{fmt(totalBet)}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" className="text-sm" disabled={!betting || !totalBet} onClick={clearBets}>
                ✖ Xoá cược
              </Button>
              <Button variant="ghost" className="text-sm" disabled={!betting || !lastBets || totalBet > 0} onClick={repeatBets}>
                ↺ Cược như ván trước
              </Button>
              <Button variant="ghost" className="text-sm" disabled={!betting || !totalBet} onClick={doubleBets}>
                ×2 Gấp đôi
              </Button>
            </div>
          </div>
          <p className="text-center text-xs text-amber-100/50">Bấm vào con vật đã cược để sửa số tiền hoặc bỏ cược</p>
        </section>
      </div>

      <section className="rounded-2xl bg-black/25 p-3">
        <div className="mb-2 text-xs font-semibold tracking-wider text-amber-200/70 uppercase">Lịch sử ({history.length} ván gần nhất)</div>
        {history.length === 0 ? (
          <p className="text-sm text-amber-100/40">Chưa có ván nào.</p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <AnimatePresence initial={false}>
              {history.map((h) => (
                <motion.div
                  key={h.at}
                  layout
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`flex shrink-0 flex-col items-center rounded-xl border-2 px-2 py-1 ${
                    !h.bet ? 'border-white/10' : h.net > 0 ? 'border-yellow-400/80 bg-yellow-400/10' : h.net < 0 ? 'border-zinc-500/50 bg-zinc-900/40' : 'border-sky-400/50'
                  }`}
                >
                  <div className="flex">
                    {h.dice.map((d, i) => (
                      <SymbolIcon key={i} id={d} size={24} />
                    ))}
                  </div>
                  <span className={`text-xs font-bold ${!h.bet ? 'text-amber-100/40' : h.net > 0 ? 'text-yellow-300' : h.net < 0 ? 'text-zinc-400' : 'text-sky-300'}`}>
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
