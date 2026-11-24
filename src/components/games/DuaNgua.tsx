import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CHIPS } from '../../config'
import { fmt } from '../../format'
import { type Field, type HrRecord, type RacePlan, HORSES, fmtOdds, hrPayout, makeField, planRace, progressAt } from '../../game/horses'
import { sfx } from '../../game/sound'
import { Button } from '../Button'
import { StatusBanner } from '../StatusBanner'
import { HorseSprite } from './HorseArt'
import { type GameProps, useMainKey, useReportActive } from './shared'

/** betting: đặt cược · racing: đếm ngược và đang chạy · finished: đã về hết, đang xem kết quả */
type HrPhase = 'betting' | 'racing' | 'finished'

/** đếm ngược 3-2-1 trước khi xuất phát */
const COUNT_MS = 1500
/** con cuối về đích xong chờ thêm chút rồi mới mở khoá */
const TAIL_MS = 500
/** về hết rồi chờ bao lâu thì dắt ngựa về vạch xuất phát */
const RESET_MS = 5000
/** thời gian chạy ngược về vạch xuất phát */
const BACK_MS = 900

/** chiều cao 1 làn — nút cược và làn đua dùng chung để thẳng hàng */
const ROW = 'h-11 sm:h-14 short:h-8'

const MEDAL = ['bg-[#d4a72c] text-white', 'bg-[#9aa3ad] text-white', 'bg-[#b0703a] text-white']

const noBets = () => HORSES.map(() => 0)
const sum = (a: number[]) => a.reduce((s, x) => s + x, 0)

function Swatch({ h, className = '' }: { h: number; className?: string }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-xs font-bold text-white ${className}`} style={{ background: HORSES[h].silk }}>
      {h + 1}
    </span>
  )
}

/** Đường đua: tự chạy requestAnimationFrame theo plan, không làm render lại cả game */
function Track({ plan, startAt, running, back, mine }: { plan: RacePlan | null; startAt: number; running: boolean; back: boolean; mine: boolean[] }) {
  const [now, setNow] = useState(() => performance.now())
  useEffect(() => {
    if (!plan || !running) return
    let id = 0
    const loop = () => {
      setNow(performance.now())
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [plan, running])

  const t = plan ? now - startAt : -1
  const prog = HORSES.map((_, h) => (plan ? progressAt(plan, h, t) : 0))
  const racing = !!plan && running && t > 0
  const leader = racing ? prog.indexOf(Math.max(...prog)) : -1
  const count = plan && running && t < 0 ? Math.ceil(-t / (COUNT_MS / 3)) : 0

  return (
    <div className="relative min-w-0 flex-1 overflow-hidden bg-[#3d8b4e] [--hw:2.75rem] sm:[--hw:4.25rem] short:[--hw:2.25rem]">
      {/* vạch xuất phát + đích */}
      <div className="absolute inset-y-0 left-[calc(var(--hw)+0.25rem)] w-0.5 bg-white/60" />
      <div className="absolute inset-y-0 right-4 w-2 bg-[repeating-conic-gradient(#fff_0_25%,#111_0_50%)] bg-[length:8px_8px] opacity-90" />

      {HORSES.map((horse, h) => {
        const p = prog[h]
        const done = !!plan && t >= plan.finish[h]
        const place = plan && done ? plan.order.indexOf(h) : -1
        return (
          <div key={h} className={`relative border-b border-white/15 last:border-b-0 ${ROW} ${mine[h] ? 'bg-white/15' : h % 2 ? 'bg-black/[.04]' : ''}`}>
            <div
              className="absolute bottom-0.5 w-[var(--hw)]"
              style={{
                left: `calc(${p} * (100% - var(--hw) - 1.5rem) + 0.25rem)`,
                // lúc quay về vạch xuất phát thì trượt mượt, lúc đua thì bám theo từng khung hình
                transition: back ? `left ${BACK_MS}ms ease-in-out` : undefined,
              }}
            >
              <HorseSprite
                horse={horse}
                num={h + 1}
                run={(racing && !done) || back}
                pace={0.26 + (h % 3) * 0.03}
                className={`w-full ${back ? '-scale-x-100' : ''}`}
              />
              {place >= 0 && place < 3 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`absolute -top-0.5 -left-1 grid size-4 place-items-center rounded-full text-[9px] font-bold shadow sm:size-5 sm:text-[11px] ${MEDAL[place]}`}
                >
                  {place + 1}
                </motion.span>
              )}
            </div>
          </div>
        )
      })}

      {/* dẫn đầu */}
      {leader >= 0 && (
        <div className="absolute top-1 right-7 rounded-xs bg-black/45 px-1.5 py-0.5 text-[10px] font-semibold text-white sm:text-xs">
          Dẫn đầu: #{leader + 1}
        </div>
      )}

      {/* đếm ngược */}
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            key={count}
            initial={{ scale: 1.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none absolute inset-0 grid place-items-center text-5xl font-bold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,.5)]"
          >
            {count}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function DuaNgua({ balance, setBalance, history, pushHistory, hold, onActiveChange, onNoMoney }: GameProps<HrRecord>) {
  const [phase, setPhase] = useState<HrPhase>('betting')
  const [field, setField] = useState<Field>(makeField)
  /** cược đang đặt cho ván tới (đã trừ vào số dư) */
  const [bets, setBets] = useState<number[]>(noBets)
  /** cược của ván đang chạy / vừa chạy */
  const [raceBets, setRaceBets] = useState<number[] | null>(null)
  const [plan, setPlan] = useState<RacePlan | null>(null)
  const [startAt, setStartAt] = useState(0)
  /** đang dắt ngựa về vạch xuất phát */
  const [back, setBack] = useState(false)
  /** ván vừa chạy (để hiện kết quả) */
  const [last, setLast] = useState<HrRecord | null>(null)
  /** mệnh giá chip đang chọn — bấm vào ngựa là cộng thêm chừng này */
  const [chip, setChip] = useState(CHIPS[2])
  const lastBets = useRef<number[] | null>(null)
  const timers = useRef<number[]>([])
  const pending = useRef<{ payout: number; record: HrRecord } | null>(null)

  const totalBet = sum(bets)
  /** bản mới nhất của cược + số dư, cập nhật ngay khi bấm (không chờ render) — bấm nhanh liên tục vẫn đúng tiền */
  const betsRef = useRef(bets)
  const balanceRef = useRef(balance)
  useEffect(() => {
    betsRef.current = bets
    balanceRef.current = balance
  }, [bets, balance])
  const busy = phase === 'racing'
  // đang đua, hoặc còn tiền cược trên bàn -> khoá thoát ra sảnh
  useReportActive(busy || totalBet > 0, onActiveChange)

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))

  const finalize = () => {
    const p = pending.current
    if (!p) return
    pending.current = null
    hold(null)
    if (p.payout) setBalance((b) => b + p.payout)
    pushHistory(p.record)
  }
  const finalizeRef = useRef(finalize)
  finalizeRef.current = finalize
  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t))
      finalizeRef.current()
    },
    [],
  )

  /** Đổi toàn bộ cược theo hàm make (trừ / hoàn phần chênh lệch) */
  const applyBets = (make: (cur: number[]) => number[]) => {
    const cur = betsRef.current
    const next = make(cur)
    const delta = sum(next) - sum(cur)
    if (delta === 0) return
    if (delta > balanceRef.current) return onNoMoney()
    betsRef.current = next
    balanceRef.current -= delta
    setBalance((b) => b - delta)
    hold(sum(next) > 0 ? { refund: sum(next) } : null)
    setBets(next)
    if (delta > 0) sfx.chip()
    else sfx.remove()
  }

  /** bấm vào ngựa: cộng thêm 1 chip */
  const addBet = (h: number) => {
    if (busy) return
    applyBets((cur) => cur.map((b, i) => (i === h ? b + chip : b)))
  }

  /** bỏ cược 1 ngựa */
  const removeBet = (h: number) => {
    if (busy) return
    applyBets((cur) => cur.map((b, i) => (i === h ? 0 : b)))
  }

  const doubleBets = () => {
    if (busy) return
    applyBets((cur) => cur.map((b) => b * 2))
  }

  const clearBets = () => {
    if (busy) return
    applyBets(() => noBets())
  }

  const rebet = () => {
    const prev = lastBets.current
    if (busy || !prev) return
    applyBets(() => prev)
  }

  const start = () => {
    const bets = betsRef.current
    const totalBet = sum(bets)
    if (busy || totalBet <= 0) return
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []

    // kết quả quyết định ngay lúc xuất phát -> ghi luôn vào tiền treo,
    // tải lại trang giữa chừng cũng không né được ván thua
    const p = planRace(field.probs)
    const winner = p.order[0]
    const odds = field.odds[winner]
    const payout = hrPayout(bets[winner], odds, bets[winner] > 0)
    const record: HrRecord = { bets, winner, odds, win: bets[winner] > 0, bet: totalBet, net: payout - totalBet, at: Date.now() }
    pending.current = { payout, record }
    hold({ refund: payout, record })

    lastBets.current = bets
    setRaceBets(bets)
    betsRef.current = noBets()
    setBets(betsRef.current)
    setPlan(p)
    setStartAt(performance.now() + COUNT_MS)
    setLast(null)
    setBack(false)
    setPhase('racing')
    sfx.chip()

    // đếm ngược
    for (let i = 0; i < 3; i++) later(() => sfx.tick(), (i * COUNT_MS) / 3)
    later(() => {
      sfx.bell()
      sfx.gallop(p.finish[winner])
    }, COUNT_MS)

    // con đầu về đích -> trả thưởng
    later(() => {
      finalize()
      setLast(record)
      if (record.net > 0) sfx.win(odds >= 5)
      else sfx.lose()
    }, COUNT_MS + p.finish[winner] + 150)

    // về hết -> mở kèo ván sau
    const end = COUNT_MS + Math.max(...p.finish) + TAIL_MS
    later(() => {
      setPhase('finished')
      setField(makeField())
    }, end)

    // 5 giây sau quay đầu chạy về vạch xuất phát
    later(() => {
      setPlan(null)
      setRaceBets(null)
      setBack(true)
      setPhase('betting')
    }, end + RESET_MS)
    later(() => setBack(false), end + RESET_MS + BACK_MS)
  }

  /** phím 1-6 cộng chip vào ngựa tương ứng */
  useEffect(() => {
    if (busy) return
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key)
      if (n >= 1 && n <= HORSES.length) addBet(n - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  useMainKey(start, busy || totalBet <= 0)

  /** đang hiện kết quả ván vừa chạy */
  const showing = plan && raceBets ? raceBets : null
  const winner = showing && last ? last.winner : -1
  const mine = HORSES.map((_, h) => (showing ? showing[h] > 0 : bets[h] > 0))

  const result = last
    ? { net: last.net, label: `Ngựa #${last.winner + 1} về nhất · 1:${fmtOdds(last.odds)}` }
    : null
  const hint = busy ? 'Đang đua...' : totalBet > 0 ? `Đã cược ${fmt(totalBet)} — bấm Xuất phát` : 'Chọn mệnh giá, bấm vào số ngựa để cược · cược được nhiều con'

  return (
    <div className="flex flex-col gap-2">
      <section className="flex flex-col gap-2 rounded-md border border-line bg-panel p-2 short:gap-1 short:p-1">
        {/* Nút cược + đường đua, mỗi hàng là 1 ngựa */}
        <div className="relative flex overflow-hidden rounded-sm border border-line">
          <div className="flex w-24 shrink-0 flex-col border-r border-line bg-panel-2 sm:w-36">
            {HORSES.map((_, h) => {
              const amount = showing && !bets[h] ? showing[h] : bets[h]
              const fromRace = !!showing && !bets[h] && showing[h] > 0
              const won = fromRace && h === winner
              const lost = fromRace && winner >= 0 && h !== winner
              return (
                <button
                  key={h}
                  type="button"
                  disabled={busy}
                  onClick={() => addBet(h)}
                  className={`relative flex items-center gap-1.5 border-b border-line px-1.5 text-left transition-colors last:border-b-0 disabled:cursor-default sm:gap-2 sm:px-2 ${ROW} ${
                    h === winner ? 'bg-gold/20' : bets[h] > 0 ? 'bg-gold/10' : 'hover:bg-panel-3 active:bg-panel-3'
                  }`}
                  aria-label={`Cược ngựa số ${h + 1}`}
                >
                  <Swatch h={h} className="size-7 text-base sm:size-9 sm:text-lg short:size-6 short:text-sm" />
                  <div className="min-w-0 flex-1 leading-tight">
                    <motion.div key={field.odds[h]} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] font-semibold text-gold tabular-nums sm:text-sm">
                      1:{fmtOdds(field.odds[h])}
                    </motion.div>
                    {amount > 0 && (
                      <div className={`truncate text-[11px] font-bold tabular-nums sm:text-xs ${won ? 'text-up' : lost ? 'text-dim line-through' : 'text-ink'}`}>
                        {fmt(amount)}
                      </div>
                    )}
                  </div>
                  {/* bỏ cược con này */}
                  {bets[h] > 0 && !busy && (
                    <span
                      role="button"
                      aria-label={`Bỏ cược ngựa số ${h + 1}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        removeBet(h)
                      }}
                      className="grid size-5 shrink-0 place-items-center rounded-full bg-panel-3 text-xs leading-none text-mute hover:bg-down hover:text-white"
                    >
                      ×
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <Track plan={plan} startAt={startAt} running={busy} back={back} mine={mine} />

          {/* Ngựa về nhất — số to giữa màn hình */}
          <AnimatePresence>
            {last && showing && (
              <motion.div
                key={last.at}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute inset-0 grid place-items-center bg-black/35"
              >
                <motion.div
                  initial={{ scale: 0.4, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                  className="flex flex-col items-center gap-1 rounded-md bg-white/95 px-6 py-3 shadow-2xl sm:px-10 sm:py-5 short:px-6 short:py-2"
                >
                  <span className="text-[11px] font-bold tracking-[0.2em] text-mute uppercase sm:text-sm">Về nhất</span>
                  <span
                    className="grid size-20 place-items-center rounded-md text-6xl font-black text-white shadow-inner sm:size-28 sm:text-8xl short:size-16 short:text-5xl"
                    style={{ background: HORSES[last.winner].silk }}
                  >
                    {last.winner + 1}
                  </span>
                  <span className={`text-base font-bold tabular-nums sm:text-xl ${last.net > 0 ? 'text-up' : last.net < 0 ? 'text-down' : 'text-mute'}`}>
                    {last.net > 0 ? `Thắng +${fmt(last.net)}` : last.net < 0 ? `Thua ${fmt(last.net)}` : 'Hoà vốn'}
                  </span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chip + điều khiển: 1 hàng khi đủ rộng (màn ngang), tự xuống dòng khi hẹp */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex items-center gap-1 overflow-x-auto">
            {CHIPS.map((c) => (
              <button
                key={c}
                type="button"
                disabled={busy}
                onClick={() => {
                  setChip(c)
                  sfx.chip()
                }}
                className={`h-8 min-w-11 shrink-0 rounded-full border px-2 text-xs font-bold tabular-nums transition-colors disabled:opacity-40 ${
                  chip === c ? 'border-gold bg-gold text-white' : 'border-line bg-panel-2 text-ink hover:border-gold'
                }`}
              >
                {c >= 1000 ? `${c / 1000}K` : c}
              </button>
            ))}
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
            <div className="mr-auto flex min-w-0 items-baseline gap-1.5">
              <span className="label">Cược</span>
              <span className="truncate text-base font-semibold text-gold tabular-nums">{fmt(totalBet)}</span>
            </div>
            <Button variant="ghost" className="h-8 px-2.5 text-xs sm:px-3" disabled={busy || !totalBet} onClick={clearBets}>
              Huỷ
            </Button>
            <Button variant="ghost" className="h-8 px-2.5 text-xs sm:px-3" disabled={busy || !totalBet || totalBet > balance} onClick={doubleBets}>
              x2
            </Button>
            <Button variant="ghost" className="h-8 px-2.5 text-xs sm:px-3" disabled={busy || !lastBets.current || sum(lastBets.current) - totalBet > balance} onClick={rebet}>
              Cược lại
            </Button>
            <Button className="h-8 min-w-24" disabled={busy || totalBet <= 0} onClick={start}>
              {busy ? 'Đang đua...' : 'Xuất phát'}
            </Button>
          </div>
        </div>

        <div className="short:hidden">
          <StatusBanner result={result} text={hint} delay={0.1} />
        </div>
      </section>

      {/* Lịch sử */}
      <section className="rounded-md border border-line bg-panel">
        <div className="border-b border-line px-3 py-2">
          <span className="label">Lịch sử</span>
        </div>
        {history.length === 0 ? (
          <p className="px-3 py-3 text-sm text-dim">Chưa có ván nào.</p>
        ) : (
          <div className="max-h-60 divide-y divide-line overflow-y-auto">
            {history.map((r) => {
              const picks = r.bets ? r.bets.flatMap((b, i) => (b > 0 ? [i] : [])) : r.pick !== undefined ? [r.pick] : []
              return (
                <div key={r.at} className="flex items-center gap-3 px-3 py-1.5 text-xs">
                  <span className="w-11 shrink-0 text-dim tabular-nums">{new Date(r.at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="flex shrink-0 items-center gap-1 text-mute">
                    Về nhất <Swatch h={r.winner} className="size-5 text-[11px]" />
                  </span>
                  <span className="flex min-w-0 flex-1 items-center gap-1 truncate text-mute">
                    Cược
                    {picks.map((h) => (
                      <Swatch key={h} h={h} className={`size-5 text-[11px] ${h === r.winner ? '' : 'opacity-40'}`} />
                    ))}
                  </span>
                  <span className="w-14 shrink-0 text-right text-dim tabular-nums">{fmt(r.bet)}</span>
                  <span className={`w-16 shrink-0 text-right text-sm font-semibold tabular-nums ${r.net > 0 ? 'text-up' : r.net < 0 ? 'text-down' : 'text-mute'}`}>
                    {r.net > 0 ? '+' : ''}
                    {fmt(r.net)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>

    </div>
  )
}
