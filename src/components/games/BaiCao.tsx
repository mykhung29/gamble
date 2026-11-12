import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CHIPS } from '../../config'
import { fmt } from '../../format'
import { type BcRecord, type Card, type HandScore, compareHands, newDeck, scoreHand } from '../../game/baicao'
import { sfx } from '../../game/sound'
import { Button } from '../Button'
import { Chip } from '../Chip'
import { CardSlot, PlayingCard } from '../PlayingCard'
import { StatusBanner } from '../StatusBanner'
import { type GameProps, useMainKey, useReportActive } from './shared'

type BcPhase = 'betting' | 'player' | 'revealing' | 'revealed'

interface BcResult {
  player: HandScore
  dealer: HandScore
  outcome: 1 | 0 | -1
  net: number
}

const STATUS: Record<BcPhase, string> = {
  betting: 'Nhập tiền cược rồi bấm “Chia bài”',
  player: 'Chạm vào từng lá để nặn bài, xong bấm “Lật bài nhà cái”',
  revealing: 'Nhà cái đang lật bài...',
  revealed: '',
}

const REVEAL_MS = 1700

function ScoreBadge({ score, delay = 0, win }: { score: HandScore; delay?: number; win?: boolean }) {
  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', delay }}
      className={`rounded-full px-3 py-0.5 text-sm font-extrabold shadow ${
        score.tier > 1 ? 'bg-gradient-to-b from-yellow-200 to-amber-500 text-red-900' : win ? 'bg-yellow-300 text-red-900' : 'bg-black/50 text-amber-100'
      }`}
    >
      {score.label}
    </motion.span>
  )
}

export function BaiCao({ balance, setBalance, history, pushHistory, onActiveChange, onNoMoney }: GameProps<BcRecord>) {
  const [phase, setPhase] = useState<BcPhase>('betting')
  const [bet, setBet] = useState(() => Math.min(100, balance))
  const [lockedBet, setLockedBet] = useState(0)
  const [player, setPlayer] = useState<Card[] | null>(null)
  const [flipped, setFlipped] = useState([false, false, false])
  const [dealer, setDealer] = useState<Card[] | null>(null)
  const [result, setResult] = useState<BcResult | null>(null)
  const [roundId, setRoundId] = useState(0)
  const pending = useRef<{ payout: number; record: BcRecord } | null>(null)
  const timer = useRef<number | undefined>(undefined)

  useReportActive(phase === 'player' || phase === 'revealing', onActiveChange)

  /** Trả tiền thắng (gọi khi hiệu ứng lật xong, hoặc ngay khi rời màn hình) */
  const finalize = () => {
    const p = pending.current
    if (!p) return
    pending.current = null
    setBalance((b) => b + p.payout)
    pushHistory(p.record)
  }
  const finalizeRef = useRef(finalize)
  finalizeRef.current = finalize
  useEffect(
    () => () => {
      window.clearTimeout(timer.current)
      finalizeRef.current()
    },
    [],
  )

  const deal = () => {
    if (phase !== 'betting') return
    if (bet <= 0 || bet > balance) return onNoMoney()
    setBalance((b) => b - bet)
    setLockedBet(bet)
    setPlayer(newDeck().slice(0, 3))
    setFlipped([false, false, false])
    setDealer(null)
    setResult(null)
    setRoundId((r) => r + 1)
    setPhase('player')
    sfx.deal()
  }

  const flip = (i: number) => {
    if (phase !== 'player' || flipped[i]) return
    setFlipped(flipped.map((f, j) => f || j === i))
    sfx.flip()
  }

  const allFlipped = flipped.every(Boolean)

  /** Lật bài nhà cái — bài nhà cái được rút lúc này (từ bộ bài mới, bỏ 3 lá của người chơi) */
  const revealDealer = () => {
    if (phase !== 'player' || !player) return
    const used = new Set(player.map((c) => `${c.rank}-${c.suit}`))
    const d = newDeck()
      .filter((c) => !used.has(`${c.rank}-${c.suit}`))
      .slice(0, 3)
    const ps = scoreHand(player)
    const ds = scoreHand(d)
    const outcome = compareHands(ps, ds)
    const payout = outcome === 1 ? lockedBet * 2 : outcome === 0 ? lockedBet : 0
    const net = payout - lockedBet

    if (!allFlipped) sfx.flip()
    setFlipped([true, true, true])
    setDealer(d)
    setPhase('revealing')
    pending.current = {
      payout,
      record: { player: ps.label, dealer: ds.label, outcome: outcome === 1 ? 'win' : outcome === 0 ? 'tie' : 'lose', bet: lockedBet, net, at: Date.now() },
    }
    timer.current = window.setTimeout(() => {
      finalize()
      setResult({ player: ps, dealer: ds, outcome, net })
      setPhase('revealed')
      if (net > 0) sfx.win(ps.tier > 1)
      else if (net < 0) sfx.lose()
    }, REVEAL_MS)
  }

  const newRound = () => {
    setPhase('betting')
    setPlayer(null)
    setDealer(null)
    setResult(null)
    setBet((b) => Math.min(b, balance))
  }

  const mainAction = () => {
    if (phase === 'betting') deal()
    else if (phase === 'player') {
      const next = flipped.indexOf(false)
      if (next >= 0) flip(next)
      else revealDealer()
    } else if (phase === 'revealed') newRound()
  }
  useMainKey(mainAction, false)

  const playerScore = player && allFlipped ? scoreHand(player) : null
  const dealerScore = dealer ? scoreHand(dealer) : null
  const done = phase === 'revealed' && result

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      {/* Bàn nỉ */}
      <section className="felt relative flex flex-col items-center gap-3 overflow-hidden rounded-[2.5rem] border-[6px] border-amber-700 px-3 py-5 shadow-2xl sm:px-6">
        <div className="pointer-events-none absolute inset-3 rounded-[2rem] border-2 border-amber-300/20" />

        {/* Nhà cái */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-wider text-amber-100/80 uppercase">🏦 Nhà cái</span>
          {dealerScore && <ScoreBadge score={dealerScore} delay={1.2} win={done ? result.outcome === -1 : false} />}
        </div>
        <div className="flex gap-2 sm:gap-3">
          {player
            ? [0, 1, 2].map((i) => (
                <PlayingCard
                  key={`${roundId}-d${i}`}
                  card={dealer?.[i]}
                  faceUp={!!dealer}
                  dealDelay={0.15 + i * 0.3 + 0.15}
                  flipDelay={i * 0.35}
                  glow={!!done && result.outcome === -1}
                />
              ))
            : [0, 1, 2].map((i) => <CardSlot key={i} />)}
        </div>

        <div className="w-full">
          <StatusBanner
            result={done ? { net: result.net, label: `${result.player.label} vs ${result.dealer.label}` } : null}
            text={STATUS[phase]}
            delay={0.1}
          />
        </div>

        {/* Người chơi */}
        <div className="flex gap-2 sm:gap-3">
          {player
            ? player.map((c, i) => (
                <PlayingCard
                  key={`${roundId}-p${i}`}
                  card={c}
                  faceUp={flipped[i]}
                  dealDelay={i * 0.3}
                  glow={!!done && result.outcome === 1}
                  onClick={phase === 'player' && !flipped[i] ? () => flip(i) : undefined}
                />
              ))
            : [0, 1, 2].map((i) => <CardSlot key={i} />)}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-wider text-amber-100/80 uppercase">🙋 Bạn</span>
          {playerScore && <ScoreBadge score={playerScore} win={done ? result.outcome === 1 : false} />}
          {phase !== 'betting' && <span className="text-sm text-amber-200/80">· cược {fmt(lockedBet)}</span>}
        </div>
      </section>

      {/* Điều khiển */}
      <section className="flex flex-col gap-3 rounded-3xl border border-amber-400/20 bg-black/25 p-4">
        {phase === 'betting' && (
          <>
            <div className="flex items-center gap-3">
              <label className="shrink-0 text-sm text-amber-100/80">Tiền cược</label>
              <input
                inputMode="numeric"
                value={bet ? fmt(bet) : ''}
                onChange={(e) => setBet(Number(e.target.value.replace(/\D/g, '')) || 0)}
                placeholder="0"
                className={`w-full rounded-xl border-2 bg-black/30 px-4 py-2 text-right text-2xl font-extrabold text-amber-50 outline-none ${
                  bet > balance ? 'border-red-400' : 'border-amber-400/40 focus:border-amber-300'
                }`}
              />
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {CHIPS.map((c) => (
                <Chip
                  key={c}
                  value={c}
                  selected={false}
                  disabled={bet + c > balance}
                  onClick={() => {
                    setBet((b) => b + c)
                    sfx.chip()
                  }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1 text-sm" onClick={() => setBet(0)}>
                Xoá về 0
              </Button>
              <Button variant="ghost" className="flex-1 text-sm" onClick={() => setBet(balance)}>
                🔥 Tất tay
              </Button>
            </div>
            <Button className="py-3 text-xl" disabled={bet <= 0 || bet > balance} onClick={deal}>
              🃏 Chia bài {bet > 0 ? `(${fmt(bet)})` : ''}
            </Button>
            {bet > balance && <p className="text-center text-sm text-red-300">Không đủ điểm!</p>}
          </>
        )}
        {phase === 'player' && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="flex-1 py-3"
              disabled={allFlipped}
              onClick={() => {
                setFlipped([true, true, true])
                sfx.flip()
              }}
            >
              Lật hết bài tôi
            </Button>
            <Button variant="red" className="flex-[2] py-3 text-lg" onClick={revealDealer}>
              🏦 Lật bài nhà cái
            </Button>
          </div>
        )}
        {phase === 'revealing' && (
          <Button className="py-3 text-xl" disabled>
            Đang lật...
          </Button>
        )}
        {phase === 'revealed' && (
          <Button className="py-3 text-xl" onClick={newRound}>
            🔁 Ván mới
          </Button>
        )}
        <p className="text-center text-xs text-amber-100/50">Sáp &gt; Ba Tây &gt; 9 nút … 1 nút &gt; Bù · Thắng 1 ăn 1 · Bằng nhau hoà</p>
      </section>

      {/* Lịch sử */}
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
                  className={`flex shrink-0 flex-col items-center rounded-xl border-2 px-3 py-1 text-xs ${
                    h.outcome === 'win' ? 'border-yellow-400/80 bg-yellow-400/10' : h.outcome === 'lose' ? 'border-zinc-500/50 bg-zinc-900/40' : 'border-sky-400/50'
                  }`}
                >
                  <span className="font-semibold whitespace-nowrap text-amber-100">
                    {h.player} <span className="opacity-50">vs</span> {h.dealer}
                  </span>
                  <span className={`font-bold ${h.net > 0 ? 'text-yellow-300' : h.net < 0 ? 'text-zinc-400' : 'text-sky-300'}`}>
                    {h.net > 0 ? '+' : ''}
                    {fmt(h.net)}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  )
}
