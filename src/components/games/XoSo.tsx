import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CHIPS, SHAKE_MS, XS_MAX_TICKETS } from '../../config'
import { fmt } from '../../format'
import { sfx } from '../../game/sound'
import {
  type XsKind,
  type XsRecord,
  type XsResult,
  type XsTicket,
  XS_DIGITS,
  XS_KINDS,
  drawXs,
  randomPick,
  settleXs,
  sumTickets,
  ticketWins,
} from '../../game/xoso'
import type { Phase } from '../Bowl'
import { Button } from '../Button'
import { Chip } from '../Chip'
import { inputCls } from '../Modal'
import { RoundTimer } from '../RoundTimer'
import { StatusBanner } from '../StatusBanner'
import { type GameProps, useAutoRounds, useReportActive } from './shared'

const STATUS: Record<Phase, string> = {
  idle: '',
  shaking: '',
  betting: '',
  revealed: '',
}

/** Lần lượt chốt từng chữ số, trái sang phải (ms) */
const FIRST_DIGIT_MS = 500
const DIGIT_STEP_MS = 550
const REVEAL_DONE_MS = FIRST_DIGIT_MS + DIGIT_STEP_MS * (XS_DIGITS - 1) + 200

/** 1 ô số trên bảng kết quả. Đang quay thì nhảy số ngẫu nhiên (chỉ để hiển thị), đến lượt thì chốt */
function Reel({ digit, settleAt, spinning, tier }: { digit: string | null; settleAt: number; spinning: boolean; tier: 0 | 1 | 2 }) {
  const [shown, setShown] = useState<string | null>(null)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    setSettled(false)
    if (!digit && !spinning) {
      setShown(null)
      return
    }
    const id = window.setInterval(() => setShown(String(Math.floor(Math.random() * 10))), 70)
    if (!digit) return () => window.clearInterval(id)
    const t = window.setTimeout(() => {
      window.clearInterval(id)
      setShown(digit)
      setSettled(true)
      sfx.flip()
    }, settleAt)
    return () => {
      window.clearInterval(id)
      window.clearTimeout(t)
    }
  }, [digit, settleAt, spinning])

  // tier: 2 = thuộc 2 số cuối (Đề), 1 = số thứ 3 từ cuối (Càng), 0 = còn lại
  const ball = tier === 2 ? 'ball-gold' : tier === 1 ? 'ball-gold-soft' : 'ball'
  return (
    <motion.div
      animate={!settled && shown !== null ? { y: [0, -3, 0], rotate: [0, -8, 8, 0] } : settled ? { scale: [1.12, 1], y: 0, rotate: 0 } : { y: 0, rotate: 0 }}
      transition={!settled && shown !== null ? { duration: 0.35, repeat: Infinity } : { duration: 0.25 }}
      className={`relative grid aspect-square w-full place-items-center rounded-full ${ball}`}
    >
      {/* đĩa trắng ghi số */}
      <span className="grid aspect-square w-[62%] place-items-center rounded-full bg-white/90 shadow-[inset_0_1px_3px_rgba(0,0,0,.12)]">
        <span
          className={`text-[clamp(1rem,5.5vw,1.9rem)] leading-none font-bold tabular-nums ${shown === null ? 'text-dim' : settled ? 'text-ink' : 'text-mute'}`}
        >
          {shown ?? '–'}
        </span>
      </span>
    </motion.div>
  )
}

export function XoSo({ balance, setBalance, history, pushHistory, hold, onActiveChange, onNoMoney }: GameProps<XsRecord>) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [tickets, setTickets] = useState<XsTicket[]>([])
  const [result, setResult] = useState<string | null>(null)
  const [settle, setSettle] = useState<XsResult | null>(null)
  const [revealDone, setRevealDone] = useState(false)
  const [roundId, setRoundId] = useState(0)
  const revealing = useRef(false)

  // form đặt phiếu
  const [kind, setKind] = useState<XsKind>('de')
  const [num, setNum] = useState('')
  const [amount, setAmount] = useState(() => Math.min(100, balance))

  const totalBet = sumTickets(tickets)
  const betting = phase === 'betting'
  const revealed = phase === 'revealed'
  const digits = XS_KINDS[kind].digits
  const numOk = num.length === digits
  const full = tickets.length >= XS_MAX_TICKETS
  useReportActive(betting && totalBet > 0, onActiveChange)

  /** Chuẩn bị xong -> mở cược */
  useEffect(() => {
    if (phase !== 'shaking') return
    const t = window.setTimeout(() => setPhase('betting'), SHAKE_MS)
    return () => window.clearTimeout(t)
  }, [phase])
  useEffect(() => {
    if (!revealed) revealing.current = false
  }, [revealed])

  /** Kỳ mới */
  const roll = () => {
    if (phase !== 'idle' && !revealed) return
    setTickets([])
    setResult(null)
    setSettle(null)
    setRevealDone(false)
    setRoundId((r) => r + 1)
    setPhase('shaking')
  }

  /** Thêm phiếu (cùng loại + cùng số thì cộng dồn) */
  const addTicket = () => {
    if (!betting || !numOk || amount <= 0) return
    if (amount > balance) return onNoMoney()
    const i = tickets.findIndex((t) => t.kind === kind && t.num === num)
    if (i < 0 && full) return
    setBalance((b) => b - amount)
    hold({ refund: totalBet + amount })
    setTickets(i >= 0 ? tickets.map((t, j) => (j === i ? { ...t, amount: t.amount + amount } : t)) : [...tickets, { kind, num, amount }])
    setNum('')
    sfx.chip()
  }

  const removeTicket = (i: number) => {
    if (!betting) return
    setBalance((b) => b + tickets[i].amount)
    hold(totalBet - tickets[i].amount > 0 ? { refund: totalBet - tickets[i].amount } : null)
    setTickets(tickets.filter((_, j) => j !== i))
    sfx.remove()
  }

  const clearTickets = () => {
    if (!betting || !totalBet) return
    setBalance((b) => b + totalBet)
    hold(null)
    setTickets([])
    sfx.remove()
  }

  /** Quay thưởng (tự động khi hết giờ) — lúc này mới quay ra kết quả */
  const reveal = () => {
    if (!betting || revealing.current) return
    revealing.current = true
    const r = drawXs()
    const s = settleXs(tickets, r)
    setResult(r)
    setSettle(s)
    setPhase('revealed')
    if (s.payout) setBalance((b) => b + s.payout)
    hold(null)
    pushHistory({ result: r, bet: s.totalBet, net: s.net, at: Date.now() })
    sfx.open()
  }

  /** Chốt xong hết chữ số mới báo thắng/thua */
  useEffect(() => {
    if (!revealed || !settle) return
    const t = window.setTimeout(() => {
      setRevealDone(true)
      if (settle.net > 0) sfx.win(settle.net >= settle.totalBet * 10)
      else if (settle.net < 0) sfx.lose()
    }, REVEAL_DONE_MS)
    return () => window.clearTimeout(t)
  }, [revealed, settle])

  const left = useAutoRounds(phase, roll, reveal)

  const resultLabel = result ? `ĐB ${result}` : undefined

  return (
    <div className="flex flex-col gap-2">
      <div className="grid min-w-0 grid-cols-1 items-start gap-2 lg:grid-cols-[30rem_1fr]">
        {/* Bảng kết quả */}
        <section className="flex flex-col gap-3 rounded-md border border-line bg-panel p-3">
          <RoundTimer phase={phase} left={left} labels={{ shaking: 'Chuẩn bị', next: 'Kỳ mới sau' }} />
          <div>
            <div className="label mb-2">Giải đặc biệt</div>
            <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
              {Array.from({ length: XS_DIGITS }, (_, i) => (
                <Reel
                  key={`${roundId}-${i}`}
                  digit={result ? result[i] : null}
                  settleAt={FIRST_DIGIT_MS + i * DIGIT_STEP_MS}
                  spinning={phase === 'shaking' || phase === 'idle'}
                  tier={i >= XS_DIGITS - 2 ? 2 : i === XS_DIGITS - 3 ? 1 : 0}
                />
              ))}
            </div>
          </div>
          <StatusBanner
            result={revealDone && settle ? { net: settle.net, noBet: !settle.totalBet, label: resultLabel } : null}
            text={STATUS[phase]}
            delay={0}
          />
        </section>

        {/* Đặt phiếu */}
        <section className="flex flex-col rounded-md border border-line bg-panel">
          <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
            <span className="label shrink-0">Đặt phiếu</span>
          </div>

          <div className="flex flex-col gap-2 p-3">
            {/* Loại cược */}
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(XS_KINDS) as XsKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    setKind(k)
                    setNum((n) => n.slice(0, XS_KINDS[k].digits))
                  }}
                  className={`flex h-12 flex-col items-center justify-center rounded-sm border transition-colors ${
                    kind === k ? 'border-gold bg-gold/10 text-ink' : 'border-line bg-panel-2 text-mute hover:border-line-strong'
                  }`}
                >
                  <span className="text-sm font-semibold">{XS_KINDS[k].name}</span>
                  <span className="text-[11px] tabular-nums">
                    {XS_KINDS[k].digits} số · 1:{XS_KINDS[k].payout}
                  </span>
                </button>
              ))}
            </div>

            {/* Số chọn */}
            <label className="label mt-1">Số chọn</label>
            <div className="flex gap-1.5">
              <input
                inputMode="numeric"
                value={num}
                maxLength={digits}
                onChange={(e) => setNum(e.target.value.replace(/\D/g, '').slice(0, digits))}
                onKeyDown={(e) => e.key === 'Enter' && addTicket()}
                placeholder={'0'.repeat(digits)}
                className={`${inputCls} h-12 flex-1 text-2xl font-semibold tracking-[0.3em] tabular-nums`}
              />
              <Button type="button" variant="ghost" className="h-12 shrink-0 text-xs" onClick={() => setNum(randomPick(kind))}>
                Ngẫu nhiên
              </Button>
            </div>

            {/* Tiền cược */}
            <label className="label mt-1">Tiền cược</label>
            <input
              inputMode="numeric"
              value={amount ? fmt(amount) : ''}
              onChange={(e) => setAmount(Number(e.target.value.replace(/\D/g, '')) || 0)}
              onKeyDown={(e) => e.key === 'Enter' && addTicket()}
              placeholder="0"
              className={`${inputCls} h-11 text-lg font-semibold tabular-nums ${amount > balance ? 'border-down focus:border-down' : ''}`}
            />
            <div className="grid grid-cols-3 gap-1.5">
              {CHIPS.map((c) => (
                <Chip key={c} value={c} disabled={amount + c > balance} onClick={() => setAmount((a) => a + c)} />
              ))}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-down">{amount > balance ? 'Vượt quá số dư' : ''}</span>
              {numOk && amount > 0 && (
                <span className="text-mute tabular-nums">
                  Trúng nhận <span className="font-semibold text-up">{fmt(amount * (XS_KINDS[kind].payout + 1))}</span>
                </span>
              )}
            </div>
            <Button className="h-11" disabled={!betting || !numOk || amount <= 0 || amount > balance || (full && !tickets.some((t) => t.kind === kind && t.num === num))} onClick={addTicket}>
              {betting ? `Đặt phiếu ${numOk ? `${XS_KINDS[kind].name} ${num}` : ''}` : 'Chưa mở nhận cược'}
            </Button>
          </div>

          {/* Phiếu đã đặt */}
          <div className="border-t border-line">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="label">Phiếu kỳ này · {tickets.length}</span>
              <Button variant="ghost" className="h-7 px-2.5 text-xs" disabled={!betting || !totalBet} onClick={clearTickets}>
                Huỷ tất cả
              </Button>
            </div>
            {tickets.length === 0 ? (
              <p className="px-3 pb-3 text-sm text-dim">Chưa có phiếu nào.</p>
            ) : (
              <div className="max-h-56 divide-y divide-line overflow-y-auto border-t border-line">
                <AnimatePresence initial={false}>
                  {tickets.map((t, i) => {
                    const won = revealDone && result !== null && ticketWins(t, result)
                    const lost = revealDone && result !== null && !won
                    return (
                      <motion.div
                        key={`${t.kind}-${t.num}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`flex items-center gap-2 px-3 py-1.5 ${lost ? 'opacity-50' : ''}`}
                      >
                        <span className="w-9 shrink-0 text-xs text-mute">{XS_KINDS[t.kind].name}</span>
                        <span className={`w-11 shrink-0 text-base font-bold tracking-wider tabular-nums ${won ? 'text-up' : ''}`}>{t.num}</span>
                        <span className="min-w-0 flex-1 text-right text-sm tabular-nums">{fmt(t.amount)}</span>
                        <span className="w-20 shrink-0 text-right text-sm font-semibold tabular-nums">
                          {won && settle ? (
                            <span className="text-up">+{fmt(settle.perTicket[i] - t.amount)}</span>
                          ) : lost ? (
                            <span className="text-down">{fmt(-t.amount)}</span>
                          ) : betting ? (
                            <button onClick={() => removeTicket(i)} className="text-xs font-medium text-dim hover:text-down">
                              Bỏ
                            </button>
                          ) : (
                            <span className="text-dim">—</span>
                          )}
                        </span>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="flex items-baseline gap-2 border-t border-line px-3 py-2">
            <span className="label">Tổng cược</span>
            <span className="text-base font-semibold text-gold tabular-nums">{fmt(totalBet)}</span>
          </div>
        </section>
      </div>

      {/* Lịch sử */}
      <section className="rounded-md border border-line bg-panel">
        <div className="flex items-center justify-between border-b border-line px-3 py-2">
          <span className="label">Kết quả các kỳ</span>
        </div>
        {history.length === 0 ? (
          <p className="px-3 py-3 text-sm text-dim">Chưa có kỳ nào.</p>
        ) : (
          <div className="max-h-72 divide-y divide-line overflow-y-auto">
            {history.map((h) => (
              <div key={h.at} className="flex items-center gap-2 px-3 py-1.5">
                <span className="w-10 shrink-0 text-xs text-dim tabular-nums">
                  {new Date(h.at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="min-w-0 flex-1 text-base font-semibold tracking-wider tabular-nums">
                  <span className="text-mute">{h.result.slice(0, -2)}</span>
                  <span className="text-gold">{h.result.slice(-2)}</span>
                </span>
                <span className="hidden w-16 shrink-0 text-right text-xs text-dim tabular-nums min-[380px]:inline">{h.bet ? fmt(h.bet) : ''}</span>
                <span className={`w-[4.5rem] shrink-0 text-right text-sm font-semibold tabular-nums ${!h.bet ? 'text-dim' : h.net > 0 ? 'text-up' : h.net < 0 ? 'text-down' : 'text-mute'}`}>
                  {!h.bet ? '—' : `${h.net > 0 ? '+' : ''}${fmt(h.net)}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
