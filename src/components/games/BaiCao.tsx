import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { CHIPS } from '../../config'
import { fmt } from '../../format'
import { type BcRecord, type Card, type HandScore, compareHands, newDeck, scoreHand } from '../../game/baicao'
import { sfx } from '../../game/sound'
import { Button } from '../Button'
import { Chip } from '../Chip'
import { inputCls } from '../Modal'
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
  betting: '',
  player: '',
  revealing: '',
  revealed: '',
}

const REVEAL_MS = 1700

function ScoreBadge({ score, delay = 0, win }: { score: HandScore; delay?: number; win?: boolean }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.2 }}
      className={`rounded-xs border px-2 py-0.5 text-xs font-semibold ${
        win ? 'border-gold bg-gold text-white' : score.tier > 1 ? 'border-gold/60 text-gold' : 'border-white/20 bg-black/30 text-white'
      }`}
    >
      {score.label}
    </motion.span>
  )
}

export function BaiCao({ balance, setBalance, history, pushHistory, hold, onActiveChange, onNoMoney }: GameProps<BcRecord>) {
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
  /** bài nhà cái + kết quả được chốt ngay lúc chia (để tải lại trang giữa ván không "né" được ván thua) */
  const round = useRef<{ dealer: Card[]; ps: HandScore; ds: HandScore; outcome: ReturnType<typeof compareHands>; net: number } | null>(null)

  useReportActive(phase === 'player' || phase === 'revealing', onActiveChange)

  /** Trả tiền thắng (gọi khi hiệu ứng lật xong, hoặc ngay khi rời màn hình) */
  const finalize = () => {
    const p = pending.current
    if (!p) return
    pending.current = null
    hold(null)
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
    const deck = newDeck()
    const p = deck.slice(0, 3)
    const d = deck.slice(3, 6)
    const ps = scoreHand(p)
    const ds = scoreHand(d)
    const outcome = compareHands(ps, ds)
    const payout = outcome === 1 ? bet * 2 : outcome === 0 ? bet : 0
    const net = payout - bet
    round.current = { dealer: d, ps, ds, outcome, net }
    pending.current = {
      payout,
      record: { player: ps.label, dealer: ds.label, outcome: outcome === 1 ? 'win' : outcome === 0 ? 'tie' : 'lose', bet, net, at: Date.now() },
    }
    setBalance((b) => b - bet)
    hold({ refund: payout, record: pending.current.record })
    setLockedBet(bet)
    setPlayer(p)
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

  /** Lật bài nhà cái (đã chia sẵn lúc bắt đầu ván) */
  const revealDealer = () => {
    const r = round.current
    if (phase !== 'player' || !player || !r) return
    const { dealer: d, ps, ds, outcome, net } = r

    if (!allFlipped) sfx.flip()
    setFlipped([true, true, true])
    setDealer(d)
    setPhase('revealing')
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
    <div className="mx-auto grid w-full items-start gap-2 lg:grid-cols-[1fr_20rem]">
      {/* Bàn nỉ */}
      <section className="felt relative flex flex-col items-center gap-2 overflow-hidden rounded-md border border-line p-3 sm:py-4">
        {/* Nhà cái */}
        <div className="flex h-6 items-center gap-2">
          <span className="label !text-white/60">Nhà cái</span>
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

        <div className="w-full max-w-md py-1">
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
        <div className="flex h-6 items-center gap-2">
          <span className="label !text-white/60">Bạn</span>
          {playerScore && <ScoreBadge score={playerScore} win={done ? result.outcome === 1 : false} />}
          {phase !== 'betting' && <span className="text-xs text-white/60 tabular-nums">Cược {fmt(lockedBet)}</span>}
        </div>
      </section>

      <div className="flex flex-col gap-2">
        {/* Điều khiển */}
        <section className="flex flex-col rounded-md border border-line bg-panel">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="label">{phase === 'betting' ? 'Đặt cược' : 'Ván đang chơi'}</span>
          </div>
          <div className="flex flex-col gap-2 p-3">
            {phase === 'betting' && (
              <>
                <label className="label">Số tiền</label>
                <input
                  inputMode="numeric"
                  value={bet ? fmt(bet) : ''}
                  onChange={(e) => setBet(Number(e.target.value.replace(/\D/g, '')) || 0)}
                  placeholder="0"
                  className={`${inputCls} h-12 text-left text-2xl font-semibold tabular-nums ${bet > balance ? 'border-down focus:border-down' : ''}`}
                />
                <p className="h-4 text-xs text-down">{bet > balance ? 'Vượt quá số dư' : ''}</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {CHIPS.map((c) => (
                    <Chip
                      key={c}
                      value={c}
                      disabled={bet + c > balance}
                      onClick={() => {
                        setBet((b) => b + c)
                        sfx.chip()
                      }}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <Button variant="ghost" className="h-8 text-xs" onClick={() => setBet(0)}>
                    Xoá
                  </Button>
                  <Button variant="ghost" className="h-8 text-xs" onClick={() => setBet(balance)}>
                    Tối đa
                  </Button>
                </div>
                <Button className="mt-2 h-11" disabled={bet <= 0 || bet > balance} onClick={deal}>
                  Chia bài {bet > 0 ? `· ${fmt(bet)}` : ''}
                </Button>
              </>
            )}
            {phase === 'player' && (
              <>
                <Button
                  variant="ghost"
                  className="h-10"
                  disabled={allFlipped}
                  onClick={() => {
                    setFlipped([true, true, true])
                    sfx.flip()
                  }}
                >
                  Lật hết bài của tôi
                </Button>
                <Button className="h-11" onClick={revealDealer}>
                  Mở bài nhà cái
                </Button>
              </>
            )}
            {phase === 'revealing' && (
              <Button className="h-11" disabled>
                Đang mở bài...
              </Button>
            )}
            {phase === 'revealed' && (
              <Button className="h-11" onClick={newRound}>
                Ván mới
              </Button>
            )}
          </div>
        </section>

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
                <div key={h.at} className="flex items-center justify-between gap-3 px-3 py-1.5 text-xs">
                  <span className="min-w-0 truncate text-mute">
                    {h.player} <span className="text-dim">vs</span> {h.dealer}
                  </span>
                  <span className={`shrink-0 text-sm font-semibold tabular-nums ${h.net > 0 ? 'text-up' : h.net < 0 ? 'text-down' : 'text-mute'}`}>
                    {h.net > 0 ? '+' : ''}
                    {fmt(h.net)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
